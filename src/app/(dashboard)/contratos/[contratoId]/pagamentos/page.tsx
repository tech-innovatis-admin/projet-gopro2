'use client';

import { Fragment, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  AlertCircle,
  Pencil,
  Save,
} from 'lucide-react';
import { MoneyInput } from '../desembolso/_components/MoneyImput';
import { AppModalShell } from '@/components/ui/app-modal-shell';
import { DatePicker } from '@/components/ui/DatePicker';
import { ResizableTable } from '@/components/ui/resizable-table';
import { getUserErrorMessage } from '@/src/lib/feedback/user-messages';
import {
  createCompany,
  createExpense,
  createIncome,
  createPeople,
  createProjectCompany,
  createProjectPeople,
  deleteExpense,
  deleteIncome,
  listBudgetCategories,
  listBudgetItems,
  listBudgetTransfers,
  listCompanies,
  listExpenses,
  listGoals,
  listIncomes,
  listPeople,
  listProjectCompaniesDetailed,
  listProjectPeopleDetailed,
  updateExpense,
  updateIncome,
} from '@/src/lib/api/endpoints';
import { canManageContractChildren, fetchCurrentUser } from '@/src/lib/auth/session';
import type {
  BudgetCategoryResponseDTO,
  BudgetItemResponseDTO,
  BudgetTransferResponseDTO,
  CompanyResponseDTO,
  CompanyRequestDTO,
  ExpenseRequestDTO,
  ExpenseResponseDTO,
  ExpenseUpdateDTO,
  GoalResponseDTO,
  IncomeResponseDTO,
  PageResponseDTO,
  PeopleResponseDTO,
  PeopleRequestDTO,
  ProjectCompanyDetailedResponseDTO,
  ProjectPeopleDetailedResponseDTO,
} from '@/src/lib/api/types';

type ID = string;

const PAGE_SIZE = 20;
const MAX_PAGE_REQUESTS = 1000;

type SubitemLinkType = 'none' | 'person' | 'company';

type Lancamento = {
  id: ID;
  valor: number;
  dataPag: string;
  expenseId?: ID;
};

type Subitem = {
  id: ID;
  empresaRh: string;
  lancamentos: Lancamento[];
  vinculoTipo: SubitemLinkType;
  personId?: ID;
  organizationId?: ID;
};

type ItemRubrica = {
  id: ID;
  categoryId: number;
  descricao: string;
  quantidade: number;
  meses: number;
  valorUnitario: number;
  meta?: string;
  goalId?: number;
  subitens?: Subitem[];
  valorBaseOrcado: number;
  remanejamentoDebito: number;
  remanejamentoCredito: number;
};

type Rubrica = {
  id: ID;
  codigo: string;
  nome: string;
  expanded: boolean;
  itens: ItemRubrica[];
};

type Parcela = {
  id: ID;
  numero: number;
  valorRecebido: number;
  dataRecebimento: string;
};

type ProjectLinkedPerson = {
  projectLinkId: ID;
  personId: ID;
  fullName: string;
  label: string;
};

type ProjectLinkedCompany = {
  projectLinkId: ID;
  companyId: ID;
  name: string;
  label: string;
};

type NewSubitemFormState = {
  nome: string;
  vinculoTipo: SubitemLinkType;
  personId: string;
  organizationId: string;
};

const DEFAULT_NEW_SUBITEM_FORM: NewSubitemFormState = {
  nome: '',
  vinculoTipo: 'none',
  personId: '',
  organizationId: '',
};

type CreatePersonFormState = {
  fullName: string;
  cpf: string;
  email: string;
  phone: string;
  city: string;
  state: string;
};

type CreateCompanyFormState = {
  name: string;
  tradeName: string;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
};

const DEFAULT_CREATE_PERSON_FORM: CreatePersonFormState = {
  fullName: '',
  cpf: '',
  email: '',
  phone: '',
  city: '',
  state: '',
};

const DEFAULT_CREATE_COMPANY_FORM: CreateCompanyFormState = {
  name: '',
  tradeName: '',
  cnpj: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString + 'T00:00:00');
    if (Number.isNaN(date.getTime())) return dateString;
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

function ordinal(n: number) {
  return `${n}°`;
}

const STICKY_ITEM_HEADER_CLASS =
  '!sticky left-0 z-30 bg-white shadow-[6px_0_10px_-8px_rgba(15,23,42,0.25)]';
const STICKY_ITEM_PARENT_CELL_CLASS =
  'sticky left-0 z-20 bg-gray-50 shadow-[6px_0_10px_-8px_rgba(15,23,42,0.18)]';
const STICKY_ITEM_SUBITEM_CELL_CLASS =
  'sticky left-0 z-10 bg-white shadow-[6px_0_10px_-8px_rgba(15,23,42,0.12)] group-hover:bg-gray-50';

function safeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toPositiveInt(value: number | null | undefined, fallback = 1): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.trunc(parsed));
}

function toMoneyValue(value: number | null | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Number(parsed.toFixed(2));
}

function toErrorMessage(error: unknown, fallback: string): string {
  return getUserErrorMessage(error, fallback);
}

function isPersistedId(id: string | null | undefined): id is string {
  return typeof id === 'string' && /^\d+$/.test(id);
}

function parsePersistedId(id: string | null | undefined): number | null {
  if (!isPersistedId(id)) {
    return null;
  }

  const parsed = Number.parseInt(id, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function createDraftId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createDraftLancamento(): Lancamento {
  return {
    id: createDraftId('lanc'),
    valor: 0,
    dataPag: '',
    expenseId: undefined,
  };
}

function createSubitemKey(itemId: ID, subitemId: ID) {
  return `${itemId}::${subitemId}`;
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function companyNameLabel(company: Pick<CompanyResponseDTO, 'tradeName' | 'name'>) {
  return company.tradeName?.trim() || company.name?.trim() || 'Empresa sem nome';
}

function calculateContractBalance(totalRecebido: number, totalPago: number) {
  return Number((totalRecebido - totalPago).toFixed(2));
}

function sortLancamentos(lancamentos: Lancamento[]) {
  return [...lancamentos].sort((a, b) => {
    const dateA = a.dataPag || '9999-12-31';
    const dateB = b.dataPag || '9999-12-31';
    return dateA.localeCompare(dateB) || safeNumber(a.expenseId) - safeNumber(b.expenseId);
  });
}

async function fetchAllPages<T>(
  fetchPage: (query: { page: number; size: number }) => Promise<PageResponseDTO<T>>
): Promise<T[]> {
  const allItems: T[] = [];
  let page = 0;

  for (let i = 0; i < MAX_PAGE_REQUESTS; i += 1) {
    const response = await fetchPage({ page, size: PAGE_SIZE });
    allItems.push(...response.content);
    if (response.last) break;
    page += 1;
  }

  return allItems;
}

export default function PagamentosPlanilhaPage() {
  const params = useParams();
  const contratoId = params.contratoId as string;
  const projectId = useMemo(() => Number.parseInt(contratoId, 10), [contratoId]);

  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [rubricas, setRubricas] = useState<Rubrica[]>([]);
  const [backendExpenses, setBackendExpenses] = useState<ExpenseResponseDTO[]>([]);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [canManageChildren, setCanManageChildren] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPersisting, setIsPersisting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const [isAddingParcela, setIsAddingParcela] = useState(false);
  const [newParcela, setNewParcela] = useState<{ valorRecebido: number; dataRecebimento: string }>({
    valorRecebido: 0,
    dataRecebimento: '',
  });
  const [editingParcelaId, setEditingParcelaId] = useState<ID | null>(null);
  const [editParcelaForm, setEditParcelaForm] = useState<Parcela | null>(null);

  const [projectPeople, setProjectPeople] = useState<ProjectLinkedPerson[]>([]);
  const [projectCompanies, setProjectCompanies] = useState<ProjectLinkedCompany[]>([]);
  const [isLoadingProjectLinks, setIsLoadingProjectLinks] = useState(false);
  const [projectLinksError, setProjectLinksError] = useState<string | null>(null);
  const [isSubitemModalOpen, setIsSubitemModalOpen] = useState(false);
  const [subitemModalItemId, setSubitemModalItemId] = useState<ID | null>(null);
  const [subitemModalEditingContext, setSubitemModalEditingContext] = useState<{
    itemId: ID;
    subitemId: ID;
  } | null>(null);
  const [subitemModalForm, setSubitemModalForm] =
    useState<NewSubitemFormState>(DEFAULT_NEW_SUBITEM_FORM);
  const [subitemModalError, setSubitemModalError] = useState<string | null>(null);
  const [isCreatePersonModalOpen, setIsCreatePersonModalOpen] = useState(false);
  const [isCreateCompanyModalOpen, setIsCreateCompanyModalOpen] = useState(false);
  const [isLinkExistingPersonModalOpen, setIsLinkExistingPersonModalOpen] = useState(false);
  const [isLinkExistingCompanyModalOpen, setIsLinkExistingCompanyModalOpen] = useState(false);
  const [basePeople, setBasePeople] = useState<PeopleResponseDTO[]>([]);
  const [baseCompanies, setBaseCompanies] = useState<CompanyResponseDTO[]>([]);
  const [isLoadingBasePeople, setIsLoadingBasePeople] = useState(false);
  const [isLoadingBaseCompanies, setIsLoadingBaseCompanies] = useState(false);
  const [isEditingSubitens, setIsEditingSubitens] = useState(false);
  const [expandedSubitemKey, setExpandedSubitemKey] = useState<ID | null>(null);
  const [editingLancamentosSubitemKey, setEditingLancamentosSubitemKey] = useState<ID | null>(null);
  const [editingSubitemSession, setEditingSubitemSession] = useState<{
    itemId: ID;
    subitemId: ID;
    subitemKey: ID;
    originalExpenseIds: number[];
  } | null>(null);
  const [parcelaPendingDeletion, setParcelaPendingDeletion] = useState<Parcela | null>(null);
  const [subitemPendingDeletion, setSubitemPendingDeletion] = useState<{
    itemId: ID;
    itemDescricao: string;
    subitem: Subitem;
  } | null>(null);
  const [lancamentoPendingDeletion, setLancamentoPendingDeletion] = useState<{
    itemId: ID;
    itemDescricao: string;
    subitemId: ID;
    subitemNome: string;
    lancamento: Lancamento;
  } | null>(null);
  const pageErrorRef = useRef<HTMLDivElement | null>(null);

  const showSavedMessage = (message: string) => {
    setSavedMessage(message);
    setTimeout(() => setSavedMessage(null), 2500);
  };

  const closeDeleteParcelaModal = () => {
    setParcelaPendingDeletion(null);
  };

  const closeDeleteSubitemModal = () => {
    setSubitemPendingDeletion(null);
  };

  const closeDeleteLancamentoModal = () => {
    setLancamentoPendingDeletion(null);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadAccess() {
      try {
        const user = await fetchCurrentUser();
        if (!cancelled) {
          setCanManageChildren(canManageContractChildren(user));
        }
      } finally {
        if (!cancelled) {
          setLoadingAccess(false);
        }
      }
    }

    void loadAccess();
    return () => {
      cancelled = true;
    };
  }, []);

  const ensureCanManageChildren = () => {
    if (canManageChildren) {
      return true;
    }

    setActionError('Seu perfil pode apenas visualizar esta área do contrato.');
    return false;
  };

  const parcelasOrdenadas = useMemo(
    () => [...parcelas].sort((a, b) => a.numero - b.numero || a.id.localeCompare(b.id)),
    [parcelas]
  );

  const projectPeopleById = useMemo(
    () => new Map(projectPeople.map((person) => [person.personId, person])),
    [projectPeople]
  );
  const projectCompaniesById = useMemo(
    () => new Map(projectCompanies.map((company) => [company.companyId, company])),
    [projectCompanies]
  );
  const linkableBasePeople = useMemo(
    () =>
      basePeople
        .filter((person) => person.isActive && !projectPeopleById.has(String(person.id)))
        .sort((a, b) => a.fullName.localeCompare(b.fullName, 'pt-BR')),
    [basePeople, projectPeopleById]
  );
  const linkableBaseCompanies = useMemo(
    () =>
      baseCompanies
        .filter((company) => company.isActive && !projectCompaniesById.has(String(company.id)))
        .sort((a, b) => {
          const nameA = companyNameLabel(a);
          const nameB = companyNameLabel(b);
          return nameA.localeCompare(nameB, 'pt-BR');
        }),
    [baseCompanies, projectCompaniesById]
  );

  const closeSubitemModal = ({
    discardTransientDraft = true,
  }: {
    discardTransientDraft?: boolean;
  } = {}) => {
    if (discardTransientDraft && subitemModalEditingContext) {
      const selected = findItemAndSubitem(
        subitemModalEditingContext.itemId,
        subitemModalEditingContext.subitemId
      );

      if (
        selected &&
        isTransientSubitem(selected.subitem) &&
        (selected.subitem.lancamentos?.length ?? 0) === 0
      ) {
        discardTransientSubitem(
          subitemModalEditingContext.itemId,
          subitemModalEditingContext.subitemId
        );
      }
    }

    setIsSubitemModalOpen(false);
    setSubitemModalItemId(null);
    setSubitemModalEditingContext(null);
    setSubitemModalForm(DEFAULT_NEW_SUBITEM_FORM);
    setSubitemModalError(null);
    setIsLinkExistingPersonModalOpen(false);
    setIsLinkExistingCompanyModalOpen(false);
  };

  const getSubitemVinculoLabel = useCallback(
    (subitem: Subitem) => {
      if (subitem.vinculoTipo === 'person') {
        return `Pessoa: ${
          projectPeopleById.get(subitem.personId ?? '')?.fullName ?? 'Pessoa vinculada ao projeto'
        }`;
      }

      if (subitem.vinculoTipo === 'company') {
        return `Empresa: ${
          projectCompaniesById.get(subitem.organizationId ?? '')?.name ??
          'Empresa vinculada ao projeto'
        }`;
      }

      return 'Sem vínculo';
    },
    [projectCompaniesById, projectPeopleById]
  );

  const loadProjectLinks = useCallback(async () => {
    if (!Number.isFinite(projectId)) {
      setProjectPeople([]);
      setProjectCompanies([]);
      setProjectLinksError('ID do contrato inválido para carregar vinculos do projeto.');
      return;
    }

    setIsLoadingProjectLinks(true);
    setProjectLinksError(null);

    try {
      const [peopleLinks, companyLinks] = await Promise.all([
        fetchAllPages<ProjectPeopleDetailedResponseDTO>((query) =>
          listProjectPeopleDetailed({ ...query, projectId })
        ),
        fetchAllPages<ProjectCompanyDetailedResponseDTO>((query) =>
          listProjectCompaniesDetailed({ ...query, projectId })
        ),
      ]);

      const mappedPeople = peopleLinks
        .filter((link) => link.isActive && Number.isFinite(link.personId))
        .map<ProjectLinkedPerson>((link) => {
          const fullName = link.personFullName?.trim() || `Pessoa ${link.personId}`;
          const cpf = onlyDigits(link.personCpf ?? '');

          return {
            projectLinkId: String(link.id),
            personId: String(link.personId),
            fullName,
            label: cpf ? `${fullName} • CPF ${cpf}` : fullName,
          };
        })
        .sort((a, b) => a.fullName.localeCompare(b.fullName, 'pt-BR'));

      const mappedCompanies = companyLinks
        .filter((link) => link.isActive && Number.isFinite(link.companyId))
        .map<ProjectLinkedCompany>((link) => {
          const name =
            link.companyTradeName?.trim() || link.companyName?.trim() || `Empresa ${link.companyId}`;
          const cnpj = onlyDigits(link.companyCnpj ?? '');

          return {
            projectLinkId: String(link.id),
            companyId: String(link.companyId),
            name,
            label: cnpj ? `${name} • CNPJ ${cnpj}` : name,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

      setProjectPeople(mappedPeople);
      setProjectCompanies(mappedCompanies);
    } catch (error) {
      setProjectPeople([]);
      setProjectCompanies([]);
      setProjectLinksError(
        toErrorMessage(error, 'Não foi possível carregar as pessoas e empresas vinculadas ao projeto.')
      );
    } finally {
      setIsLoadingProjectLinks(false);
    }
  }, [projectId]);

  const loadBasePeople = useCallback(async () => {
    setIsLoadingBasePeople(true);

    try {
      const people = await fetchAllPages<PeopleResponseDTO>((query) => listPeople(query));
      setBasePeople(people);
    } finally {
      setIsLoadingBasePeople(false);
    }
  }, []);

  const loadBaseCompanies = useCallback(async () => {
    setIsLoadingBaseCompanies(true);

    try {
      const companies = await fetchAllPages<CompanyResponseDTO>((query) => listCompanies(query));
      setBaseCompanies(companies);
    } finally {
      setIsLoadingBaseCompanies(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    setActionError(null);

    if (!Number.isFinite(projectId)) {
      setParcelas([]);
      setRubricas([]);
      setBackendExpenses([]);
      setLoadError('ID do contrato inválido para carregar pagamentos.');
      setIsLoading(false);
      return;
    }

    try {
      const [categories, items, goals, incomes, expenses, transfers] = await Promise.all([
        fetchAllPages<BudgetCategoryResponseDTO>((query) => listBudgetCategories({ ...query, projectId })),
        fetchAllPages<BudgetItemResponseDTO>((query) => listBudgetItems({ ...query, projectId })),
        fetchAllPages<GoalResponseDTO>((query) => listGoals({ ...query, projectId })).catch(
          () => [] as GoalResponseDTO[]
        ),
        fetchAllPages<IncomeResponseDTO>((query) => listIncomes({ ...query, projectId })),
        fetchAllPages<ExpenseResponseDTO>((query) => listExpenses({ ...query, projectId })),
        fetchAllPages<BudgetTransferResponseDTO>((query) => listBudgetTransfers({ ...query, projectId })),
      ]);

      const projectCategories = categories.filter((category) => category.projectId === projectId);
      const categoryIds = new Set(projectCategories.map((category) => category.id));
      const transferBalanceByItem = new Map<number, { debito: number; credito: number }>();

      for (const transfer of transfers) {
        if (transfer.projectId !== projectId) continue;

        const amount = toMoneyValue(transfer.amount);

        const fromItem = transferBalanceByItem.get(transfer.fromItemId) ?? { debito: 0, credito: 0 };
        fromItem.debito = Number((fromItem.debito + amount).toFixed(2));
        transferBalanceByItem.set(transfer.fromItemId, fromItem);

        const toItem = transferBalanceByItem.get(transfer.toItemId) ?? { debito: 0, credito: 0 };
        toItem.credito = Number((toItem.credito + amount).toFixed(2));
        transferBalanceByItem.set(transfer.toItemId, toItem);
      }

      const goalsMap = new Map<number, string>();
      for (const goal of goals) {
        if (goal.projectId !== projectId) continue;
        goalsMap.set(goal.id, `Meta ${goal.numero} - ${goal.titulo}`);
      }

      const parcelasMapped = incomes
        .slice()
        .sort((a, b) => a.numero - b.numero || a.id - b.id)
        .map<Parcela>((income) => ({
          id: String(income.id),
          numero: income.numero,
          valorRecebido: toMoneyValue(income.amount),
          dataRecebimento: income.receivedAt || '',
        }));

      const itemsByCategory = new Map<number, ItemRubrica[]>();
      const itemById = new Map<number, ItemRubrica>();

      for (const item of items) {
        if (!categoryIds.has(item.categoryId)) continue;

        const quantidade = toPositiveInt(item.quantity, 1);
        const meses = toPositiveInt(item.months, 1);
        const fator = quantidade * meses || 1;
        const valorUnitario = toMoneyValue(
          item.unitCost ?? (item.plannedAmount != null ? item.plannedAmount / fator : 0)
        );
        const valorBaseOrcado = toMoneyValue(item.plannedAmount ?? quantidade * meses * valorUnitario);
        const transferBalance = transferBalanceByItem.get(item.id) ?? { debito: 0, credito: 0 };

        const mappedItem: ItemRubrica = {
          id: String(item.id),
          categoryId: item.categoryId,
          descricao: item.description,
          quantidade,
          meses,
          valorUnitario,
          meta: item.goalId ? goalsMap.get(item.goalId) : undefined,
          goalId: item.goalId ?? undefined,
          subitens: [],
          valorBaseOrcado,
          remanejamentoDebito: transferBalance.debito,
          remanejamentoCredito: transferBalance.credito,
        };

        if (!itemsByCategory.has(item.categoryId)) {
          itemsByCategory.set(item.categoryId, []);
        }
        itemsByCategory.get(item.categoryId)!.push(mappedItem);
        itemById.set(item.id, mappedItem);
      }

      const subitemsByItem = new Map<number, Map<string, Subitem>>();
      for (const expense of expenses.slice().sort((a, b) => {
        const dateA = a.expenseDate || a.createdAt || '';
        const dateB = b.expenseDate || b.createdAt || '';
        return dateA.localeCompare(dateB) || a.id - b.id;
      })) {
        const item = itemById.get(expense.budgetItemId);
        if (!item) continue;

        const description = expense.description?.trim() || `Lançamento ${expense.id}`;
        const baseKey = `${expense.personId ?? '0'}|${expense.organizationId ?? '0'}|${description.toLowerCase()}`;

        if (!subitemsByItem.has(expense.budgetItemId)) {
          subitemsByItem.set(expense.budgetItemId, new Map());
        }
        const subitemMap = subitemsByItem.get(expense.budgetItemId)!;

        let subitem = subitemMap.get(baseKey);
        if (!subitem) {
          subitem = {
            id: `sub-${expense.budgetItemId}-${subitemMap.size + 1}`,
            empresaRh: description,
            lancamentos: [],
            vinculoTipo: expense.organizationId
              ? 'company'
              : expense.personId
                ? 'person'
                : 'none',
            personId: expense.personId != null ? String(expense.personId) : undefined,
            organizationId:
              expense.organizationId != null ? String(expense.organizationId) : undefined,
          };
          subitemMap.set(baseKey, subitem);
          item.subitens = [...(item.subitens ?? []), subitem];
        }

        subitem.lancamentos = sortLancamentos([
          ...(subitem.lancamentos ?? []),
          {
            id: `lanc-${expense.id}`,
            valor: toMoneyValue(expense.amount),
            dataPag: expense.expenseDate || '',
            expenseId: String(expense.id),
          },
        ]);
      }

      for (const item of itemById.values()) {
        item.subitens = (item.subitens ?? [])
          .map((subitem) => ({
            ...subitem,
            lancamentos: sortLancamentos(subitem.lancamentos ?? []),
          }))
          .sort((a, b) => a.empresaRh.localeCompare(b.empresaRh, 'pt-BR'));
      }

      const mappedRubricas = projectCategories
        .slice()
        .sort((a, b) => {
          const codeA = a.code || '';
          const codeB = b.code || '';
          return codeA.localeCompare(codeB, 'pt-BR') || a.id - b.id;
        })
        .map<Rubrica>((category) => ({
          id: String(category.id),
          codigo: category.code || `CAT-${category.id}`,
          nome: category.name,
          expanded: true,
          itens: (itemsByCategory.get(category.id) ?? []).sort((a, b) =>
            a.descricao.localeCompare(b.descricao, 'pt-BR')
          ),
        }));

      setParcelas(parcelasMapped);
      setRubricas((previous) => {
        const previousExpanded = new Map(previous.map((rubrica) => [rubrica.id, rubrica.expanded]));
        return mappedRubricas.map((rubrica) => ({
          ...rubrica,
          expanded: previousExpanded.get(rubrica.id) ?? rubrica.expanded,
        }));
      });
      setBackendExpenses(expenses);
    } catch (error) {
      setParcelas([]);
      setRubricas([]);
      setBackendExpenses([]);
      setLoadError(toErrorMessage(error, 'Não foi possível carregar a aba de pagamentos.'));
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    void loadProjectLinks();
  }, [loadProjectLinks]);

  useEffect(() => {
    if (!loadError && !actionError) return;

    pageErrorRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [loadError, actionError]);

  const calcularTotalOrcadoItem = (item: ItemRubrica) => {
    const valorBase =
      safeNumber(item.valorBaseOrcado) ||
      safeNumber(item.quantidade) * safeNumber(item.meses) * safeNumber(item.valorUnitario);

    return Number(
      (
        valorBase -
        safeNumber(item.remanejamentoDebito) +
        safeNumber(item.remanejamentoCredito)
      ).toFixed(2)
    );
  };

  const calcularTotalPagoSubitem = (subitem: Subitem) =>
    (subitem.lancamentos ?? []).reduce((acc, lancamento) => acc + safeNumber(lancamento.valor), 0);

  const obterResumoLancamentosSubitem = (subitem: Subitem) => {
    const lancamentosOrdenados = sortLancamentos(subitem.lancamentos ?? []);
    const ultimaDataPagamento = lancamentosOrdenados.reduce(
      (latest, lancamento) => (lancamento.dataPag && lancamento.dataPag > latest ? lancamento.dataPag : latest),
      ''
    );

    return {
      lancamentosOrdenados,
      quantidade: lancamentosOrdenados.length,
      totalPago: lancamentosOrdenados.reduce((acc, lancamento) => acc + safeNumber(lancamento.valor), 0),
      ultimaDataPagamento,
    };
  };

  const calcularTotalPagoItem = (item: ItemRubrica) =>
    (item.subitens ?? []).reduce((acc, subitem) => acc + calcularTotalPagoSubitem(subitem), 0);

  const contarLancamentosItem = (item: ItemRubrica) =>
    (item.subitens ?? []).reduce((acc, subitem) => acc + (subitem.lancamentos?.length ?? 0), 0);

  const calcularTotalOrcadoRubrica = (rubrica: Rubrica) =>
    rubrica.itens.reduce((acc, item) => acc + calcularTotalOrcadoItem(item), 0);

  const calcularTotalPagoRubrica = (rubrica: Rubrica) =>
    rubrica.itens.reduce((acc, item) => acc + calcularTotalPagoItem(item), 0);

  const totalRecebido = useMemo(
    () => parcelas.reduce((acc, parcela) => acc + safeNumber(parcela.valorRecebido), 0),
    [parcelas]
  );

  const totalPago = rubricas.reduce(
    (accRubrica, rubrica) =>
      accRubrica +
      rubrica.itens.reduce((accItem, item) => accItem + calcularTotalPagoItem(item), 0),
    0
  );

  const saldoTotalContrato = calculateContractBalance(totalRecebido, totalPago);

  const toggleRubrica = (rubricaId: ID) => {
    setRubricas((previous) =>
      previous.map((rubrica) =>
        rubrica.id === rubricaId ? { ...rubrica, expanded: !rubrica.expanded } : rubrica
      )
    );
  };

  const findItemAndSubitem = (itemId: ID, subitemId: ID) => {
    for (const rubrica of rubricas) {
      const item = rubrica.itens.find((entry) => entry.id === itemId);
      if (!item) continue;

      const subitem = (item.subitens ?? []).find((entry) => entry.id === subitemId);
      if (!subitem) {
        return null;
      }

      return { item, subitem };
    }

    return null;
  };

  const isTransientSubitem = (subitem: Subitem) =>
    !(subitem.lancamentos ?? []).some(
      (lancamento) => parsePersistedId(lancamento.expenseId) != null
    );

  const isBlankDraftLancamento = (lancamento: Lancamento) =>
    parsePersistedId(lancamento.expenseId) == null &&
    safeNumber(lancamento.valor) <= 0 &&
    !(lancamento.dataPag || '').trim();

  const removeSubitemFromDraftState = (itemId: ID, subitemId: ID) => {
    setRubricas((previous) =>
      previous.map((rubrica) => ({
        ...rubrica,
        itens: rubrica.itens.map((item) =>
          item.id === itemId
            ? { ...item, subitens: (item.subitens ?? []).filter((subitem) => subitem.id !== subitemId) }
            : item
        ),
      }))
    );
  };

  const discardTransientSubitem = (itemId: ID, subitemId: ID) => {
    const subitemKey = createSubitemKey(itemId, subitemId);

    removeSubitemFromDraftState(itemId, subitemId);
    setEditingSubitemSession((current) =>
      current?.subitemKey === subitemKey ? null : current
    );
    setExpandedSubitemKey((current) => (current === subitemKey ? null : current));
    setEditingLancamentosSubitemKey((current) => (current === subitemKey ? null : current));
    setIsEditingSubitens(false);
  };

  const updateSubitemDraftState = (
    itemId: ID,
    subitemId: ID,
    patch: Pick<Subitem, 'empresaRh' | 'vinculoTipo' | 'personId' | 'organizationId'>
  ) => {
    setRubricas((previous) =>
      previous.map((rubrica) => ({
        ...rubrica,
        itens: rubrica.itens.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            subitens: (item.subitens ?? []).map((subitem) =>
              subitem.id === subitemId
                ? {
                    ...subitem,
                    empresaRh: patch.empresaRh,
                    vinculoTipo: patch.vinculoTipo,
                    personId: patch.personId,
                    organizationId: patch.organizationId,
                  }
                : subitem
            ),
          };
        }),
      }))
    );
  };

  const removeLancamentoFromDraftState = (itemId: ID, subitemId: ID, lancamentoId: ID) => {
    setRubricas((previous) =>
      previous.map((rubrica) => ({
        ...rubrica,
        itens: rubrica.itens.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            subitens: (item.subitens ?? []).map((subitem) =>
              subitem.id === subitemId
                ? {
                    ...subitem,
                    lancamentos: (subitem.lancamentos ?? []).filter(
                      (lancamento) => lancamento.id !== lancamentoId
                    ),
                  }
                : subitem
            ),
          };
        }),
      }))
    );
  };

  const toggleExpandedSubitem = (subitemKey: ID) => {
    if (editingSubitemSession?.subitemKey && editingSubitemSession.subitemKey !== subitemKey) {
      setActionError('Salve ou cancele o subitem em edição antes de abrir outro.');
      return;
    }

    if (editingSubitemSession?.subitemKey === subitemKey && expandedSubitemKey === subitemKey) {
      setActionError('Salve ou cancele o subitem em edição antes de ocultar os lançamentos.');
      return;
    }

    const isClosingCurrent = expandedSubitemKey === subitemKey;
    setActionError(null);
    setExpandedSubitemKey(isClosingCurrent ? null : subitemKey);
    setEditingLancamentosSubitemKey((current) => {
      if (current !== subitemKey) {
        return null;
      }
      return isClosingCurrent ? null : current;
    });
  };

  const beginEditingSubitem = (itemId: ID, subitemId: ID) => {
    if (!ensureCanManageChildren()) return false;

    const subitemKey = createSubitemKey(itemId, subitemId);
    if (editingSubitemSession?.subitemKey && editingSubitemSession.subitemKey !== subitemKey) {
      setActionError('Salve ou cancele o subitem em edição antes de abrir outro.');
      return false;
    }

    const selected = findItemAndSubitem(itemId, subitemId);
    if (!selected) {
      setActionError('Subitem inválido para edição.');
      return false;
    }

    setActionError(null);
    setEditingSubitemSession({
      itemId,
      subitemId,
      subitemKey,
      originalExpenseIds: (selected.subitem.lancamentos ?? [])
        .map((lancamento) => parsePersistedId(lancamento.expenseId))
        .filter((expenseId): expenseId is number => expenseId != null),
    });
    setIsEditingSubitens(true);
    setExpandedSubitemKey(subitemKey);
    setEditingLancamentosSubitemKey(subitemKey);
    return true;
  };

  const cancelEditingSubitem = async () => {
    const currentSession = editingSubitemSession;
    setActionError(null);

    if (!currentSession) {
      applySubitemEditingState();
      return;
    }

    const selected = findItemAndSubitem(currentSession.itemId, currentSession.subitemId);
    if (
      currentSession.originalExpenseIds.length === 0 &&
      selected?.subitem &&
      isTransientSubitem(selected.subitem)
    ) {
      discardTransientSubitem(currentSession.itemId, currentSession.subitemId);
      return;
    }

    setEditingSubitemSession(null);
    applySubitemEditingState({
      keepExpandedSubitemKey: currentSession.subitemKey,
    });
    setIsPersisting(true);
    try {
      await loadData();
    } catch (error) {
      setActionError(toErrorMessage(error, 'Não foi possível cancelar a edição do subitem.'));
    } finally {
      setIsPersisting(false);
    }
  };

  const handleAddParcela = async () => {
    if (!ensureCanManageChildren()) return;
    if (!Number.isFinite(projectId)) {
      setActionError('ID do contrato inválido para criar parcela.');
      return;
    }
    if (!newParcela.dataRecebimento) return;
    if (!newParcela.valorRecebido || newParcela.valorRecebido <= 0) return;

    const nextNumero = (Math.max(0, ...parcelas.map((parcela) => parcela.numero)) || 0) + 1;

    setIsPersisting(true);
    setActionError(null);
    try {
      await createIncome({
        projectId,
        numero: nextNumero,
        amount: toMoneyValue(newParcela.valorRecebido),
        receivedAt: newParcela.dataRecebimento,
      });
      setNewParcela({ valorRecebido: 0, dataRecebimento: '' });
      setIsAddingParcela(false);
      await loadData();
      showSavedMessage('Parcela criada com sucesso.');
    } catch (error) {
      setActionError(toErrorMessage(error, 'Não foi possível criar a parcela.'));
    } finally {
      setIsPersisting(false);
    }
  };

  const handleStartEditParcela = (parcela: Parcela) => {
    if (!ensureCanManageChildren()) return;
    setEditingParcelaId(parcela.id);
    setEditParcelaForm({ ...parcela });
  };

  const handleCancelEditParcela = () => {
    setEditingParcelaId(null);
    setEditParcelaForm(null);
  };

  const handleSaveEditParcela = async () => {
    if (!ensureCanManageChildren()) return;
    if (!editParcelaForm) return;
    if (!editParcelaForm.dataRecebimento) return;
    if (!editParcelaForm.valorRecebido || editParcelaForm.valorRecebido <= 0) return;
    if (!isPersistedId(editParcelaForm.id)) {
      setActionError('Parcela inválida para atualizacao.');
      return;
    }

    setIsPersisting(true);
    setActionError(null);
    try {
      await updateIncome(Number.parseInt(editParcelaForm.id, 10), {
        numero: editParcelaForm.numero,
        amount: toMoneyValue(editParcelaForm.valorRecebido),
        receivedAt: editParcelaForm.dataRecebimento,
      });
      setEditingParcelaId(null);
      setEditParcelaForm(null);
      await loadData();
      showSavedMessage('Parcela atualizada com sucesso.');
    } catch (error) {
      setActionError(toErrorMessage(error, 'Não foi possível atualizar a parcela.'));
    } finally {
      setIsPersisting(false);
    }
  };

  const handleRemoveParcela = async (parcelaId: ID) => {
    if (!ensureCanManageChildren()) return;
    const alvo = parcelas.find((parcela) => parcela.id === parcelaId);
    if (!alvo) return;
    if (parcelaPendingDeletion?.id !== parcelaId) {
      setParcelaPendingDeletion(alvo);
      return;
    }
    if (parcelaPendingDeletion?.id === parcelaId) {
      if (!isPersistedId(parcelaId)) {
        setActionError('Parcela invÃ¡lida para remocao.');
        closeDeleteParcelaModal();
        return;
      }

      setIsPersisting(true);
      setActionError(null);
      try {
        await deleteIncome(Number.parseInt(parcelaId, 10));
        await loadData();
        closeDeleteParcelaModal();
        showSavedMessage('Parcela removida com sucesso.');
      } catch (error) {
        setActionError(toErrorMessage(error, 'NÃ£o foi possÃ­vel remover a parcela.'));
      } finally {
        setIsPersisting(false);
      }
      return;
    }
    if (!isPersistedId(parcelaId)) {
      setActionError('Parcela inválida para remocao.');
      return;
    }

    setIsPersisting(true);
    setActionError(null);
    try {
      await deleteIncome(Number.parseInt(parcelaId, 10));
      await loadData();
      showSavedMessage('Parcela removida com sucesso.');
    } catch (error) {
      setActionError(toErrorMessage(error, 'Não foi possível remover a parcela.'));
    } finally {
      setIsPersisting(false);
    }
  };

  const handleAddSubitem = (itemId: ID) => {
    if (!ensureCanManageChildren()) return;
    if (editingSubitemSession) {
      setSubitemModalError('Salve ou cancele o subitem em edição antes de criar outro.');
      return;
    }

    const nome = subitemModalForm.nome.trim();
    if (!nome) {
      setSubitemModalError('Informe o nome do subitem.');
      return;
    }

    if (subitemModalForm.vinculoTipo === 'person' && !subitemModalForm.personId) {
      setSubitemModalError('Selecione uma pessoa vinculada ao projeto.');
      return;
    }

    if (subitemModalForm.vinculoTipo === 'company' && !subitemModalForm.organizationId) {
      setSubitemModalError('Selecione uma empresa vinculada ao projeto.');
      return;
    }

    const subitem: Subitem = {
      id: createDraftId('sub'),
      empresaRh: nome,
      lancamentos: [],
      vinculoTipo: subitemModalForm.vinculoTipo,
      personId:
        subitemModalForm.vinculoTipo === 'person' ? subitemModalForm.personId : undefined,
      organizationId:
        subitemModalForm.vinculoTipo === 'company'
          ? subitemModalForm.organizationId
          : undefined,
    };

    setRubricas((previous) =>
      previous.map((rubrica) => ({
        ...rubrica,
        itens: rubrica.itens.map((item) =>
          item.id === itemId ? { ...item, subitens: [...(item.subitens ?? []), subitem] } : item
        ),
      }))
    );

    const subitemKey = createSubitemKey(itemId, subitem.id);
    setActionError(null);
    setExpandedSubitemKey(subitemKey);
    setEditingSubitemSession(null);
    setIsEditingSubitens(false);
    setEditingLancamentosSubitemKey(null);
    closeSubitemModal({ discardTransientDraft: false });
    showSavedMessage('Subitem criado. Adicione um lançamento para persisti-lo.');
  };

  const handleStartAddSubitem = (itemId: ID) => {
    if (!ensureCanManageChildren()) return;
    if (isPersisting) return;
    if (editingSubitemSession) {
      setActionError('Salve ou cancele o subitem em edição antes de criar outro.');
      return;
    }

    setActionError(null);
    setSubitemModalEditingContext(null);
    setSubitemModalForm(DEFAULT_NEW_SUBITEM_FORM);
    setSubitemModalError(null);
    setSubitemModalItemId(itemId);
    setIsSubitemModalOpen(true);
  };

  const handleStartEditSubitem = (itemId: ID, subitemId: ID) => {
    if (!ensureCanManageChildren()) return;
    if (isPersisting) return;

    const subitemKey = createSubitemKey(itemId, subitemId);
    if (editingSubitemSession?.subitemKey === subitemKey) {
      setActionError('Salve ou cancele os lançamentos antes de editar o subitem.');
      return;
    }

    if (editingSubitemSession?.subitemKey && editingSubitemSession.subitemKey !== subitemKey) {
      setActionError('Salve ou cancele o subitem em edição antes de editar outro.');
      return;
    }

    const selected = findItemAndSubitem(itemId, subitemId);
    if (!selected) {
      setActionError('Subitem inválido para edição.');
      return;
    }

    setActionError(null);
    setSubitemModalError(null);
    setSubitemModalItemId(itemId);
    setSubitemModalEditingContext({ itemId, subitemId });
    setSubitemModalForm({
      nome: selected.subitem.empresaRh,
      vinculoTipo: selected.subitem.vinculoTipo,
      personId: selected.subitem.personId ?? '',
      organizationId: selected.subitem.organizationId ?? '',
    });
    setIsSubitemModalOpen(true);
  };

  const handleOpenLinkExistingPersonModal = async () => {
    if (!ensureCanManageChildren()) return;

    setSubitemModalError(null);
    setSubitemModalForm((current) => ({
      ...current,
      vinculoTipo: 'person',
      organizationId: '',
    }));

    try {
      await loadBasePeople();
      setIsLinkExistingPersonModalOpen(true);
    } catch (error) {
      setSubitemModalError(
        toErrorMessage(error, 'Não foi possível carregar as pessoas cadastradas na base.')
      );
    }
  };

  const handleOpenLinkExistingCompanyModal = async () => {
    if (!ensureCanManageChildren()) return;

    setSubitemModalError(null);
    setSubitemModalForm((current) => ({
      ...current,
      vinculoTipo: 'company',
      personId: '',
    }));

    try {
      await loadBaseCompanies();
      setIsLinkExistingCompanyModalOpen(true);
    } catch (error) {
      setSubitemModalError(
        toErrorMessage(error, 'Não foi possível carregar as empresas cadastradas na base.')
      );
    }
  };

  const handleLinkExistingPerson = async (personId: number) => {
    if (!Number.isFinite(projectId)) {
      throw new Error('ID do contrato inválido para vincular a pessoa.');
    }

    await createProjectPeople({
      projectId,
      personId,
    });
    await loadProjectLinks();

    const linkedPerson = basePeople.find((person) => person.id === personId);
    setSubitemModalForm((current) => ({
      ...current,
      vinculoTipo: 'person',
      personId: String(personId),
      organizationId: '',
      nome: current.nome.trim() ? current.nome : linkedPerson?.fullName ?? current.nome,
    }));
    setIsLinkExistingPersonModalOpen(false);
    setSubitemModalError(null);
    showSavedMessage('Pessoa vinculada ao projeto com sucesso.');
  };

  const handleLinkExistingCompany = async (companyId: number) => {
    if (!Number.isFinite(projectId)) {
      throw new Error('ID do contrato inválido para vincular a empresa.');
    }

    await createProjectCompany({
      projectId,
      companyId,
    });
    await loadProjectLinks();

    const linkedCompany = baseCompanies.find((company) => company.id === companyId);
    setSubitemModalForm((current) => ({
      ...current,
      vinculoTipo: 'company',
      organizationId: String(companyId),
      personId: '',
      nome: current.nome.trim()
        ? current.nome
        : linkedCompany
          ? companyNameLabel(linkedCompany)
          : current.nome,
    }));
    setIsLinkExistingCompanyModalOpen(false);
    setSubitemModalError(null);
    showSavedMessage('Empresa vinculada ao projeto com sucesso.');
  };

  const handleCreateLinkedPerson = async (payload: PeopleRequestDTO) => {
    if (!Number.isFinite(projectId)) {
      throw new Error('ID do contrato inválido para vincular a pessoa.');
    }

    const createdPerson = await createPeople(payload);
    await createProjectPeople({
      projectId,
      personId: createdPerson.id,
    });
    await loadProjectLinks();

    setSubitemModalForm((current) => ({
      ...current,
      vinculoTipo: 'person',
      personId: String(createdPerson.id),
      organizationId: '',
      nome: current.nome.trim() ? current.nome : createdPerson.fullName,
    }));
    setSubitemModalError(null);
    setIsCreatePersonModalOpen(false);
    showSavedMessage('Pessoa vinculada ao projeto com sucesso.');
  };

  const handleCreateLinkedCompany = async (payload: CompanyRequestDTO) => {
    if (!Number.isFinite(projectId)) {
      throw new Error('ID do contrato inválido para vincular a empresa.');
    }

    const createdCompany = await createCompany(payload);
    await createProjectCompany({
      projectId,
      companyId: createdCompany.id,
    });
    await loadProjectLinks();

    setSubitemModalForm((current) => ({
      ...current,
      vinculoTipo: 'company',
      organizationId: String(createdCompany.id),
      personId: '',
      nome: current.nome.trim()
        ? current.nome
        : createdCompany.tradeName?.trim() || createdCompany.name,
    }));
    setSubitemModalError(null);
    setIsCreateCompanyModalOpen(false);
    showSavedMessage('Empresa vinculada ao projeto com sucesso.');
  };

  const handleSaveSubitemModal = async () => {
    const itemId = subitemModalItemId;
    if (!itemId) {
      setSubitemModalError('Item inválido para salvar o subitem.');
      return;
    }

    const nome = subitemModalForm.nome.trim();
    if (!nome) {
      setSubitemModalError('Informe o nome do subitem.');
      return;
    }

    if (subitemModalForm.vinculoTipo === 'person' && !subitemModalForm.personId) {
      setSubitemModalError('Selecione uma pessoa vinculada ao projeto.');
      return;
    }

    if (subitemModalForm.vinculoTipo === 'company' && !subitemModalForm.organizationId) {
      setSubitemModalError('Selecione uma empresa vinculada ao projeto.');
      return;
    }

    if (!subitemModalEditingContext) {
      handleAddSubitem(itemId);
      return;
    }

    const { subitemId } = subitemModalEditingContext;
    const selected = findItemAndSubitem(itemId, subitemId);
    if (!selected) {
      setSubitemModalError('Subitem inválido para edição.');
      return;
    }

    const nextPersonId =
      subitemModalForm.vinculoTipo === 'person' ? subitemModalForm.personId || undefined : undefined;
    const nextOrganizationId =
      subitemModalForm.vinculoTipo === 'company'
        ? subitemModalForm.organizationId || undefined
        : undefined;

    updateSubitemDraftState(itemId, subitemId, {
      empresaRh: nome,
      vinculoTipo: subitemModalForm.vinculoTipo,
      personId: nextPersonId,
      organizationId: nextOrganizationId,
    });

    const expenseIds = (selected.subitem.lancamentos ?? [])
      .map((lancamento) => parsePersistedId(lancamento.expenseId))
      .filter((expenseId): expenseId is number => expenseId != null);

    if (expenseIds.length === 0) {
      closeSubitemModal({ discardTransientDraft: false });
      showSavedMessage('Subitem atualizado com sucesso.');
      return;
    }

    const budgetItemId = parsePersistedId(selected.item.id);
    if (budgetItemId == null) {
      setSubitemModalError('Item inválido para persistir o subitem.');
      return;
    }

    setIsPersisting(true);
    setSubitemModalError(null);
    try {
      const currentExpenseById = new Map(backendExpenses.map((expense) => [expense.id, expense]));

      for (const expenseId of expenseIds) {
        const currentExpense = currentExpenseById.get(expenseId);
        if (!currentExpense) {
          throw new Error('Não foi possível localizar um dos lançamentos do subitem.');
        }

        await updateExpense(expenseId, {
          projectId,
          budgetItemId,
          categoryId: selected.item.categoryId,
          expenseDate: currentExpense.expenseDate || '',
          quantity: toPositiveInt(currentExpense.quantity, 1),
          amount: toMoneyValue(currentExpense.amount),
          personId: nextPersonId ? Number.parseInt(nextPersonId, 10) : undefined,
          organizationId: nextOrganizationId ? Number.parseInt(nextOrganizationId, 10) : undefined,
          description: nome,
          invoiceNumber: currentExpense.invoiceNumber ?? undefined,
          invoiceDate: currentExpense.invoiceDate ?? undefined,
          documentId: currentExpense.documentId ?? undefined,
        });
      }

      await loadData();
      closeSubitemModal({ discardTransientDraft: false });
      showSavedMessage('Subitem atualizado com sucesso.');
    } catch (error) {
      setSubitemModalError(toErrorMessage(error, 'Não foi possível atualizar o subitem.'));
    } finally {
      setIsPersisting(false);
    }
  };

  const handleRemoveSubitem = async (itemId: ID, subitemId: ID) => {
    if (!ensureCanManageChildren()) return;
    const selected = findItemAndSubitem(itemId, subitemId);
    const itemSelecionado = selected?.item;
    const subitemSelecionado = selected?.subitem;
    if (!itemSelecionado || !subitemSelecionado) return;

    const subitemKey = createSubitemKey(itemId, subitemId);
    if (editingSubitemSession?.subitemKey && editingSubitemSession.subitemKey !== subitemKey) {
      setActionError('Salve ou cancele o subitem em edição antes de excluir outro.');
      return;
    }

    if (
      subitemPendingDeletion?.itemId !== itemId ||
      subitemPendingDeletion.subitem.id !== subitemId
    ) {
      setSubitemPendingDeletion({
        itemId,
        itemDescricao: itemSelecionado.descricao,
        subitem: subitemSelecionado,
      });
      return;
    }

    const expenseIds = (subitemSelecionado.lancamentos ?? [])
      .map((lancamento) => parsePersistedId(lancamento.expenseId))
      .filter((expenseId): expenseId is number => expenseId != null);

    if (expenseIds.length === 0) {
      removeSubitemFromDraftState(itemId, subitemId);
      if (editingSubitemSession?.subitemKey === subitemKey) {
        setEditingSubitemSession(null);
        applySubitemEditingState();
      }
      closeDeleteSubitemModal();
      showSavedMessage('Subitem removido com sucesso.');
      return;
    }

    setIsPersisting(true);
    setActionError(null);
    try {
      for (const expenseId of expenseIds) {
        await deleteExpense(expenseId);
      }

      await loadData();
      if (editingSubitemSession?.subitemKey === subitemKey) {
        setEditingSubitemSession(null);
        applySubitemEditingState();
      }
      closeDeleteSubitemModal();
      showSavedMessage('Subitem removido com sucesso.');
    } catch (error) {
      setActionError(toErrorMessage(error, 'Não foi possível remover o subitem.'));
    } finally {
      setIsPersisting(false);
    }
  };

  const handleAddLancamento = (itemId: ID, subitemId: ID) => {
    if (!ensureCanManageChildren()) return;

    const subitemKey = createSubitemKey(itemId, subitemId);
    if (editingSubitemSession?.subitemKey && editingSubitemSession.subitemKey !== subitemKey) {
      setActionError('Salve ou cancele o subitem em edição antes de editar outro.');
      return;
    }

    if (!beginEditingSubitem(itemId, subitemId)) {
      return;
    }

    setActionError(null);
    setExpandedSubitemKey(subitemKey);
    setEditingLancamentosSubitemKey(subitemKey);
    setRubricas((previous) =>
      previous.map((rubrica) => ({
        ...rubrica,
        itens: rubrica.itens.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            subitens: (item.subitens ?? []).map((subitem) =>
              subitem.id === subitemId
                ? { ...subitem, lancamentos: [...(subitem.lancamentos ?? []), createDraftLancamento()] }
                : subitem
            ),
          };
        }),
      }))
    );
  };

  const handleEditLancamentos = (itemId: ID, subitemId: ID) => {
    if (!ensureCanManageChildren()) return;

    const subitemKey = createSubitemKey(itemId, subitemId);
    if (editingSubitemSession?.subitemKey && editingSubitemSession.subitemKey !== subitemKey) {
      setActionError('Salve ou cancele o subitem em edição antes de editar outro.');
      return;
    }

    if (!beginEditingSubitem(itemId, subitemId)) {
      return;
    }

    setActionError(null);
    setExpandedSubitemKey(subitemKey);
    setEditingLancamentosSubitemKey(subitemKey);
  };

  const handleRemoveLancamento = (itemId: ID, subitemId: ID, lancamentoId: ID) => {
    if (!ensureCanManageChildren()) return;
    const selected = findItemAndSubitem(itemId, subitemId);
    const itemSelecionado = selected?.item;
    const subitemSelecionado = selected?.subitem;
    const lancamentoSelecionado = subitemSelecionado?.lancamentos.find(
      (lancamento) => lancamento.id === lancamentoId
    );
    if (!itemSelecionado || !subitemSelecionado || !lancamentoSelecionado) return;

    const subitemKey = createSubitemKey(itemId, subitemId);
    if (editingSubitemSession?.subitemKey && editingSubitemSession.subitemKey !== subitemKey) {
      setActionError('Salve ou cancele o subitem em edição antes de editar outro.');
      return;
    }

    if (isBlankDraftLancamento(lancamentoSelecionado)) {
      if (!beginEditingSubitem(itemId, subitemId)) {
        return;
      }

      removeLancamentoFromDraftState(itemId, subitemId, lancamentoId);
      closeDeleteLancamentoModal();
      return;
    }

    if (
      lancamentoPendingDeletion?.itemId !== itemId ||
      lancamentoPendingDeletion.subitemId !== subitemId ||
      lancamentoPendingDeletion.lancamento.id !== lancamentoId
    ) {
      setLancamentoPendingDeletion({
        itemId,
        itemDescricao: itemSelecionado.descricao,
        subitemId,
        subitemNome: subitemSelecionado.empresaRh,
        lancamento: lancamentoSelecionado,
      });
      return;
    }

    if (!beginEditingSubitem(itemId, subitemId)) {
      return;
    }

    removeLancamentoFromDraftState(itemId, subitemId, lancamentoId);
    closeDeleteLancamentoModal();
  };

  const updateLancamentoCampo = (
    itemId: ID,
    subitemId: ID,
    lancamentoId: ID,
    patch: Partial<Pick<Lancamento, 'valor' | 'dataPag'>>
  ) => {
    if (!canManageChildren) return;

    setActionError(null);

    setRubricas((previous) =>
      previous.map((rubrica) => ({
        ...rubrica,
        itens: rubrica.itens.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            subitens: (item.subitens ?? []).map((subitem) => {
              if (subitem.id !== subitemId) return subitem;

              return {
                ...subitem,
                lancamentos: (subitem.lancamentos ?? []).map((lancamento) =>
                  lancamento.id === lancamentoId
                    ? {
                        ...lancamento,
                        valor: patch.valor != null ? Math.max(0, safeNumber(patch.valor)) : lancamento.valor,
                        dataPag: patch.dataPag != null ? patch.dataPag : lancamento.dataPag,
                      }
                    : lancamento
                ),
              };
            }),
          };
        }),
      }))
    );
  };

  const applySubitemEditingState = ({
    keepEditingSubitens = false,
    keepExpandedSubitemKey = null,
    keepEditingLancamentosSubitemKey = null,
  }: {
    keepEditingSubitens?: boolean;
    keepExpandedSubitemKey?: ID | null;
    keepEditingLancamentosSubitemKey?: ID | null;
  } = {}) => {
    setIsEditingSubitens(keepEditingSubitens);
    setExpandedSubitemKey(keepExpandedSubitemKey);
    setEditingLancamentosSubitemKey(keepEditingLancamentosSubitemKey);
  };

  const handleSaveSubitens = async () => {
    if (!ensureCanManageChildren()) return;
    if (!Number.isFinite(projectId)) {
      setActionError('ID do contrato inválido para salvar pagamentos.');
      return;
    }

    if (!editingSubitemSession) {
      setActionError('Selecione um subitem para salvar.');
      return;
    }

    const currentSession = editingSubitemSession;
    const selected = findItemAndSubitem(currentSession.itemId, currentSession.subitemId);
    if (!selected) {
      setActionError('Subitem inválido para salvar.');
      return;
    }

    const { item, subitem } = selected;
    const budgetItemId = parsePersistedId(item.id);
    if (budgetItemId == null) {
      setActionError(`Item "${item.descricao}" inválido para persistir.`);
      return;
    }

    const categoryId = item.categoryId;
    if (!Number.isFinite(categoryId)) {
      setActionError(`Categoria inválida para o item "${item.descricao}".`);
      return;
    }

    const description = subitem.empresaRh.trim();
    const personId = subitem.vinculoTipo === 'person' ? parsePersistedId(subitem.personId) : null;
    const organizationId =
      subitem.vinculoTipo === 'company' ? parsePersistedId(subitem.organizationId) : null;

    const currentExpenseById = new Map(backendExpenses.map((expense) => [expense.id, expense]));
    const keepExpenseIds = new Set<number>();
    const createPayloads: ExpenseRequestDTO[] = [];
    const updatePayloads: Array<{ id: number; payload: ExpenseUpdateDTO }> = [];

    for (const lancamento of subitem.lancamentos ?? []) {
      const amount = toMoneyValue(lancamento.valor);
      const expenseDate = (lancamento.dataPag || '').trim();
      const hasAmount = amount > 0;
      const hasDate = expenseDate.length > 0;
      const expenseId = parsePersistedId(lancamento.expenseId);

      if (!hasAmount && !hasDate) {
        continue;
      }

      if (!hasAmount || !hasDate) {
        setActionError(
          `Informe valor e data válidos para salvar o lançamento no subitem "${description || item.descricao}".`
        );
        return;
      }

      if (!description) {
        setActionError(`Informe o nome do subitem no item "${item.descricao}".`);
        return;
      }

      if (subitem.vinculoTipo === 'person' && !personId) {
        setActionError(`Selecione uma pessoa vinculada ao projeto para o subitem "${description}".`);
        return;
      }

      if (subitem.vinculoTipo === 'company' && !organizationId) {
        setActionError(`Selecione uma empresa vinculada ao projeto para o subitem "${description}".`);
        return;
      }

      if (expenseId != null) {
        keepExpenseIds.add(expenseId);
        const currentExpense = currentExpenseById.get(expenseId);

        if (currentExpense == null) {
          createPayloads.push({
            projectId,
            budgetItemId,
            categoryId,
            expenseDate,
            quantity: 1,
            amount,
            personId: personId ?? undefined,
            organizationId: organizationId ?? undefined,
            description,
          });
          continue;
        }

        {
          const payload: ExpenseUpdateDTO = {
            projectId,
            budgetItemId,
            categoryId,
            expenseDate,
            quantity: toPositiveInt(currentExpense.quantity, 1),
            amount,
            personId: personId ?? undefined,
            organizationId: organizationId ?? undefined,
            description,
            invoiceNumber: currentExpense.invoiceNumber ?? undefined,
            invoiceDate: currentExpense.invoiceDate ?? undefined,
            documentId: currentExpense.documentId ?? undefined,
          };

          const shouldUpdate =
            currentExpense.projectId !== payload.projectId ||
            currentExpense.budgetItemId !== payload.budgetItemId ||
            currentExpense.categoryId !== payload.categoryId ||
            (currentExpense.expenseDate || '') !== payload.expenseDate ||
            toPositiveInt(currentExpense.quantity, 1) !== payload.quantity ||
            toMoneyValue(currentExpense.amount) !== payload.amount ||
            (currentExpense.personId ?? null) !== (payload.personId ?? null) ||
            (currentExpense.organizationId ?? null) !== (payload.organizationId ?? null) ||
            (currentExpense.description || '') !== (payload.description || '');

          if (shouldUpdate) {
            updatePayloads.push({ id: expenseId, payload });
          }
        }
      } else {
        createPayloads.push({
          projectId,
          budgetItemId,
          categoryId,
          expenseDate,
          quantity: 1,
          amount,
          personId: personId ?? undefined,
          organizationId: organizationId ?? undefined,
          description,
        });
      }
    }

    const hasFilledLancamentos = createPayloads.length > 0 || keepExpenseIds.size > 0;
    if (!hasFilledLancamentos && currentSession.originalExpenseIds.length === 0) {
      setActionError(
        `Adicione ao menos um lançamento com valor e data válidos para salvar o subitem "${description || item.descricao}".`
      );
      return;
    }

    const deleteIds = currentSession.originalExpenseIds.filter(
      (expenseId) => !keepExpenseIds.has(expenseId)
    );

    const totalOperations = createPayloads.length + updatePayloads.length + deleteIds.length;
    if (totalOperations === 0) {
      setEditingSubitemSession(null);
      applySubitemEditingState({
        keepExpandedSubitemKey: currentSession.subitemKey,
      });
      showSavedMessage('Nenhuma alteração pendente para salvar.');
      return;
    }

    setIsPersisting(true);
    setActionError(null);

    try {
      for (const payload of createPayloads) {
        await createExpense(payload);
      }

      for (const { id, payload } of updatePayloads) {
        await updateExpense(id, payload);
      }

      for (const id of deleteIds) {
        await deleteExpense(id);
      }

      await loadData();
      setEditingSubitemSession(null);
      applySubitemEditingState({
        keepExpandedSubitemKey: currentSession.subitemKey,
      });
      showSavedMessage('Subitem salvo com sucesso.');
    } catch (error) {
      setActionError(toErrorMessage(error, 'Não foi possível salvar o subitem.'));
    } finally {
      setIsPersisting(false);
    }
    return;

    /*
    for (const rubrica of rubricas) {
      for (const item of rubrica.itens) {
        const budgetItemId = parsePersistedId(item.id);
        if (!budgetItemId) {
          validationErrors.push(`Item "${item.descricao}" inválido para persistencia.`);
          continue;
        }

        const categoryId = item.categoryId;
        if (!Number.isFinite(categoryId)) {
          validationErrors.push(`Categoria inválida para o item "${item.descricao}".`);
          continue;
        }

        for (const subitem of item.subitens ?? []) {
          const description = subitem.empresaRh.trim();
          const personId =
            subitem.vinculoTipo === 'person' ? parsePersistedId(subitem.personId) : null;
          const organizationId =
            subitem.vinculoTipo === 'company'
              ? parsePersistedId(subitem.organizationId)
              : null;

          for (const lancamento of subitem.lancamentos ?? []) {
            const amount = toMoneyValue(lancamento.valor);
            const expenseDate = (lancamento.dataPag || '').trim();
            const hasAmount = amount > 0;
            const hasDate = expenseDate.length > 0;
            const expenseId = parsePersistedId(lancamento.expenseId);

            if (!hasAmount && !hasDate) {
              continue;
            }

            if (!hasAmount || !hasDate) {
              validationErrors.push(
                `Preencha valor e data no subitem "${description || item.descricao}".`
              );
              continue;
            }

            if (!description) {
              validationErrors.push(`Informe o nome do subitem no item "${item.descricao}".`);
              continue;
            }

            if (subitem.vinculoTipo === 'person' && !personId) {
              validationErrors.push(
                `Selecione uma pessoa vinculada ao projeto para o subitem "${description}".`
              );
              continue;
            }

            if (subitem.vinculoTipo === 'company' && !organizationId) {
              validationErrors.push(
                `Selecione uma empresa vinculada ao projeto para o subitem "${description}".`
              );
              continue;
            }

            if (expenseId) {
              keepExpenseIds.add(expenseId);
              const currentExpense = currentExpenseById.get(expenseId);

              if (!currentExpense) {
                createPayloads.push({
                  projectId,
                  budgetItemId,
                  categoryId,
                  expenseDate,
                  quantity: 1,
                  amount,
                  personId: personId ?? undefined,
                  organizationId: organizationId ?? undefined,
                  description,
                });
                continue;
              }

              const payload: ExpenseUpdateDTO = {
                projectId,
                budgetItemId,
                categoryId,
                expenseDate,
                quantity: toPositiveInt(currentExpense.quantity, 1),
                amount,
                personId: personId ?? undefined,
                organizationId: organizationId ?? undefined,
                description,
                invoiceNumber: currentExpense.invoiceNumber ?? undefined,
                invoiceDate: currentExpense.invoiceDate ?? undefined,
                documentId: currentExpense.documentId ?? undefined,
              };

              const shouldUpdate =
                currentExpense.projectId !== payload.projectId ||
                currentExpense.budgetItemId !== payload.budgetItemId ||
                currentExpense.categoryId !== payload.categoryId ||
                (currentExpense.expenseDate || '') !== payload.expenseDate ||
                toPositiveInt(currentExpense.quantity, 1) !== payload.quantity ||
                toMoneyValue(currentExpense.amount) !== payload.amount ||
                (currentExpense.personId ?? null) !== (payload.personId ?? null) ||
                (currentExpense.organizationId ?? null) !== (payload.organizationId ?? null) ||
                (currentExpense.description || '') !== (payload.description || '');

              if (shouldUpdate) {
                updatePayloads.push({ id: expenseId, payload });
              }
            } else {
              createPayloads.push({
                projectId,
                budgetItemId,
                categoryId,
                expenseDate,
                quantity: 1,
                amount,
                personId: personId ?? undefined,
                organizationId: organizationId ?? undefined,
                description,
              });
            }
          }
        }
      }
    }

    legacy global save flow removido
      const options = {
        keepEditingSubitens: false,
        keepExpandedSubitemKey: null as ID | null,
        keepEditingLancamentosSubitemKey: null as ID | null,
      };

    if (validationErrors.length > 0) {
      setActionError(validationErrors[0]);
      return;
    }

    const deleteIds = backendExpenses
      .map((expense) => expense.id)
      .filter((expenseId) => !keepExpenseIds.has(expenseId));

    const keepEditingSubitensAfterSave = options.keepEditingSubitens ?? false;
    const keepExpandedSubitemKeyAfterSave = options.keepExpandedSubitemKey ?? null;
    const keepEditingLancamentosSubitemKeyAfterSave =
      options.keepEditingLancamentosSubitemKey ?? null;

    const totalOperations = createPayloads.length + updatePayloads.length + deleteIds.length;
    if (totalOperations === 0) {
      await loadData();
      applySubitemEditingState({
        keepEditingSubitens: keepEditingSubitensAfterSave,
        keepExpandedSubitemKey: keepExpandedSubitemKeyAfterSave,
        keepEditingLancamentosSubitemKey: keepEditingLancamentosSubitemKeyAfterSave,
      });
      showSavedMessage('Nenhuma alteração pendente para salvar.');
      return;
    }

    setIsPersisting(true);
    setActionError(null);

    try {
      for (const payload of createPayloads) {
        await createExpense(payload);
      }

      for (const { id, payload } of updatePayloads) {
        await updateExpense(id, payload);
      }

      for (const id of deleteIds) {
        await deleteExpense(id);
      }

      await loadData();
      applySubitemEditingState({
        keepEditingSubitens: keepEditingSubitensAfterSave,
        keepExpandedSubitemKey: keepExpandedSubitemKeyAfterSave,
        keepEditingLancamentosSubitemKey: keepEditingLancamentosSubitemKeyAfterSave,
      });
      showSavedMessage('Pagamentos salvos com sucesso.');
    } catch (error) {
      setActionError(toErrorMessage(error, 'Não foi possível salvar os pagamentos.'));
    } finally {
      setIsPersisting(false);
    }
    */
  };

  return (
    <div ref={pageErrorRef} className="space-y-6 scroll-mt-24">
      {isLoading && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Carregando pagamentos...
        </div>
      )}

      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-800">{loadError}</p>
          <button
            type="button"
            onClick={() => void loadData()}
            className="mt-2 inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {actionError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {actionError}
        </div>
      )}

      {savedMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {savedMessage}
        </div>
      )}

      <div className="rounded-lg bg-gray-50 p-4">
        <h4 className="mb-3 font-medium text-gray-900">Resumo Financeiro</h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-xs text-gray-500">Total Recebido</p>
            <p className="text-xl font-semibold text-gray-900">{formatCurrency(totalRecebido)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-xs text-gray-500">Total Pago</p>
            <p className="text-xl font-semibold text-gray-900">{formatCurrency(totalPago)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-xs text-gray-500">Saldo Total do Contrato</p>
            <p className={`text-xl font-semibold ${saldoTotalContrato < 0 ? 'text-red-600' : 'text-blue-600'}`}>
              {formatCurrency(saldoTotalContrato)}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
          <div>
            <h4 className="font-medium text-gray-900">Parcelas recebidas</h4>
          </div>

          {!isAddingParcela && canManageChildren && !loadingAccess && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddingParcela(true)}
                disabled={isPersisting || isLoading || Boolean(loadError)}
                className="flex items-center gap-2 rounded-lg bg-[#004225] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#003319]"
              >
                <Plus className="h-4 w-4" />
                Nova Parcela
              </button>
            </div>
          )}
        </div>

        {canManageChildren && isAddingParcela && (
          <div className="border-t border-gray-200 bg-emerald-50 p-4">
            <div className="mb-3 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Valor recebido <span className="text-red-500">*</span>
                </label>
                <MoneyInput
                  valueCents={Math.round(newParcela.valorRecebido * 100)}
                  onValueChange={(cents) =>
                    setNewParcela((current) => ({ ...current, valorRecebido: cents / 100 }))
                  }
                  disabled={isPersisting}
                  className="w-full rounded-lg border border-emerald-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Data de recebimento <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  value={newParcela.dataRecebimento}
                  onChange={(value) =>
                    setNewParcela((current) => ({ ...current, dataRecebimento: value }))
                  }
                  disabled={isPersisting}
                  className="rounded-lg border-emerald-300 focus-within:border-emerald-500 focus-within:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAddParcela}
                disabled={isPersisting || !newParcela.dataRecebimento || newParcela.valorRecebido <= 0}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Criar
              </button>
              <button
                onClick={() => {
                  setIsAddingParcela(false);
                  setNewParcela({ valorRecebido: 0, dataRecebimento: '' });
                }}
                disabled={isPersisting}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-gray-200 bg-white">
                <th className="w-28 px-3 py-2 text-center font-medium text-gray-600">Parcela</th>
                <th className="w-48 px-3 py-2 text-center font-medium text-gray-600">Valor Recebido</th>
                <th className="w-44 px-3 py-2 text-center font-medium text-gray-600">Data Receb.</th>
                <th className="w-28 px-3 py-2 text-center font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {parcelasOrdenadas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-500">
                    <div className="inline-flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Nenhuma parcela cadastrada
                    </div>
                  </td>
                </tr>
              ) : (
                parcelasOrdenadas.map((parcela) => (
                  <tr key={parcela.id} className="border-t border-gray-100 hover:bg-gray-50">
                    {canManageChildren && editingParcelaId === parcela.id && editParcelaForm ? (
                      <>
                        <td className="px-3 py-2 text-center font-medium text-gray-900">
                          {ordinal(parcela.numero)}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-center">
                            <MoneyInput
                              valueCents={Math.round(editParcelaForm.valorRecebido * 100)}
                              onValueChange={(cents) =>
                                setEditParcelaForm((current) =>
                                  current ? { ...current, valorRecebido: cents / 100 } : current
                                )
                              }
                              disabled={isPersisting}
                              className="w-full rounded border border-gray-300 px-2 py-1 text-center text-sm"
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-center">
                            <DatePicker
                              value={editParcelaForm.dataRecebimento}
                              onChange={(value) =>
                                setEditParcelaForm((current) =>
                                  current ? { ...current, dataRecebimento: value } : current
                                )
                              }
                              disabled={isPersisting}
                              className="h-9 rounded border-gray-300 px-2 py-1 text-sm"
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={handleSaveEditParcela}
                              disabled={isPersisting}
                              className="rounded p-1 text-green-600 hover:bg-green-50"
                              title="Salvar"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleCancelEditParcela}
                              disabled={isPersisting}
                              className="rounded p-1 text-gray-600 hover:bg-gray-100"
                              title="Cancelar"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2 text-center font-medium text-gray-900">
                          {ordinal(parcela.numero)}
                        </td>
                        <td className="px-3 py-2 text-center font-semibold text-gray-900">
                          {formatCurrency(parcela.valorRecebido)}
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700">
                          {formatDate(parcela.dataRecebimento)}
                        </td>
                        <td className="px-3 py-2">
                          {canManageChildren ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleStartEditParcela(parcela)}
                                disabled={isPersisting}
                                className="rounded p-1 text-gray-600 hover:bg-gray-100"
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleRemoveParcela(parcela.id)}
                                disabled={isPersisting}
                                className="rounded p-1 text-red-600 hover:bg-red-50"
                                title="Remover"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="block text-center text-xs text-gray-400">Somente leitura</span>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {rubricas.length === 0 && !isLoading && !loadError ? (
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-500">
          Nenhuma rubrica encontrada para montar a planilha de pagamentos.
        </div>
      ) : (
        <div className="space-y-4">
          {rubricas.map((rubrica) => {
            const orcadoRubrica = calcularTotalOrcadoRubrica(rubrica);
            const pagoRubrica = calcularTotalPagoRubrica(rubrica);
            const saldoRubrica = orcadoRubrica - pagoRubrica;

            return (
              <div key={rubrica.id} className="overflow-hidden rounded-lg border border-gray-200">
                <div className="flex items-center justify-between bg-gray-50 px-4 py-3 hover:bg-gray-100">
                  <div
                    className="flex flex-1 cursor-pointer items-center gap-3"
                    onClick={() => toggleRubrica(rubrica.id)}
                  >
                    {rubrica.expanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{rubrica.nome}</span>
                      <span className="text-xs text-gray-500">
                        Orcado: {formatCurrency(orcadoRubrica)} • Pago: {formatCurrency(pagoRubrica)} •{' '}
                        <span className={saldoRubrica < 0 ? 'font-semibold text-red-600' : 'font-semibold text-blue-600'}>
                          Saldo: {formatCurrency(saldoRubrica)}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {rubrica.expanded && (
                  <div className="bg-white px-2 py-3 sm:px-3 lg:px-4">
                    {rubrica.itens.length === 0 ? (
                      <div className="flex justify-center gap-2 py-6 text-gray-500">
                        <AlertCircle className="h-5 w-5" />
                        <span>Nenhum item cadastrado nesta rubrica</span>
                      </div>
                    ) : (
                      <ResizableTable
                        columnCount={5}
                        defaultWidths={[160, 220, 260, 160, 170]}
                        minColumnWidth={80}
                        className="divide-y divide-gray-200"
                      >
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className={`px-2 py-2 text-center font-medium text-gray-600 ${STICKY_ITEM_HEADER_CLASS}`}>
                              Item
                            </th>
                            <th className="px-2 py-2 text-center font-medium text-gray-600">Subitem</th>
                            <th className="px-2 py-2 text-center font-medium text-gray-600">Lançamentos</th>
                            <th className="px-2 py-2 text-center font-medium text-gray-600">Pago</th>
                            <th className="px-2 py-2 text-center font-medium text-gray-600">Saldo</th>
                          </tr>
                        </thead>

                        <tbody>
                          {rubrica.itens.map((item) => {
                            const totalItem = calcularTotalOrcadoItem(item);
                            const pagoItem = calcularTotalPagoItem(item);
                            const saldoItem = totalItem - pagoItem;
                            const totalLancamentosItem = contarLancamentosItem(item);

                            return (
                              <Fragment key={item.id}>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                  <td className={`px-2 py-2 text-left font-medium text-gray-900 ${STICKY_ITEM_PARENT_CELL_CLASS}`}>
                                    {item.descricao}
                                  </td>
                                  <td className="px-2 py-2">
                                    {canManageChildren ? (
                                      <button
                                        onClick={() => handleStartAddSubitem(item.id)}
                                        disabled={isPersisting}
                                        className="inline-flex items-center gap-1 rounded-md px-3 py-1 text-sm text-[#004225] hover:bg-emerald-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                                      >
                                        <Plus className="h-4 w-4" />
                                        Novo subitem
                                      </button>
                                    ) : (
                                      <span className="text-xs text-gray-400">Somente leitura</span>
                                    )}
                                  </td>
                                  <td className="px-2 py-2 text-center text-sm text-gray-600">
                                    <div className="font-medium text-gray-800">
                                      {totalLancamentosItem}{' '}
                                      {totalLancamentosItem === 1 ? 'lançamento' : 'lançamentos'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Detalhes distribuidos pelos subitens abaixo.
                                    </div>
                                  </td>
                                  <td className="px-2 py-2 text-center font-semibold text-gray-900">
                                    {formatCurrency(pagoItem)}
                                  </td>
                                  <td className={`px-2 py-2 text-center font-semibold ${saldoItem < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                    {formatCurrency(saldoItem)}
                                  </td>
                                </tr>

                                {!item.subitens || item.subitens.length === 0 ? (
                                  <tr className="border-b border-gray-100">
                                    <td colSpan={5} className="py-4 text-center text-gray-500">
                                      Nenhum subitem cadastrado para este item
                                    </td>
                                  </tr>
                                ) : (
                                  item.subitens.map((subitem) => {
                                    const subitemKey = createSubitemKey(item.id, subitem.id);
                                    const { lancamentosOrdenados, quantidade, totalPago, ultimaDataPagamento } =
                                      obterResumoLancamentosSubitem(subitem);
                                    const totalSubitem = calcularTotalPagoSubitem(subitem);
                                    const isSubitemExpanded = expandedSubitemKey === subitemKey;
                                    const isEditingLancamentos =
                                      isEditingSubitens &&
                                      editingSubitemSession?.subitemKey === subitemKey &&
                                      editingLancamentosSubitemKey === subitemKey;
                                    const lancamentosParaExibir = isEditingLancamentos
                                      ? subitem.lancamentos ?? []
                                      : lancamentosOrdenados;
                                    const hasLancamentos = quantidade > 0;
                                    const handlePrimaryLancamentoAction = () => {
                                      if (isEditingLancamentos) {
                                        void handleSaveSubitens();
                                        return;
                                      }

                                      if (hasLancamentos) {
                                        handleEditLancamentos(item.id, subitem.id);
                                        return;
                                      }

                                      handleAddLancamento(item.id, subitem.id);
                                    };

                                    return (
                                      <Fragment key={subitem.id}>
                                        <tr
                                          className={`group hover:bg-gray-50 ${
                                            isSubitemExpanded ? '' : 'border-b border-gray-100'
                                          }`}
                                        >
                                        <td className={`px-2 py-2 text-left text-sm text-gray-600 ${STICKY_ITEM_SUBITEM_CELL_CLASS}`}>
                                          <span className="block truncate font-medium text-gray-700">
                                            {item.descricao}
                                          </span>
                                        </td>
                                        <td className="px-2 py-2">
                                          <div className="space-y-1">
                                            <div className="flex items-start justify-between gap-2">
                                              <span className="block min-w-0 flex-1 truncate text-sm font-medium text-gray-700">
                                                {subitem.empresaRh || '-'}
                                              </span>
                                              {canManageChildren ? (
                                                <div className="flex shrink-0 items-center gap-1">
                                                  <button
                                                    type="button"
                                                    onClick={() => handleStartEditSubitem(item.id, subitem.id)}
                                                    disabled={isPersisting}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                                                    aria-label="Editar subitem"
                                                    title="Editar subitem"
                                                  >
                                                    <Pencil className="h-4 w-4" />
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => void handleRemoveSubitem(item.id, subitem.id)}
                                                    disabled={isPersisting}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                                                    aria-label="Excluir subitem"
                                                    title="Excluir subitem"
                                                  >
                                                    <Trash2 className="h-4 w-4" />
                                                  </button>
                                                </div>
                                              ) : null}
                                            </div>
                                            <span className="block text-xs text-gray-500">
                                              {getSubitemVinculoLabel(subitem)}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="px-2 py-2">
                                          <div className="flex flex-col items-center gap-2 text-center">
                                            <div className="space-y-1 text-sm">
                                              <div className="font-medium text-gray-800">
                                                {quantidade} {quantidade === 1 ? 'lançamento' : 'lançamentos'}
                                              </div>
                                              <div className="text-xs text-gray-500">
                                                Total pago: {formatCurrency(totalPago)}
                                              </div>
                                              <div className="text-xs text-gray-500">
                                                Último pagamento:{' '}
                                                {ultimaDataPagamento ? formatDate(ultimaDataPagamento) : '-'}
                                              </div>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => toggleExpandedSubitem(subitemKey)}
                                              aria-expanded={isSubitemExpanded}
                                              className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                            >
                                              {isSubitemExpanded ? (
                                                <ChevronDown className="h-4 w-4" />
                                              ) : (
                                                <ChevronRight className="h-4 w-4" />
                                              )}
                                              {isSubitemExpanded ? 'Ocultar' : 'Ver'} lançamentos
                                            </button>
                                          </div>
                                        </td>
                                        <td className="px-2 py-2 text-center font-medium text-gray-900">
                                          {formatCurrency(totalSubitem)}
                                        </td>
                                        <td className="px-2 py-2 text-center text-gray-400">-</td>
                                      </tr>

                                      {isSubitemExpanded && (
                                        <tr className="border-b border-gray-100 bg-gray-50/60">
                                          <td colSpan={5} className="px-4 py-4">
                                            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                              <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 md:flex-row md:items-start md:justify-between">
                                                <div className="space-y-1">
                                                  <div className="text-sm font-semibold text-gray-900">
                                                    Lançamentos do subitem
                                                  </div>
                                                  <div className="text-sm text-gray-700">
                                                    {subitem.empresaRh || item.descricao}
                                                  </div>
                                                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                                    <span>
                                                      {quantidade} {quantidade === 1 ? 'lançamento' : 'lançamentos'}
                                                    </span>
                                                    <span>{getSubitemVinculoLabel(subitem)}</span>
                                                    <span>Total pago: {formatCurrency(totalPago)}</span>
                                                    <span>
                                                      Último pagamento:{' '}
                                                      {ultimaDataPagamento ? formatDate(ultimaDataPagamento) : '-'}
                                                    </span>
                                                  </div>
                                                </div>

                                                {canManageChildren && (
                                                  <div className="flex w-full min-w-0 items-center justify-end gap-2">
                                                    {isEditingLancamentos && (
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          void cancelEditingSubitem();
                                                        }}
                                                        disabled={isPersisting}
                                                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-100 disabled:text-slate-300"
                                                      >
                                                        <X className="h-4 w-4" />
                                                        <span className="truncate">Cancelar edição</span>
                                                      </button>
                                                    )}
                                                    <button
                                                      type="button"
                                                      onClick={handlePrimaryLancamentoAction}
                                                      disabled={isPersisting}
                                                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-[#004225] bg-[#004225] px-3 py-2 text-sm font-semibold text-white hover:bg-[#003319] disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
                                                    >
                                                      {isEditingLancamentos ? (
                                                        <Save className="h-4 w-4" />
                                                      ) : hasLancamentos ? (
                                                        <Pencil className="h-4 w-4" />
                                                      ) : (
                                                        <Plus className="h-4 w-4" />
                                                      )}
                                                      <span className="truncate">
                                                        {isEditingLancamentos
                                                          ? 'Salvar lançamentos'
                                                          : hasLancamentos
                                                            ? 'Editar lançamentos'
                                                            : 'Adicionar lançamento'}
                                                      </span>
                                                    </button>
                                                  </div>
                                                )}
                                              </div>

                                              <div className="mt-4 space-y-3">
                                                {lancamentosParaExibir.length === 0 ? (
                                                  <div className="rounded-lg border border-dashed border-gray-200 px-3 py-4 text-center text-sm text-gray-500">
                                                    Nenhum lançamento cadastrado
                                                  </div>
                                                ) : (
                                                  lancamentosParaExibir.map((lancamento, index) => (
                                                    <div
                                                      key={lancamento.id}
                                                      className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                                                    >
                                                      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                                                        Lançamento {index + 1}
                                                      </div>
                                                      {canManageChildren && isEditingLancamentos ? (
                                                        <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_220px_auto]">
                                                          <MoneyInput
                                                            valueCents={Math.round(lancamento.valor * 100)}
                                                            onValueChange={(cents) =>
                                                              updateLancamentoCampo(
                                                                item.id,
                                                                subitem.id,
                                                                lancamento.id,
                                                                {
                                                                  valor: cents / 100,
                                                                }
                                                              )
                                                            }
                                                            disabled={isPersisting}
                                                            className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-center text-sm"
                                                          />
                                                          <DatePicker
                                                            value={lancamento.dataPag || ''}
                                                            onChange={(value) =>
                                                              updateLancamentoCampo(
                                                                item.id,
                                                                subitem.id,
                                                                lancamento.id,
                                                                {
                                                                  dataPag: value,
                                                                }
                                                              )
                                                            }
                                                            placeholder="Selecionar data"
                                                            disabled={isPersisting}
                                                            className="h-9 min-w-[220px] rounded border-gray-300 bg-white px-2 py-1 text-sm [&_input]:text-center [&_input]:font-medium [&_input]:tabular-nums"
                                                          />
                                                          <div className="flex items-center justify-end gap-2">
                                                            <button
                                                              type="button"
                                                              onClick={() =>
                                                                handleRemoveLancamento(
                                                                  item.id,
                                                                  subitem.id,
                                                                  lancamento.id
                                                                )
                                                              }
                                                              disabled={isPersisting}
                                                              className="inline-flex items-center justify-center rounded border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                                                              aria-label="Excluir lançamento"
                                                              title="Excluir lançamento"
                                                            >
                                                              <Trash2 className="h-4 w-4" />
                                                            </button>
                                                          </div>
                                                        </div>
                                                      ) : (
                                                        <div className="flex flex-col gap-2 text-sm text-gray-700 sm:flex-row sm:items-center sm:justify-between">
                                                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                                                            <span className="font-semibold text-gray-900">
                                                              {formatCurrency(lancamento.valor)}
                                                            </span>
                                                            <span className="inline-flex w-fit items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600">
                                                              {formatDate(lancamento.dataPag)}
                                                            </span>
                                                          </div>
                                                          {canManageChildren ? (
                                                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                                              <button
                                                                type="button"
                                                                onClick={() =>
                                                                  handleRemoveLancamento(
                                                                    item.id,
                                                                    subitem.id,
                                                                    lancamento.id
                                                                  )
                                                                }
                                                                disabled={isPersisting}
                                                                className="inline-flex items-center justify-center rounded border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                                                                aria-label="Excluir lançamento"
                                                                title="Excluir lançamento"
                                                              >
                                                                <Trash2 className="h-4 w-4" />
                                                              </button>
                                                            </div>
                                                          ) : null}
                                                        </div>
                                                      )}
                                                    </div>
                                                  ))
                                                )}

                                                {canManageChildren && isEditingLancamentos && (
                                                  <div className="flex justify-center pt-1">
                                                    <button
                                                      type="button"
                                                      onClick={() => handleAddLancamento(item.id, subitem.id)}
                                                      disabled={isPersisting}
                                                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-[#004225] bg-white text-[#004225] hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
                                                      aria-label="Adicionar outro lançamento"
                                                      title="Adicionar outro lançamento"
                                                    >
                                                      <Plus className="h-5 w-5" />
                                                    </button>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </Fragment>
                                    );
                                  })
                                )}
                              </Fragment>
                            );
                          })}
                        </tbody>
                      </ResizableTable>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AppModalShell
        isOpen={Boolean(parcelaPendingDeletion)}
        title="Excluir parcela"
        description="Confirme a exclusao da parcela antes de continuar."
        icon={<Trash2 className="h-5 w-5" />}
        tone="danger"
        onClose={closeDeleteParcelaModal}
        maxWidthClassName="max-w-lg"
        closeDisabled={isPersisting}
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeDeleteParcelaModal}
              disabled={isPersisting}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                if (parcelaPendingDeletion) {
                  void handleRemoveParcela(parcelaPendingDeletion.id);
                }
              }}
              disabled={isPersisting}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Excluir parcela
            </button>
          </div>
        }
      >
        {parcelaPendingDeletion && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-800">
                Tem certeza de que deseja excluir esta parcela?
              </p>
              <p className="mt-1 text-sm text-red-700">
                Esta acao remove a parcela do contrato e nao pode ser desfeita.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Parcela selecionada
              </p>
              <p className="mt-1 font-medium text-slate-900">
                {ordinal(parcelaPendingDeletion.numero)} parcela
              </p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                <span>Valor: {formatCurrency(parcelaPendingDeletion.valorRecebido)}</span>
                <span>Recebimento: {formatDate(parcelaPendingDeletion.dataRecebimento)}</span>
              </div>
            </div>
          </div>
        )}
      </AppModalShell>

      <AppModalShell
        isOpen={Boolean(subitemPendingDeletion)}
        title="Excluir subitem"
        description="Confirme a exclusao do subitem antes de continuar."
        icon={<Trash2 className="h-5 w-5" />}
        tone="danger"
        onClose={closeDeleteSubitemModal}
        maxWidthClassName="max-w-lg"
        closeDisabled={isPersisting}
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeDeleteSubitemModal}
              disabled={isPersisting}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                if (subitemPendingDeletion) {
                  handleRemoveSubitem(
                    subitemPendingDeletion.itemId,
                    subitemPendingDeletion.subitem.id
                  );
                }
              }}
              disabled={isPersisting}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Excluir subitem
            </button>
          </div>
        }
      >
        {subitemPendingDeletion && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-800">
                Tem certeza de que deseja excluir este subitem?
              </p>
              <p className="mt-1 text-sm text-red-700">
                Esta acao remove o subitem e todos os lancamentos dele na edicao atual.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Subitem selecionado
              </p>
              <p className="mt-1 font-medium text-slate-900">
                {subitemPendingDeletion.subitem.empresaRh || subitemPendingDeletion.itemDescricao}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                <span>Item: {subitemPendingDeletion.itemDescricao}</span>
                <span>
                  Lancamentos: {subitemPendingDeletion.subitem.lancamentos.length}
                </span>
                <span>{getSubitemVinculoLabel(subitemPendingDeletion.subitem)}</span>
              </div>
            </div>
          </div>
        )}
      </AppModalShell>

      <AppModalShell
        isOpen={Boolean(lancamentoPendingDeletion)}
        title="Excluir lancamento"
        description="Confirme a exclusao do lancamento antes de continuar."
        icon={<Trash2 className="h-5 w-5" />}
        tone="danger"
        onClose={closeDeleteLancamentoModal}
        maxWidthClassName="max-w-lg"
        closeDisabled={isPersisting}
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeDeleteLancamentoModal}
              disabled={isPersisting}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                if (lancamentoPendingDeletion) {
                  handleRemoveLancamento(
                    lancamentoPendingDeletion.itemId,
                    lancamentoPendingDeletion.subitemId,
                    lancamentoPendingDeletion.lancamento.id
                  );
                }
              }}
              disabled={isPersisting}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Excluir lancamento
            </button>
          </div>
        }
      >
        {lancamentoPendingDeletion && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-800">
                Tem certeza de que deseja excluir este lancamento?
              </p>
              <p className="mt-1 text-sm text-red-700">
                Esta acao remove o lancamento da edicao atual do subitem.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Lancamento selecionado
              </p>
              <p className="mt-1 font-medium text-slate-900">
                {lancamentoPendingDeletion.subitemNome || lancamentoPendingDeletion.itemDescricao}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                <span>Item: {lancamentoPendingDeletion.itemDescricao}</span>
                <span>Valor: {formatCurrency(lancamentoPendingDeletion.lancamento.valor)}</span>
                <span>
                  Data: {formatDate(lancamentoPendingDeletion.lancamento.dataPag)}
                </span>
              </div>
            </div>
          </div>
        )}
      </AppModalShell>

      <SubitemModal
        isOpen={isSubitemModalOpen}
        title={subitemModalEditingContext ? 'Editar subitem' : 'Novo subitem'}
        subtitle={
          subitemModalEditingContext
            ? 'Atualize o nome do subitem e o vinculo dele dentro do projeto.'
            : 'Cadastre o nome do subitem e escolha como ele sera vinculado dentro do projeto.'
        }
        submitLabel={subitemModalEditingContext ? 'Salvar subitem' : 'Adicionar subitem'}
        form={subitemModalForm}
        error={subitemModalError}
        linksError={projectLinksError}
        isLoadingLinks={isLoadingProjectLinks}
        projectPeople={projectPeople}
        projectCompanies={projectCompanies}
        isPersisting={isPersisting}
        onChange={(patch) => {
          setSubitemModalError(null);
          setSubitemModalForm((current) => ({ ...current, ...patch }));
        }}
        onClose={closeSubitemModal}
        onOpenCreatePerson={() => {
          setSubitemModalError(null);
          setSubitemModalForm((current) => ({
            ...current,
            vinculoTipo: 'person',
            organizationId: '',
          }));
          setIsCreatePersonModalOpen(true);
        }}
        onOpenCreateCompany={() => {
          setSubitemModalError(null);
          setSubitemModalForm((current) => ({
            ...current,
            vinculoTipo: 'company',
            personId: '',
          }));
          setIsCreateCompanyModalOpen(true);
        }}
        onOpenLinkExistingPerson={() => {
          void handleOpenLinkExistingPersonModal();
        }}
        onOpenLinkExistingCompany={() => {
          void handleOpenLinkExistingCompanyModal();
        }}
        onSubmit={() => {
          if (!subitemModalItemId) {
            setSubitemModalError('Item inválido para criar subitem.');
            return;
          }

          void handleSaveSubitemModal();
        }}
      />

      <CreateLinkedPersonModal
        isOpen={isCreatePersonModalOpen}
        onClose={() => setIsCreatePersonModalOpen(false)}
        onSave={handleCreateLinkedPerson}
      />

      <CreateLinkedCompanyModal
        isOpen={isCreateCompanyModalOpen}
        onClose={() => setIsCreateCompanyModalOpen(false)}
        onSave={handleCreateLinkedCompany}
      />

      <LinkExistingPersonModal
        isOpen={isLinkExistingPersonModalOpen}
        people={linkableBasePeople}
        isLoading={isLoadingBasePeople}
        onClose={() => setIsLinkExistingPersonModalOpen(false)}
        onSave={handleLinkExistingPerson}
      />

      <LinkExistingCompanyModal
        isOpen={isLinkExistingCompanyModalOpen}
        companies={linkableBaseCompanies}
        isLoading={isLoadingBaseCompanies}
        onClose={() => setIsLinkExistingCompanyModalOpen(false)}
        onSave={handleLinkExistingCompany}
      />
    </div>
  );
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  maxWidthClassName = 'max-w-2xl',
  zIndexClassName = 'z-50',
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  maxWidthClassName?: string;
  zIndexClassName?: string;
}) {
  return (
    <div className={`fixed inset-0 ${zIndexClassName} flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm`}>
      <div className={`max-h-[90vh] w-full ${maxWidthClassName} overflow-hidden rounded-xl bg-white shadow-2xl`}>
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 bg-gradient-to-r from-[#004225] to-[#00563A] px-6 py-4 text-white">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-white/85">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-white/10"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(90vh-88px)] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function SubitemModal({
  isOpen,
  title,
  subtitle,
  submitLabel,
  form,
  error,
  linksError,
  isLoadingLinks,
  projectPeople,
  projectCompanies,
  isPersisting,
  onChange,
  onClose,
  onOpenCreatePerson,
  onOpenCreateCompany,
  onOpenLinkExistingPerson,
  onOpenLinkExistingCompany,
  onSubmit,
}: {
  isOpen: boolean;
  title: string;
  subtitle: string;
  submitLabel: string;
  form: NewSubitemFormState;
  error: string | null;
  linksError: string | null;
  isLoadingLinks: boolean;
  projectPeople: ProjectLinkedPerson[];
  projectCompanies: ProjectLinkedCompany[];
  isPersisting: boolean;
  onChange: (patch: Partial<NewSubitemFormState>) => void;
  onClose: () => void;
  onOpenCreatePerson: () => void;
  onOpenCreateCompany: () => void;
  onOpenLinkExistingPerson: () => void;
  onOpenLinkExistingCompany: () => void;
  onSubmit: () => void;
}) {
  if (!isOpen) return null;

  const showPersonSelector = form.vinculoTipo === 'person';
  const showCompanySelector = form.vinculoTipo === 'company';

  return (
    <ModalShell
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      maxWidthClassName="max-w-2xl"
    >
      <div className="space-y-5 p-6">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Nome do subitem <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.nome}
            onChange={(event) => onChange({ nome: event.target.value })}
            disabled={isPersisting}
            autoFocus
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]"
            placeholder="Ex: Serviços AWS, Consultoria, Bolsa..."
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Vínculo do subitem</label>
          <select
            value={form.vinculoTipo}
            onChange={(event) => {
              const nextType = event.target.value as SubitemLinkType;
              onChange({
                vinculoTipo: nextType,
                personId: nextType === 'person' ? form.personId : '',
                organizationId: nextType === 'company' ? form.organizationId : '',
              });
            }}
            disabled={isPersisting}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]"
          >
            <option value="none">Sem vínculo</option>
            <option value="person">Pessoa vinculada ao projeto</option>
            <option value="company">Empresa vinculada ao projeto</option>
          </select>
        </div>

        {linksError ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {linksError}
          </div>
        ) : null}

        {showPersonSelector ? (
          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Pessoa vinculada</h3>
                <p className="text-xs text-gray-500">
                  Selecione uma pessoa já vinculada ao projeto ou cadastre uma nova.
                </p>
              </div>
              <div className="flex flex-nowrap items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={onOpenLinkExistingPerson}
                  disabled={isPersisting}
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <Check className="h-4 w-4" />
                  Vincular existente
                </button>
                <button
                  type="button"
                  onClick={onOpenCreatePerson}
                  disabled={isPersisting}
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-[#004225] hover:bg-emerald-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar pessoa
                </button>
              </div>
            </div>

            {isLoadingLinks ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-white px-3 py-4 text-sm text-gray-500">
                Carregando pessoas vinculadas...
              </div>
            ) : projectPeople.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-white px-3 py-4 text-sm text-gray-500">
                Nenhuma pessoa vinculada ao projeto.
              </div>
            ) : (
              <select
                value={form.personId}
                onChange={(event) => {
                  const nextPersonId = event.target.value;
                  const selectedPerson = projectPeople.find((person) => person.personId === nextPersonId);

                  onChange({
                    personId: nextPersonId,
                    organizationId: '',
                    nome: form.nome.trim() ? form.nome : selectedPerson?.fullName ?? form.nome,
                  });
                }}
                disabled={isPersisting}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]"
              >
                <option value="">Selecione uma pessoa</option>
                {projectPeople.map((person) => (
                  <option key={person.projectLinkId} value={person.personId}>
                    {person.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        ) : null}

        {showCompanySelector ? (
          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Empresa vinculada</h3>
                <p className="text-xs text-gray-500">
                  Selecione uma empresa já vinculada ao projeto ou cadastre uma nova.
                </p>
              </div>
              <div className="flex flex-nowrap items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={onOpenLinkExistingCompany}
                  disabled={isPersisting}
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <Check className="h-4 w-4" />
                  Vincular existente
                </button>
                <button
                  type="button"
                  onClick={onOpenCreateCompany}
                  disabled={isPersisting}
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-[#004225] hover:bg-emerald-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar empresa
                </button>
              </div>
            </div>

            {isLoadingLinks ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-white px-3 py-4 text-sm text-gray-500">
                Carregando empresas vinculadas...
              </div>
            ) : projectCompanies.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-white px-3 py-4 text-sm text-gray-500">
                Nenhuma empresa vinculada ao projeto.
              </div>
            ) : (
              <select
                value={form.organizationId}
                onChange={(event) => {
                  const nextOrganizationId = event.target.value;
                  const selectedCompany = projectCompanies.find(
                    (company) => company.companyId === nextOrganizationId
                  );

                  onChange({
                    organizationId: nextOrganizationId,
                    personId: '',
                    nome: form.nome.trim() ? form.nome : selectedCompany?.name ?? form.nome,
                  });
                }}
                disabled={isPersisting}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]"
              >
                <option value="">Selecione uma empresa</option>
                {projectCompanies.map((company) => (
                  <option key={company.projectLinkId} value={company.companyId}>
                    {company.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isPersisting}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            <X className="h-4 w-4" />
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isPersisting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#004225] px-4 py-2 text-sm font-medium text-white hover:bg-[#003319] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {submitLabel}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function CreateLinkedPersonModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: PeopleRequestDTO) => Promise<void>;
}) {
  const [form, setForm] = useState<CreatePersonFormState>(DEFAULT_CREATE_PERSON_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(DEFAULT_CREATE_PERSON_FORM);
    setError(null);
    setIsSaving(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const fullName = form.fullName.trim();
    const cpf = onlyDigits(form.cpf);
    const city = form.city.trim();
    const state = form.state.trim().toUpperCase().slice(0, 2);

    if (!fullName) {
      setError('Informe o nome completo da pessoa.');
      return;
    }

    if (!city || !state) {
      setError('Preencha os campos obrigatórios: nome, cidade e UF.');
      return;
    }

    if (cpf && cpf.length !== 11) {
      setError('Informe um CPF válido com 11 dígitos.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        fullName,
        cpf: cpf || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        city,
        state,
      });
    } catch (saveError) {
      setError(toErrorMessage(saveError, 'Não foi possível cadastrar a pessoa.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalShell
      title="Nova pessoa"
      subtitle="Cadastre a pessoa e vincule-a automaticamente a este projeto."
      onClose={onClose}
      maxWidthClassName="max-w-xl"
      zIndexClassName="z-[60]"
    >
      <div className="space-y-4 p-6">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Nome completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.fullName}
            onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
            disabled={isSaving}
            autoFocus
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]"
            placeholder="Nome da pessoa"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">CPF</label>
            <input
              type="text"
              value={form.cpf}
              onChange={(event) => setForm((current) => ({ ...current, cpf: event.target.value }))}
              disabled={isSaving}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]"
              placeholder="Somente numeros ou formatado"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Telefone</label>
            <input
              type="text"
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              disabled={isSaving}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]"
              placeholder="Telefone para contato"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Cidade <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.city}
              onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
              disabled={isSaving}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]"
              placeholder="Cidade"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              UF <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.state}
              onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))}
              disabled={isSaving}
              maxLength={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm uppercase focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]"
              placeholder="UF"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">E-mail</label>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            disabled={isSaving}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]"
            placeholder="email@exemplo.com"
          />
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            <X className="h-4 w-4" />
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#004225] px-4 py-2 text-sm font-medium text-white hover:bg-[#003319] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar e vincular'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function CreateLinkedCompanyModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CompanyRequestDTO) => Promise<void>;
}) {
  const [form, setForm] = useState<CreateCompanyFormState>(DEFAULT_CREATE_COMPANY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(DEFAULT_CREATE_COMPANY_FORM);
    setError(null);
    setIsSaving(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const name = form.name.trim();
    const tradeName = form.tradeName.trim();
    const cnpj = onlyDigits(form.cnpj);
    const email = form.email.trim();
    const phone = form.phone.trim();
    const address = form.address.trim();
    const city = form.city.trim();
    const state = form.state.trim().toUpperCase().slice(0, 2);

    if (!name) {
      setError('Informe a razão social da empresa.');
      return;
    }

    if (!tradeName) {
      setError('Informe o nome fantasia da empresa.');
      return;
    }

    if (cnpj.length !== 14) {
      setError('Informe um CNPJ válido com 14 dígitos.');
      return;
    }

    if (!email || !phone || !address || !city || !state) {
      setError('Preencha e-mail, telefone, endereço, cidade e UF para cadastrar a empresa.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        name,
        tradeName,
        cnpj,
        email,
        phone,
        address,
        city,
        state,
      });
    } catch (saveError) {
      setError(toErrorMessage(saveError, 'Não foi possível cadastrar a empresa.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalShell
      title="Nova empresa"
      subtitle="Cadastre a empresa e vincule-a automaticamente a este projeto."
      onClose={onClose}
      maxWidthClassName="max-w-3xl"
      zIndexClassName="z-[60]"
    >
      <div className="space-y-4 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Razão social <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              disabled={isSaving}
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]"
              placeholder="Razão social da empresa"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Nome fantasia <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.tradeName}
              onChange={(event) =>
                setForm((current) => ({ ...current, tradeName: event.target.value }))
              }
              disabled={isSaving}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]"
              placeholder="Nome fantasia da empresa"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              CNPJ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.cnpj}
              onChange={(event) => setForm((current) => ({ ...current, cnpj: event.target.value }))}
              disabled={isSaving}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]"
              placeholder="00.000.000/0000-00"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              E-mail <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              disabled={isSaving}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]"
              placeholder="contato@empresa.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Telefone <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              disabled={isSaving}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]"
              placeholder="Telefone principal"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Endereço <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(event) =>
                setForm((current) => ({ ...current, address: event.target.value }))
              }
              disabled={isSaving}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]"
              placeholder="Endereço da empresa"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Cidade <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.city}
              onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
              disabled={isSaving}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]"
              placeholder="Cidade"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              UF <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.state}
              onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))}
              disabled={isSaving}
              maxLength={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm uppercase focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]"
              placeholder="UF"
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            <X className="h-4 w-4" />
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#004225] px-4 py-2 text-sm font-medium text-white hover:bg-[#003319] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar e vincular'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function LinkExistingPersonModal({
  isOpen,
  people,
  isLoading,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  people: PeopleResponseDTO[];
  isLoading: boolean;
  onClose: () => void;
  onSave: (personId: number) => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedId('');
    setError(null);
    setIsSaving(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedId) {
      setError('Selecione uma pessoa cadastrada para vincular.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(Number(selectedId));
    } catch (saveError) {
      setError(toErrorMessage(saveError, 'Não foi possível vincular a pessoa existente.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalShell
      title="Vincular pessoa existente"
      subtitle="Escolha uma pessoa ja cadastrada na base para vinculá-la ao projeto."
      onClose={onClose}
      maxWidthClassName="max-w-xl"
      zIndexClassName="z-[60]"
    >
      <div className="space-y-4 p-6">
        {isLoading ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-500">
            Carregando pessoas cadastradas...
          </div>
        ) : people.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-500">
            Todas as pessoas cadastradas já estao vinculadas a este projeto.
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Pessoa cadastrada <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              disabled={isSaving}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]"
            >
              <option value="">Selecione uma pessoa</option>
              {people.map((person) => {
                const cpf = onlyDigits(person.cpf ?? '');
                const label = cpf ? `${person.fullName} • CPF ${cpf}` : person.fullName;

                return (
                  <option key={person.id} value={String(person.id)}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            <X className="h-4 w-4" />
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSaving || isLoading || people.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#004225] px-4 py-2 text-sm font-medium text-white hover:bg-[#003319] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {isSaving ? 'Vinculando...' : 'Vincular ao projeto'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function LinkExistingCompanyModal({
  isOpen,
  companies,
  isLoading,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  companies: CompanyResponseDTO[];
  isLoading: boolean;
  onClose: () => void;
  onSave: (companyId: number) => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedId('');
    setError(null);
    setIsSaving(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedId) {
      setError('Selecione uma empresa cadastrada para vincular.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(Number(selectedId));
    } catch (saveError) {
      setError(toErrorMessage(saveError, 'Não foi possível vincular a empresa existente.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalShell
      title="Vincular empresa existente"
      subtitle="Escolha uma empresa ja cadastrada na base para vinculá-la ao projeto."
      onClose={onClose}
      maxWidthClassName="max-w-xl"
      zIndexClassName="z-[60]"
    >
      <div className="space-y-4 p-6">
        {isLoading ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-500">
            Carregando empresas cadastradas...
          </div>
        ) : companies.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-500">
            Todas as empresas cadastradas já estao vinculadas a este projeto.
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Empresa cadastrada <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              disabled={isSaving}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]"
            >
              <option value="">Selecione uma empresa</option>
              {companies.map((company) => {
                const cnpj = onlyDigits(company.cnpj ?? '');
                const label = cnpj
                  ? `${companyNameLabel(company)} • CNPJ ${cnpj}`
                  : companyNameLabel(company);

                return (
                  <option key={company.id} value={String(company.id)}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            <X className="h-4 w-4" />
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSaving || isLoading || companies.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#004225] px-4 py-2 text-sm font-medium text-white hover:bg-[#003319] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {isSaving ? 'Vinculando...' : 'Vincular ao projeto'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
