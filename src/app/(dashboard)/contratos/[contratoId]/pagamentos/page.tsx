'use client';

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Info,
  HandCoins,
  CopyPlus,
} from 'lucide-react';
import { ContractPagamentosLoadingSkeleton } from '../_components/ContractLoadingSkeleton';
import { ExpenseReclassifyModal } from '../_components/ExpenseReclassifyModal';
import { MoneyInput } from '../desembolso/_components/MoneyImput';
import { AppModalShell } from '@/components/ui/app-modal-shell';
import { ConfirmDiscardModal } from '@/components/ui/confirm-discard-modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { useModalCloseGuard } from '@/src/hooks/useModalCloseGuard';
import { getUserErrorMessage } from '@/src/lib/feedback/user-messages';
import {
  createCompany,
  createExpense,
  createIncome,
  createPartner,
  createPeople,
  createProjectCompany,
  createProjectPartner,
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
  listPartners,
  listPeople,
  listProjectCompaniesDetailed,
  listProjectPeopleDetailed,
  listProjectPartnerLinks,
  reclassifyExpense,
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
  ExpensePaidByEnum,
  ExpensePaymentStatusEnum,
  ExpenseRequestDTO,
  ExpenseResponseDTO,
  ExpenseUpdateDTO,
  GoalResponseDTO,
  IncomeResponseDTO,
  IncomeStatusEnum,
  PageResponseDTO,
  PartnerRequestDTO,
  PartnerResponseDTO,
  PartnersTypeEnum,
  PeopleResponseDTO,
  PeopleRequestDTO,
  ProjectCompanyDetailedResponseDTO,
  ProjectPartnerLinkResponseDTO,
  ProjectPeopleDetailedResponseDTO,
  StatusProjectPeopleEnum,
} from '@/src/lib/api/types';
import { HttpError } from '@/src/lib/api/types';
import { Dropdown } from '@/components/ui/dropdown';

type ID = string;

const PAGE_SIZE = 20;
const MAX_PAGE_REQUESTS = 1000;
const DEFAULT_PROJECT_PERSON_STATUS: StatusProjectPeopleEnum = 'ATIVO';

type SubitemLinkType = 'none' | 'person' | 'company' | 'partner';

type Lancamento = {
  id: ID;
  valor: number;
  dataPag: string;
  paymentStatus: ExpensePaymentStatusEnum;
  paidBy: ExpensePaidByEnum;
  expenseId?: ID;
};

type Subitem = {
  id: ID;
  empresaRh: string;
  lancamentos: Lancamento[];
  vinculoTipo: SubitemLinkType;
  personId?: ID;
  organizationId?: ID;
  partnerId?: ID;
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
  projectPeopleId?: ID;
  projectCompanyId?: ID;
};

type Rubrica = {
  id: ID;
  codigo: string;
  nome: string;
  expanded: boolean;
  itens: ItemRubrica[];
};

type PaymentViewModel = {
  key: ID;
  itemId: ID;
  itemDescricao: string;
  payment: Subitem;
  quantidade: number;
  totalComprometido: number;
  totalPago: number;
  totalReservado: number;
  totalSubitem: number;
  ultimaDataPagamentoPago: string;
  lancamentosParaExibir: Lancamento[];
  hasLancamentos: boolean;
  isExpanded: boolean;
  isEditingLancamentos: boolean;
  vinculoLabel: string;
};

type ItemViewModel = {
  item: ItemRubrica;
  totalItem: number;
  comprometidoItem: number;
  pagoItem: number;
  reservadoItem: number;
  saldoItem: number;
  totalLancamentosItem: number;
  totalPagamentosItem: number;
  paymentViews: PaymentViewModel[];
};

type RubricaViewModel = {
  rubrica: Rubrica;
  orcadoRubrica: number;
  comprometidoRubrica: number;
  pagoRubrica: number;
  reservadoRubrica: number;
  saldoRubrica: number;
  totalPagamentosRubrica: number;
  totalLancamentosRubrica: number;
  itemViews: ItemViewModel[];
};

type Parcela = {
  id: ID;
  numero: number;
  valorRecebido: number;
  dataRecebimento: string;
  status: IncomeStatusEnum;
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
  cnpj?: string | null;
  status?: ProjectCompanyDetailedResponseDTO['status'];
};

type ProjectLinkedPartner = {
  projectLinkId: ID;
  partnerId: ID;
  name: string;
  label: string;
};

type NewSubitemFormState = {
  nome: string;
  vinculoTipo: SubitemLinkType;
  personId: string;
  organizationId: string;
  partnerId: string;
};

type PaymentFieldErrors = Partial<{
  projectCompanyId: string;
  personId: string;
  budgetItemId: string;
  categoryId: string;
}>;

const DEFAULT_NEW_SUBITEM_FORM: NewSubitemFormState = {
  nome: '',
  vinculoTipo: 'none',
  personId: '',
  organizationId: '',
  partnerId: '',
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

type CreatePartnerFormState = {
  name: string;
  tradeName: string;
  partnersType: PartnersTypeEnum | '';
  cnpj: string;
};

const DEFAULT_CREATE_PARTNER_FORM: CreatePartnerFormState = {
  name: '',
  tradeName: '',
  partnersType: '',
  cnpj: '',
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function formatSignedCurrency(value: number) {
  if (value < 0) {
    return `- ${formatCurrency(Math.abs(value))}`;
  }

  return formatCurrency(value);
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

function MetaBullet() {
  return (
    <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-gray-300" />
  );
}

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

function mapPaymentFieldErrors(error: unknown): PaymentFieldErrors {
  if (!(error instanceof HttpError) || !error.fieldErrors) {
    return {};
  }

  const next: PaymentFieldErrors = {};
  if (error.fieldErrors.projectCompanyId) {
    next.projectCompanyId = 'A empresa selecionada não pertence a este contrato.';
  }
  if (error.fieldErrors.personId) {
    next.personId = 'A pessoa selecionada não está vinculada a este contrato.';
  }
  if (error.fieldErrors.budgetItemId) {
    next.budgetItemId = 'O item de rubrica selecionado não pertence a este contrato.';
  }
  if (error.fieldErrors.categoryId) {
    next.categoryId = 'A categoria selecionada não pertence a este contrato.';
  }

  return next;
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
    paymentStatus: 'PAGO',
    paidBy: 'EXECUCAO',
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

function formatCnpj(value: string | null | undefined) {
  const digits = (value ?? '').replace(/\D/g, '').slice(0, 14);
  if (digits.length !== 14) return null;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function getContractingStatusLabel(status: ProjectCompanyDetailedResponseDTO['status']) {
  switch (status) {
    case 'EM_CADASTRO':
      return 'Em cadastro';
    case 'EM_CONTRATACAO':
      return 'Em contratação';
    case 'CONTRATADA':
      return 'Contratada';
    case 'EM_EXECUCAO':
      return 'Em execução';
    case 'CONCLUIDA':
      return 'Concluída';
    case 'CANCELADA':
      return 'Cancelada';
    default:
      return null;
  }
}

function buildProjectCompanyDisplayLabel(company: {
  name: string;
  cnpj?: string | null;
  status?: ProjectCompanyDetailedResponseDTO['status'];
}) {
  const cnpjLabel = formatCnpj(company.cnpj);
  const statusLabel = getContractingStatusLabel(company.status ?? null);

  return [company.name, cnpjLabel ? `CNPJ ${cnpjLabel}` : null, statusLabel]
    .filter(Boolean)
    .join(' • ');
}

function calculateRealBalance(totalRecebido: number, totalPago: number) {
  return Number((totalRecebido - totalPago).toFixed(2));
}

function calculateProjectBalance(saldoReal: number, totalReservado: number) {
  return Number((saldoReal - totalReservado).toFixed(2));
}

function getPaymentStatusLabel(status: ExpensePaymentStatusEnum) {
  if (status === 'RESERVADO') return 'Reservado';
  if (status === 'PAGAMENTO_RECEBIDO') return 'Pagamento recebido';
  return 'Pago';
}

function getPaymentStatusBadgeClassName(status: ExpensePaymentStatusEnum) {
  if (status === 'RESERVADO') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }
  if (status === 'PAGAMENTO_RECEBIDO') {
    return 'border-blue-200 bg-blue-50 text-blue-700';
  }
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
}

function getIncomeStatusLabel(status: IncomeStatusEnum) {
  if (status === 'FATURADO') return 'Faturado (NF emitida)';
  if (status === 'CANCELADO') return 'Cancelado';
  return 'Recebido';
}

function getIncomeStatusBadgeClassName(status: IncomeStatusEnum) {
  if (status === 'FATURADO') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (status === 'CANCELADO') return 'border-slate-300 bg-slate-100 text-slate-600';
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
}

function normalizePaidBy(
  value: ExpensePaidByEnum | 'EMPRESA' | 'PARCEIRO' | null | undefined
): ExpensePaidByEnum {
  if (value === 'PARCEIRO') return 'EXECUCAO';
  if (value === 'EMPRESA') return 'INNOVATIS';
  return value ?? 'INNOVATIS';
}

function getPaidByLabel(value: ExpensePaidByEnum | 'EMPRESA' | 'PARCEIRO') {
  return normalizePaidBy(value) === 'EXECUCAO' ? 'Execução' : 'Innovatis';
}

function getPaidByBadgeClassName(value: ExpensePaidByEnum | 'EMPRESA' | 'PARCEIRO') {
  return normalizePaidBy(value) === 'EXECUCAO'
    ? 'border-sky-200 bg-sky-50 text-sky-700'
    : 'border-slate-200 bg-slate-50 text-slate-700';
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
  const [newParcela, setNewParcela] = useState<{
    valorRecebido: number;
    dataRecebimento: string;
    status: IncomeStatusEnum;
  }>({
    valorRecebido: 0,
    dataRecebimento: '',
    status: 'RECEBIDO',
  });
  const [editingParcelaId, setEditingParcelaId] = useState<ID | null>(null);
  const [editParcelaForm, setEditParcelaForm] = useState<Parcela | null>(null);

  const [projectPeople, setProjectPeople] = useState<ProjectLinkedPerson[]>([]);
  const [projectCompanies, setProjectCompanies] = useState<ProjectLinkedCompany[]>([]);
  const [projectPartners, setProjectPartners] = useState<ProjectLinkedPartner[]>([]);
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
  const [subitemModalFieldErrors, setSubitemModalFieldErrors] = useState<PaymentFieldErrors>({});
  const [isCreatePersonModalOpen, setIsCreatePersonModalOpen] = useState(false);
  const [isCreateCompanyModalOpen, setIsCreateCompanyModalOpen] = useState(false);
  const [isCreatePartnerModalOpen, setIsCreatePartnerModalOpen] = useState(false);
  const [isLinkExistingPersonModalOpen, setIsLinkExistingPersonModalOpen] = useState(false);
  const [isLinkExistingCompanyModalOpen, setIsLinkExistingCompanyModalOpen] = useState(false);
  const [isLinkExistingPartnerModalOpen, setIsLinkExistingPartnerModalOpen] = useState(false);
  const [basePeople, setBasePeople] = useState<PeopleResponseDTO[]>([]);
  const [baseCompanies, setBaseCompanies] = useState<CompanyResponseDTO[]>([]);
  const [basePartners, setBasePartners] = useState<PartnerResponseDTO[]>([]);
  const [isLoadingBasePeople, setIsLoadingBasePeople] = useState(false);
  const [isLoadingBaseCompanies, setIsLoadingBaseCompanies] = useState(false);
  const [isLoadingBasePartners, setIsLoadingBasePartners] = useState(false);
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
  const [rubricaPendingPaymentSelectionId, setRubricaPendingPaymentSelectionId] =
    useState<ID | null>(null);
  const [lancamentoPendingDeletion, setLancamentoPendingDeletion] = useState<{
    itemId: ID;
    itemDescricao: string;
    subitemId: ID;
    subitemNome: string;
    lancamento: Lancamento;
  } | null>(null);
  const [reclassifyModalState, setReclassifyModalState] = useState<{
    expenseId: number;
    currentItemId: ID;
    currentItemLabel: string;
  } | null>(null);
  const [reclassifyTargetItemId, setReclassifyTargetItemId] = useState<ID | null>(null);
  const [reclassifyReason, setReclassifyReason] = useState('');
  const [reclassifyFieldErrors, setReclassifyFieldErrors] = useState<{
    targetBudgetItemId?: string;
    reason?: string;
  }>({});
  const pageErrorRef = useRef<HTMLDivElement | null>(null);

  const selectedSubitemItem = useMemo(() => {
    if (!subitemModalItemId) return null;

    for (const rubrica of rubricas) {
      const item = rubrica.itens.find((entry) => entry.id === subitemModalItemId);
      if (item) return item;
    }

    return null;
  }, [subitemModalItemId, rubricas]);

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

  const closeReclassifyModal = () => {
    setReclassifyModalState(null);
    setReclassifyTargetItemId(null);
    setReclassifyReason('');
    setReclassifyFieldErrors({});
  };

  const closeRubricaPaymentSelectionModal = () => {
    setRubricaPendingPaymentSelectionId(null);
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
  const projectPeopleByLinkId = useMemo(
    () => new Map(projectPeople.map((person) => [person.projectLinkId, person])),
    [projectPeople]
  );
  const projectCompaniesById = useMemo(
    () => new Map(projectCompanies.map((company) => [company.companyId, company])),
    [projectCompanies]
  );
  const projectCompaniesByLinkId = useMemo(
    () => new Map(projectCompanies.map((company) => [company.projectLinkId, company])),
    [projectCompanies]
  );
  const projectPartnersByLinkId = useMemo(
    () => new Map(projectPartners.map((p) => [p.projectLinkId, p])),
    [projectPartners]
  );
  const resolveProjectCompanyLinkId = useCallback(
    (companyId: string | undefined) =>
      companyId ? parsePersistedId(projectCompaniesById.get(companyId)?.projectLinkId) : null,
    [projectCompaniesById]
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
  const projectPartnerIdSet = useMemo(
    () => new Set(projectPartners.map((p) => p.partnerId)),
    [projectPartners]
  );
  const linkableBasePartners = useMemo(
    () =>
      basePartners
        .filter((partner) => partner.isActive && !projectPartnerIdSet.has(String(partner.id)))
        .sort((a, b) => {
          const nameA = a.tradeName?.trim() || a.name;
          const nameB = b.tradeName?.trim() || b.name;
          return nameA.localeCompare(nameB, 'pt-BR');
        }),
    [basePartners, projectPartnerIdSet]
  );

  const getDefaultSubitemFormForItem = useCallback(
    (_item: ItemRubrica): NewSubitemFormState => DEFAULT_NEW_SUBITEM_FORM,
    []
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
    setSubitemModalFieldErrors({});
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
        const linkedCompany = projectCompaniesById.get(subitem.organizationId ?? '');
        return `Empresa: ${
          linkedCompany
            ? buildProjectCompanyDisplayLabel(linkedCompany)
            : 'Empresa vinculada ao projeto'
        }`;
      }

      if (subitem.vinculoTipo === 'partner') {
        const linkedPartner = projectPartnersByLinkId.get(subitem.partnerId ?? '');
        return `IF/Fundação: ${linkedPartner?.name ?? 'Parceiro vinculado ao projeto'}`;
      }

      return 'Sem vínculo';
    },
    [projectCompaniesById, projectPartnersByLinkId, projectPeopleById]
  );

  const loadProjectLinks = useCallback(async () => {
    if (!Number.isFinite(projectId)) {
      setProjectPeople([]);
      setProjectCompanies([]);
      setProjectLinksError('ID do contrato inválido para carregar vínculos do projeto.');
      return;
    }

    setIsLoadingProjectLinks(true);
    setProjectLinksError(null);

    try {
      const [peopleLinks, companyLinks, partnerLinks] = await Promise.all([
        fetchAllPages<ProjectPeopleDetailedResponseDTO>((query) =>
          listProjectPeopleDetailed({ ...query, projectId })
        ),
        fetchAllPages<ProjectCompanyDetailedResponseDTO>((query) =>
          listProjectCompaniesDetailed({ ...query, projectId })
        ),
        fetchAllPages<ProjectPartnerLinkResponseDTO>((query) =>
          listProjectPartnerLinks(projectId, query)
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
          const cnpj = formatCnpj(link.companyCnpj);
          const statusLabel = getContractingStatusLabel(link.status ?? null);
          return {
            projectLinkId: String(link.id),
            companyId: String(link.companyId),
            name,
            cnpj: link.companyCnpj ?? null,
            status: link.status ?? null,
            label: [name, cnpj ? `CNPJ ${cnpj}` : null, statusLabel]
              .filter(Boolean)
              .join(' • '),
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

      const mappedPartners = partnerLinks
        .filter((link) => link.partnerId != null)
        .map<ProjectLinkedPartner>((link) => {
          const name = link.partnerTradeName?.trim() || link.partnerName?.trim() || `Parceiro ${link.partnerId}`;
          const typeLabel = link.partnerType === 'IF' ? 'IF' : link.partnerType === 'FUNDACAO' ? 'Fundação' : null;
          return {
            projectLinkId: String(link.id),
            partnerId: String(link.partnerId),
            name,
            label: typeLabel ? `${name} • ${typeLabel}` : name,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

      setProjectPeople(mappedPeople);
      setProjectCompanies(mappedCompanies);
      setProjectPartners(mappedPartners);
    } catch (error) {
      setProjectPeople([]);
      setProjectCompanies([]);
      setProjectPartners([]);
      setProjectLinksError(
        toErrorMessage(error, 'Não foi possível carregar as pessoas, empresas e parceiros vinculados ao projeto.')
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

  const loadBasePartners = useCallback(async () => {
    setIsLoadingBasePartners(true);

    try {
      const partners = await fetchAllPages<PartnerResponseDTO>((query) =>
        listPartners({ page: query.page, size: query.size })
      );
      setBasePartners(partners);
    } finally {
      setIsLoadingBasePartners(false);
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
          status: income.status ?? 'RECEBIDO',
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
          projectPeopleId: item.projectPeopleId != null ? String(item.projectPeopleId) : undefined,
          projectCompanyId:
            item.projectCompanyId != null ? String(item.projectCompanyId) : undefined,
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
        const projectLinkedCompanyId =
          expense.projectCompanyId != null ? String(expense.projectCompanyId) : undefined;
        const mappedCompanyId =
          projectLinkedCompanyId != null
            ? projectCompaniesByLinkId.get(projectLinkedCompanyId)?.companyId
            : undefined;
        const organizationIdForUi =
          mappedCompanyId ?? (expense.organizationId != null ? String(expense.organizationId) : undefined);

        const description = expense.description?.trim() || `Lançamento ${expense.id}`;
        const baseKey = `${expense.personId ?? '0'}|${projectLinkedCompanyId ?? expense.organizationId ?? '0'}|${expense.projectPartnerId ?? '0'}|${description.toLowerCase()}`;

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
            vinculoTipo: expense.projectPartnerId != null
              ? 'partner'
              : expense.organizationId || expense.projectCompanyId
                ? 'company'
                : expense.personId
                  ? 'person'
                  : 'none',
            personId: expense.personId != null ? String(expense.personId) : undefined,
            organizationId: organizationIdForUi,
            partnerId: expense.projectPartnerId != null ? String(expense.projectPartnerId) : undefined,
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
            paymentStatus: expense.paymentStatus ?? 'PAGO',
            paidBy: normalizePaidBy(expense.paidBy),
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
  }, [projectCompaniesByLinkId, projectId]);

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
    (subitem.lancamentos ?? []).reduce(
      (acc, lancamento) =>
        lancamento.paymentStatus === 'PAGO' ? acc + safeNumber(lancamento.valor) : acc,
      0
    );

  const calcularTotalReservadoSubitem = (subitem: Subitem) =>
    (subitem.lancamentos ?? []).reduce(
      (acc, lancamento) =>
        lancamento.paymentStatus === 'RESERVADO' ? acc + safeNumber(lancamento.valor) : acc,
      0
    );

  const calcularTotalPagamentoRecebidoSubitem = (subitem: Subitem) =>
    (subitem.lancamentos ?? []).reduce(
      (acc, lancamento) =>
        lancamento.paymentStatus === 'PAGAMENTO_RECEBIDO' ? acc + safeNumber(lancamento.valor) : acc,
      0
    );

  const calcularTotalComprometidoSubitem = (subitem: Subitem) =>
    Number((calcularTotalPagoSubitem(subitem) + calcularTotalReservadoSubitem(subitem)).toFixed(2));

  const obterResumoLancamentosSubitem = (subitem: Subitem) => {
    const lancamentosOrdenados = sortLancamentos(subitem.lancamentos ?? []);
    const ultimaDataLancamento = lancamentosOrdenados.reduce(
      (latest, lancamento) => (lancamento.dataPag && lancamento.dataPag > latest ? lancamento.dataPag : latest),
      ''
    );
    const ultimaDataPagamentoPago = lancamentosOrdenados.reduce(
      (latest, lancamento) =>
        lancamento.paymentStatus === 'PAGO' && lancamento.dataPag && lancamento.dataPag > latest
          ? lancamento.dataPag
          : latest,
      ''
    );

    return {
      lancamentosOrdenados,
      quantidade: lancamentosOrdenados.length,
      totalPago: calcularTotalPagoSubitem(subitem),
      totalReservado: calcularTotalReservadoSubitem(subitem),
      totalPagamentoRecebido: calcularTotalPagamentoRecebidoSubitem(subitem),
      totalComprometido: calcularTotalComprometidoSubitem(subitem),
      ultimaDataLancamento,
      ultimaDataPagamentoPago,
    };
  };

  const calcularTotalPagoItem = (item: ItemRubrica) =>
    (item.subitens ?? []).reduce((acc, subitem) => acc + calcularTotalPagoSubitem(subitem), 0);

  const calcularTotalReservadoItem = (item: ItemRubrica) =>
    (item.subitens ?? []).reduce((acc, subitem) => acc + calcularTotalReservadoSubitem(subitem), 0);

  const calcularTotalComprometidoItem = (item: ItemRubrica) =>
    Number((calcularTotalPagoItem(item) + calcularTotalReservadoItem(item)).toFixed(2));

  const contarLancamentosItem = (item: ItemRubrica) =>
    (item.subitens ?? []).reduce((acc, subitem) => acc + (subitem.lancamentos?.length ?? 0), 0);

  const calcularTotalOrcadoRubrica = (rubrica: Rubrica) =>
    rubrica.itens.reduce((acc, item) => acc + calcularTotalOrcadoItem(item), 0);

  const calcularTotalPagoRubrica = (rubrica: Rubrica) =>
    rubrica.itens.reduce((acc, item) => acc + calcularTotalPagoItem(item), 0);

  const calcularTotalReservadoRubrica = (rubrica: Rubrica) =>
    rubrica.itens.reduce((acc, item) => acc + calcularTotalReservadoItem(item), 0);

  const calcularTotalComprometidoRubrica = (rubrica: Rubrica) =>
    Number((calcularTotalPagoRubrica(rubrica) + calcularTotalReservadoRubrica(rubrica)).toFixed(2));

  const totalRecebido = useMemo(
    () =>
      parcelas.reduce(
        (acc, parcela) =>
          parcela.status === 'RECEBIDO' ? acc + safeNumber(parcela.valorRecebido) : acc,
        0
      ),
    [parcelas]
  );

  const totalRecebimentoAguardo = useMemo(
    () =>
      parcelas.reduce(
        (acc, parcela) =>
          parcela.status === 'FATURADO' ? acc + safeNumber(parcela.valorRecebido) : acc,
        0
      ),
    [parcelas]
  );

  const totalPago = rubricas.reduce(
    (accRubrica, rubrica) =>
      accRubrica + rubrica.itens.reduce((accItem, item) => accItem + calcularTotalPagoItem(item), 0),
    0
  );

  const totalReservado = rubricas.reduce(
    (accRubrica, rubrica) =>
      accRubrica +
      rubrica.itens.reduce((accItem, item) => accItem + calcularTotalReservadoItem(item), 0),
    0
  );

  const saldoRealContrato = calculateRealBalance(totalRecebido, totalPago);
  const saldoProjetoContrato = calculateProjectBalance(saldoRealContrato, totalReservado);

  const rubricaViews = useMemo<RubricaViewModel[]>(
    () =>
      rubricas.map((rubrica) => {
        const itemViews = rubrica.itens.map((item) => {
          const totalItem = calcularTotalOrcadoItem(item);
          const comprometidoItem = calcularTotalComprometidoItem(item);
          const pagoItem = calcularTotalPagoItem(item);
          const reservadoItem = calcularTotalReservadoItem(item);
          const saldoItem = totalItem - comprometidoItem;
          const totalLancamentosItem = contarLancamentosItem(item);

          const paymentViews = (item.subitens ?? []).map((subitem) => {
            const subitemKey = createSubitemKey(item.id, subitem.id);
            const {
              lancamentosOrdenados,
              quantidade,
              totalComprometido,
              totalPago,
              totalReservado,
              ultimaDataPagamentoPago,
            } = obterResumoLancamentosSubitem(subitem);
            const isEditingLancamentos =
              isEditingSubitens &&
              editingSubitemSession?.subitemKey === subitemKey &&
              editingLancamentosSubitemKey === subitemKey;

            return {
              key: subitemKey,
              itemId: item.id,
              itemDescricao: item.descricao,
              payment: subitem,
              quantidade,
              totalComprometido,
              totalPago,
              totalReservado,
              totalSubitem: calcularTotalComprometidoSubitem(subitem),
              ultimaDataPagamentoPago,
              lancamentosParaExibir: isEditingLancamentos
                ? subitem.lancamentos ?? []
                : lancamentosOrdenados,
              hasLancamentos: quantidade > 0,
              isExpanded: expandedSubitemKey === subitemKey,
              isEditingLancamentos,
              vinculoLabel: getSubitemVinculoLabel(subitem),
            } satisfies PaymentViewModel;
          });

          return {
            item,
            totalItem,
            comprometidoItem,
            pagoItem,
            reservadoItem,
            saldoItem,
            totalLancamentosItem,
            totalPagamentosItem: paymentViews.length,
            paymentViews,
          } satisfies ItemViewModel;
        });

        return {
          rubrica,
          orcadoRubrica: calcularTotalOrcadoRubrica(rubrica),
          comprometidoRubrica: calcularTotalComprometidoRubrica(rubrica),
          pagoRubrica: calcularTotalPagoRubrica(rubrica),
          reservadoRubrica: calcularTotalReservadoRubrica(rubrica),
          saldoRubrica: calcularTotalOrcadoRubrica(rubrica) - calcularTotalComprometidoRubrica(rubrica),
          totalPagamentosRubrica: itemViews.reduce((acc, itemView) => acc + itemView.totalPagamentosItem, 0),
          totalLancamentosRubrica: itemViews.reduce((acc, itemView) => acc + itemView.totalLancamentosItem, 0),
          itemViews,
        } satisfies RubricaViewModel;
      }),
    // The helper callbacks above are pure derivations from current render state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      rubricas,
      isEditingSubitens,
      editingSubitemSession,
      editingLancamentosSubitemKey,
      expandedSubitemKey,
      getSubitemVinculoLabel,
    ]
  );

  const rubricaPendingPaymentSelectionView = useMemo(
    () =>
      rubricaPendingPaymentSelectionId != null
        ? rubricaViews.find((entry) => entry.rubrica.id === rubricaPendingPaymentSelectionId) ?? null
        : null,
    [rubricaViews, rubricaPendingPaymentSelectionId]
  );

  const handleStartAddPaymentFromRubrica = (rubricaId: ID) => {
    if (!ensureCanManageChildren()) return;
    if (isPersisting) return;
    if (editingSubitemSession) {
      setActionError('Salve ou cancele o pagamento em edição antes de criar outro.');
      return;
    }

    const rubrica = rubricas.find((entry) => entry.id === rubricaId);
    if (!rubrica) {
      setActionError('Rubrica inválida para adicionar pagamento.');
      return;
    }

    if (rubrica.itens.length === 0) {
      setActionError(`A rubrica "${rubrica.nome}" não possui itens para receber pagamentos.`);
      return;
    }

    if (rubrica.itens.length === 1) {
      handleStartAddSubitem(rubrica.itens[0].id);
      return;
    }

    setActionError(null);
    setRubricaPendingPaymentSelectionId(rubrica.id);
  };

  const handleSelectItemForRubricaPayment = (itemId: ID) => {
    closeRubricaPaymentSelectionModal();
    handleStartAddSubitem(itemId);
  };

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

  const reclassifyTargetOptions = useMemo(() => {
    const currentItemId = reclassifyModalState?.currentItemId;
    return rubricas.flatMap((rubrica) =>
      rubrica.itens
        .filter((item) => item.id !== currentItemId)
        .map((item) => ({
          value: item.id,
          label: `[${rubrica.codigo}] ${item.descricao}`,
        }))
    );
  }, [reclassifyModalState?.currentItemId, rubricas]);

  const findItemById = (itemId: ID) => {
    for (const rubrica of rubricas) {
      const item = rubrica.itens.find((entry) => entry.id === itemId);
      if (item) return item;
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
    patch: Pick<Subitem, 'empresaRh' | 'vinculoTipo' | 'personId' | 'organizationId' | 'partnerId'>
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
                    partnerId: patch.partnerId,
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
        status: newParcela.status,
      });
      setNewParcela({ valorRecebido: 0, dataRecebimento: '', status: 'RECEBIDO' });
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
      setActionError('Parcela inválida para atualização.');
      return;
    }

    setIsPersisting(true);
    setActionError(null);
    try {
      await updateIncome(Number.parseInt(editParcelaForm.id, 10), {
        numero: editParcelaForm.numero,
        amount: toMoneyValue(editParcelaForm.valorRecebido),
        receivedAt: editParcelaForm.dataRecebimento,
        status: editParcelaForm.status,
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
        setActionError('Parcela inválida para remoção.');
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
        setActionError(toErrorMessage(error, 'Não foi possível remover a parcela.'));
      } finally {
        setIsPersisting(false);
      }
      return;
    }
    if (!isPersistedId(parcelaId)) {
      setActionError('Parcela inválida para remoção.');
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
      setSubitemModalError('Informe o nome do pagamento.');
      return;
    }

    const effectiveVinculoTipo = subitemModalForm.vinculoTipo;
    const effectivePersonId = subitemModalForm.personId;
    const effectiveOrganizationId = subitemModalForm.organizationId;
    const effectivePartnerId = subitemModalForm.partnerId;

    if (effectiveVinculoTipo === 'person' && !effectivePersonId) {
      setSubitemModalError('Selecione uma pessoa vinculada ao projeto.');
      return;
    }

    if (effectiveVinculoTipo === 'company' && !effectiveOrganizationId) {
      setSubitemModalError('Selecione uma empresa vinculada ao projeto.');
      return;
    }

    if (effectiveVinculoTipo === 'none') {
      setSubitemModalError('Selecione o tipo de vínculo do pagamento (pessoa, empresa ou parceiro).');
      return;
    }

    if (effectiveVinculoTipo === 'partner' && !effectivePartnerId) {
      setSubitemModalError('Selecione um parceiro (IF/Fundação) vinculado ao projeto.');
      return;
    }

    const subitem: Subitem = {
      id: createDraftId('sub'),
      empresaRh: nome,
      lancamentos: [],
      vinculoTipo: effectiveVinculoTipo,
      personId: effectiveVinculoTipo === 'person' ? effectivePersonId : undefined,
      organizationId: effectiveVinculoTipo === 'company' ? effectiveOrganizationId : undefined,
      partnerId: effectiveVinculoTipo === 'partner' ? effectivePartnerId : undefined,
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
    showSavedMessage('Pagamento criado. Adicione um lançamento para persisti-lo.');
  };

  const handleStartAddSubitem = (itemId: ID) => {
    if (!ensureCanManageChildren()) return;
    if (isPersisting) return;
    if (editingSubitemSession) {
      setActionError('Salve ou cancele o subitem em edição antes de criar outro.');
      return;
    }

    const selectedItem = findItemById(itemId);
    if (!selectedItem) {
      setActionError('Item inválido para criar pagamento.');
      return;
    }

    setActionError(null);
    setSubitemModalEditingContext(null);
    setSubitemModalForm(getDefaultSubitemFormForItem(selectedItem));
    setSubitemModalError(null);
    setSubitemModalFieldErrors({});
    setSubitemModalItemId(itemId);
    setIsSubitemModalOpen(true);
  };

  const handleConfirmarRecebimentoParcela = async (parcela: Parcela) => {
    if (!ensureCanManageChildren()) return;
    if (!isPersistedId(parcela.id)) {
      setActionError('Parcela inválida para confirmação de recebimento.');
      return;
    }
    if (parcela.status === 'RECEBIDO') {
      return;
    }

    setIsPersisting(true);
    setActionError(null);
    try {
      await updateIncome(Number.parseInt(parcela.id, 10), {
        numero: parcela.numero,
        amount: toMoneyValue(parcela.valorRecebido),
        receivedAt: parcela.dataRecebimento,
        status: 'RECEBIDO',
      });
      await loadData();
      showSavedMessage('Recebimento confirmado com sucesso.');
    } catch (error) {
      setActionError(toErrorMessage(error, 'Não foi possível confirmar o recebimento da parcela.'));
    } finally {
      setIsPersisting(false);
    }
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
    setSubitemModalFieldErrors({});
    setSubitemModalItemId(itemId);
    setSubitemModalEditingContext({ itemId, subitemId });
    setSubitemModalForm({
      nome: selected.subitem.empresaRh,
      vinculoTipo: selected.subitem.vinculoTipo,
      personId: selected.subitem.personId ?? '',
      organizationId: selected.subitem.organizationId ?? '',
      partnerId: selected.subitem.partnerId ?? '',
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
      status: DEFAULT_PROJECT_PERSON_STATUS,
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
      status: DEFAULT_PROJECT_PERSON_STATUS,
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

  const handleOpenLinkExistingPartnerModal = async () => {
    if (!ensureCanManageChildren()) return;

    setSubitemModalError(null);
    setSubitemModalForm((current) => ({
      ...current,
      vinculoTipo: 'partner',
      personId: '',
      organizationId: '',
    }));

    try {
      await loadBasePartners();
      setIsLinkExistingPartnerModalOpen(true);
    } catch (error) {
      setSubitemModalError(
        toErrorMessage(error, 'Não foi possível carregar os parceiros cadastrados.')
      );
    }
  };

  const handleLinkExistingPartner = async (partnerId: number) => {
    if (!Number.isFinite(projectId)) {
      throw new Error('ID do contrato inválido para vincular o parceiro.');
    }

    const linkResponse = await createProjectPartner(projectId, {
      partnerId,
      status: 'EM_EXECUCAO',
    });
    await loadProjectLinks();

    const linkedPartner = basePartners.find((p) => p.id === partnerId);
    setSubitemModalForm((current) => ({
      ...current,
      vinculoTipo: 'partner',
      partnerId: String(linkResponse.id),
      personId: '',
      organizationId: '',
      nome: current.nome.trim()
        ? current.nome
        : (linkedPartner?.tradeName?.trim() || linkedPartner?.name) ?? current.nome,
    }));
    setIsLinkExistingPartnerModalOpen(false);
    setSubitemModalError(null);
    showSavedMessage('Parceiro vinculado ao projeto com sucesso.');
  };

  const handleCreateAndLinkPartner = async (payload: PartnerRequestDTO) => {
    if (!Number.isFinite(projectId)) {
      throw new Error('ID do contrato inválido para vincular o parceiro.');
    }

    const createdPartner = await createPartner(payload);
    const linkResponse = await createProjectPartner(projectId, {
      partnerId: createdPartner.id,
      status: 'EM_EXECUCAO',
    });
    await loadProjectLinks();

    setSubitemModalForm((current) => ({
      ...current,
      vinculoTipo: 'partner',
      partnerId: String(linkResponse.id),
      personId: '',
      organizationId: '',
      nome: current.nome.trim()
        ? current.nome
        : createdPartner.tradeName?.trim() || createdPartner.name,
    }));
    setSubitemModalError(null);
    setIsCreatePartnerModalOpen(false);
    showSavedMessage('Parceiro criado e vinculado ao projeto com sucesso.');
  };

  const handleSaveSubitemModal = async () => {
    setSubitemModalFieldErrors({});
    const itemId = subitemModalItemId;
    if (!itemId) {
      setSubitemModalError('Item inválido para salvar o pagamento.');
      return;
    }

    const nome = subitemModalForm.nome.trim();
    if (!nome) {
      setSubitemModalError('Informe o nome do pagamento.');
      return;
    }

    const effectiveVinculoTipo = subitemModalForm.vinculoTipo;
    const effectivePersonId = subitemModalForm.personId;
    const effectiveOrganizationId = subitemModalForm.organizationId;
    const effectivePartnerId = subitemModalForm.partnerId;

    if (effectiveVinculoTipo === 'person' && !effectivePersonId) {
      setSubitemModalError('Selecione uma pessoa vinculada ao projeto.');
      return;
    }

    if (effectiveVinculoTipo === 'company' && !effectiveOrganizationId) {
      setSubitemModalError('Selecione uma empresa vinculada ao projeto.');
      return;
    }

    if (effectiveVinculoTipo === 'none') {
      setSubitemModalError('Selecione o tipo de vínculo do pagamento (pessoa, empresa ou parceiro).');
      return;
    }

    if (effectiveVinculoTipo === 'partner' && !effectivePartnerId) {
      setSubitemModalError('Selecione um parceiro (IF/Fundação) vinculado ao projeto.');
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

    const nextPersonId = effectiveVinculoTipo === 'person' ? effectivePersonId || undefined : undefined;
    const nextOrganizationId =
      effectiveVinculoTipo === 'company' ? effectiveOrganizationId || undefined : undefined;
    const nextProjectCompanyId =
      effectiveVinculoTipo === 'company'
        ? resolveProjectCompanyLinkId(nextOrganizationId)
        : null;
    const nextPartnerId = effectiveVinculoTipo === 'partner' ? effectivePartnerId || undefined : undefined;

    updateSubitemDraftState(itemId, subitemId, {
      empresaRh: nome,
      vinculoTipo: effectiveVinculoTipo,
      personId: nextPersonId,
      organizationId: nextOrganizationId,
      partnerId: nextPartnerId,
    });

    const expenseIds = (selected.subitem.lancamentos ?? [])
      .map((lancamento) => parsePersistedId(lancamento.expenseId))
      .filter((expenseId): expenseId is number => expenseId != null);

    if (expenseIds.length === 0) {
      closeSubitemModal({ discardTransientDraft: false });
      showSavedMessage('Pagamento atualizado com sucesso.');
      return;
    }
    if (effectiveVinculoTipo === 'company' && !nextProjectCompanyId) {
      setSubitemModalError('Não foi possível resolver o vínculo da empresa no projeto.');
      return;
    }

    const nextProjectPartnerId = nextPartnerId ? Number.parseInt(nextPartnerId, 10) : undefined;

    const budgetItemId = parsePersistedId(selected.item.id);
    if (budgetItemId == null) {
      setSubitemModalError('Item inválido para persistir o pagamento.');
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
          paymentStatus: currentExpense.paymentStatus ?? 'PAGO',
          personId: nextPersonId ? Number.parseInt(nextPersonId, 10) : undefined,
          organizationId: effectiveVinculoTipo === 'company'
            ? undefined
            : nextOrganizationId
              ? Number.parseInt(nextOrganizationId, 10)
              : undefined,
          projectCompanyId: nextProjectCompanyId ?? undefined,
          projectPartnerId: nextProjectPartnerId,
          description: nome,
          invoiceNumber: currentExpense.invoiceNumber ?? undefined,
          invoiceDate: currentExpense.invoiceDate ?? undefined,
          documentId: currentExpense.documentId ?? undefined,
        });
      }

      await loadData();
      closeSubitemModal({ discardTransientDraft: false });
      showSavedMessage('Pagamento atualizado com sucesso.');
    } catch (error) {
      const mappedFieldErrors = mapPaymentFieldErrors(error);
      if (Object.keys(mappedFieldErrors).length > 0) {
        setSubitemModalFieldErrors(mappedFieldErrors);
        setSubitemModalError(null);
      } else {
        setSubitemModalError(toErrorMessage(error, 'Não foi possível atualizar o pagamento.'));
      }
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
      showSavedMessage('Pagamento removido com sucesso.');
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
      showSavedMessage('Pagamento removido com sucesso.');
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

  const handleDuplicateLancamento = (itemId: ID, subitemId: ID, lancamentoId: ID) => {
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

    if (!beginEditingSubitem(itemId, subitemId)) {
      return;
    }

    const duplicateLancamento: Lancamento = {
      ...lancamentoSelecionado,
      id: createDraftId('lanc'),
      dataPag: '',
      expenseId: undefined,
    };

    const lancamentos = subitemSelecionado.lancamentos ?? [];
    const launchIndex = lancamentos.findIndex((lancamento) => lancamento.id === lancamentoId);
    const insertIndex = launchIndex >= 0 ? launchIndex + 1 : lancamentos.length;

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
            subitens: (item.subitens ?? []).map((subitem) => {
              if (subitem.id !== subitemId) return subitem;

              const nextLancamentos = [...(subitem.lancamentos ?? [])];
              nextLancamentos.splice(insertIndex, 0, duplicateLancamento);

              return {
                ...subitem,
                lancamentos: nextLancamentos,
              };
            }),
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
    patch: Partial<Pick<Lancamento, 'valor' | 'dataPag' | 'paymentStatus' | 'paidBy'>>
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
                        paymentStatus:
                          patch.paymentStatus != null ? patch.paymentStatus : lancamento.paymentStatus,
                        paidBy: patch.paidBy != null ? patch.paidBy : lancamento.paidBy,
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

  const handleMarkLancamentoAsPaid = async (itemId: ID, subitemId: ID, lancamentoId: ID) => {
    if (!ensureCanManageChildren()) return;

    if (editingSubitemSession) {
      setActionError('Salve ou cancele a edição atual antes de alterar outro lançamento.');
      return;
    }

    const selected = findItemAndSubitem(itemId, subitemId);
    if (!selected) {
      setActionError('Lançamento inválido para atualização rápida.');
      return;
    }

    const { item, subitem } = selected;
    const lancamento = (subitem.lancamentos ?? []).find((entry) => entry.id === lancamentoId);
    if (!lancamento) {
      setActionError('Lançamento inválido para atualização rápida.');
      return;
    }

    if (lancamento.paymentStatus === 'PAGO') {
      return;
    }

    const expenseId = parsePersistedId(lancamento.expenseId);
    if (expenseId == null) {
      updateLancamentoCampo(itemId, subitemId, lancamentoId, { paymentStatus: 'PAGO' });
      showSavedMessage('Lançamento marcado como pago. Salve as alterações para persistir.');
      return;
    }

    const currentExpense = backendExpenses.find((expense) => expense.id === expenseId);
    if (!currentExpense) {
      setActionError('Não foi possível localizar o lançamento no backend para marcá-lo como pago.');
      return;
    }

    const description = subitem.empresaRh.trim();
    const personId = subitem.vinculoTipo === 'person' ? parsePersistedId(subitem.personId) : null;
    const organizationId =
      subitem.vinculoTipo === 'company' ? parsePersistedId(subitem.organizationId) : null;
    const projectCompanyId =
      subitem.vinculoTipo === 'company'
        ? resolveProjectCompanyLinkId(subitem.organizationId)
        : null;
    const partnerId = subitem.vinculoTipo === 'partner' ? parsePersistedId(subitem.partnerId) : null;

    const payload: ExpenseUpdateDTO = {
      projectId,
      budgetItemId: parsePersistedId(item.id) ?? currentExpense.budgetItemId,
      categoryId: item.categoryId,
      expenseDate: (lancamento.dataPag || currentExpense.expenseDate || '').trim() || currentExpense.expenseDate,
      quantity: toPositiveInt(currentExpense.quantity, 1),
      amount: toMoneyValue(lancamento.valor),
      paymentStatus: 'PAGO',
      paidBy: normalizePaidBy(lancamento.paidBy ?? currentExpense.paidBy),
      personId: personId ?? undefined,
      organizationId:
        subitem.vinculoTipo === 'company' ? undefined : organizationId ?? undefined,
      projectCompanyId: projectCompanyId ?? undefined,
      projectPartnerId: partnerId ?? undefined,
      description: description || currentExpense.description || undefined,
      invoiceNumber: currentExpense.invoiceNumber ?? undefined,
      invoiceDate: currentExpense.invoiceDate ?? undefined,
      documentId: currentExpense.documentId ?? undefined,
    };

    setIsPersisting(true);
    setActionError(null);

    try {
      await updateExpense(expenseId, payload);
      await loadData();
      showSavedMessage('Lançamento reservado marcado como pago.');
    } catch (error) {
      setActionError(toErrorMessage(error, 'Não foi possível marcar o lançamento como pago.'));
    } finally {
      setIsPersisting(false);
    }
  };

  const handleStartReclassifyLaunch = (itemId: ID, launch: Lancamento) => {
    if (!ensureCanManageChildren() || isPersisting) return;

    const expenseId = parsePersistedId(launch.expenseId);
    if (!expenseId) {
      setActionError('Somente lançamentos já salvos podem ser reclassificados.');
      return;
    }

    const currentItem = findItemById(itemId);
    setReclassifyModalState({
      expenseId,
      currentItemId: itemId,
      currentItemLabel: currentItem?.descricao ?? `Item #${itemId}`,
    });
    setReclassifyTargetItemId(null);
    setReclassifyReason('');
    setReclassifyFieldErrors({});
    setActionError(null);
  };

  const handleConfirmReclassify = async () => {
    if (!reclassifyModalState) return;

    const targetBudgetItemId = parsePersistedId(reclassifyTargetItemId);
    const reason = reclassifyReason.trim();
    const nextErrors: { targetBudgetItemId?: string; reason?: string } = {};

    if (!targetBudgetItemId) {
      nextErrors.targetBudgetItemId = 'Selecione o item de destino.';
    }
    if (!reason) {
      nextErrors.reason = 'Informe o motivo da reclassificação.';
    }
    if (Object.keys(nextErrors).length > 0) {
      setReclassifyFieldErrors(nextErrors);
      return;
    }
    const safeTargetBudgetItemId = targetBudgetItemId as number;

    setIsPersisting(true);
    setActionError(null);
    setReclassifyFieldErrors({});

    try {
      await reclassifyExpense(reclassifyModalState.expenseId, {
        targetBudgetItemId: safeTargetBudgetItemId,
        reason,
      });
      await loadData();
      closeReclassifyModal();
      showSavedMessage('Despesa reclassificada com sucesso.');
    } catch (error) {
      if (error instanceof HttpError && error.fieldErrors) {
        setReclassifyFieldErrors({
          targetBudgetItemId: error.fieldErrors.targetBudgetItemId,
          reason: error.fieldErrors.reason,
        });
      }
      setActionError(toErrorMessage(error, 'Não foi possível reclassificar a despesa.'));
    } finally {
      setIsPersisting(false);
    }
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
      setActionError('Selecione um pagamento para salvar.');
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
    const projectCompanyId =
      subitem.vinculoTipo === 'company'
        ? resolveProjectCompanyLinkId(subitem.organizationId)
        : null;
    const partnerId = subitem.vinculoTipo === 'partner' ? parsePersistedId(subitem.partnerId) : null;

    const currentExpenseById = new Map(backendExpenses.map((expense) => [expense.id, expense]));
    const keepExpenseIds = new Set<number>();
    const createPayloads: ExpenseRequestDTO[] = [];
    const updatePayloads: Array<{ id: number; payload: ExpenseUpdateDTO }> = [];

    for (const lancamento of subitem.lancamentos ?? []) {
      const amount = toMoneyValue(lancamento.valor);
      const expenseDate = (lancamento.dataPag || '').trim();
      const paymentStatus = lancamento.paymentStatus ?? 'PAGO';
      const paidBy = normalizePaidBy(lancamento.paidBy);
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
        setActionError(`Informe o nome do pagamento no item "${item.descricao}".`);
        return;
      }

      if (subitem.vinculoTipo === 'none') {
        setActionError(`Selecione o tipo de vínculo para o subitem "${description}" (pessoa, empresa ou parceiro).`);
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
      if (subitem.vinculoTipo === 'company' && !projectCompanyId) {
        setActionError(
          `Não foi possível resolver o vínculo da empresa no projeto para o subitem "${description}".`
        );
        return;
      }
      if (subitem.vinculoTipo === 'partner' && !partnerId) {
        setActionError(`Selecione um parceiro (IF/Fundação) vinculado ao projeto para o subitem "${description}".`);
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
            paymentStatus,
            paidBy,
            personId: personId ?? undefined,
            organizationId:
              subitem.vinculoTipo === 'company' ? undefined : organizationId ?? undefined,
            projectCompanyId: projectCompanyId ?? undefined,
            projectPartnerId: partnerId ?? undefined,
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
            paymentStatus,
            paidBy,
            personId: personId ?? undefined,
            organizationId:
              subitem.vinculoTipo === 'company' ? undefined : organizationId ?? undefined,
            projectCompanyId: projectCompanyId ?? undefined,
            projectPartnerId: partnerId ?? undefined,
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
            (currentExpense.paymentStatus ?? 'PAGO') !== payload.paymentStatus ||
            normalizePaidBy(currentExpense.paidBy) !== payload.paidBy ||
            (currentExpense.personId ?? null) !== (payload.personId ?? null) ||
            (currentExpense.organizationId ?? null) !== (payload.organizationId ?? null) ||
            (currentExpense.projectCompanyId ?? null) !== (payload.projectCompanyId ?? null) ||
            (currentExpense.projectPartnerId ?? null) !== (payload.projectPartnerId ?? null) ||
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
          paymentStatus,
          paidBy,
          personId: personId ?? undefined,
          organizationId:
            subitem.vinculoTipo === 'company' ? undefined : organizationId ?? undefined,
          projectCompanyId: projectCompanyId ?? undefined,
          projectPartnerId: partnerId ?? undefined,
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
      setActionError(toErrorMessage(error, 'Não foi possível salvar o pagamento.'));
    } finally {
      setIsPersisting(false);
    }
    return;

    /*
    for (const rubrica of rubricas) {
      for (const item of rubrica.itens) {
        const budgetItemId = parsePersistedId(item.id);
        if (!budgetItemId) {
          validationErrors.push(`Item "${item.descricao}" inválido para persistência.`);
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
              validationErrors.push(`Informe o nome do pagamento no item "${item.descricao}".`);
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

  if (isLoading) {
    return (
      <div ref={pageErrorRef} className="space-y-6 scroll-mt-24">
        <ContractPagamentosLoadingSkeleton />
      </div>
    );
  }

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

      <PaymentsFinancialSummarySection
        totalRecebido={totalRecebido}
        totalPago={totalPago}
        totalReservado={totalReservado}
        totalRecebimentoAguardo={totalRecebimentoAguardo}
        saldoRealContrato={saldoRealContrato}
        saldoProjetoContrato={saldoProjetoContrato}
      />

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
            <div className="mb-3 grid grid-cols-1 gap-4 md:grid-cols-3">
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
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Status <span className="text-red-500">*</span>
                </label>
                <Dropdown
                  value={newParcela.status}
                  onChange={(value) =>
                    setNewParcela((current) => ({
                      ...current,
                      status: (value as IncomeStatusEnum | undefined) ?? 'RECEBIDO',
                    }))
                  }
                  disabled={isPersisting}
                  options={INCOME_STATUS_OPTIONS}
                  className="h-11 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm text-slate-700"
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
                  setNewParcela({ valorRecebido: 0, dataRecebimento: '', status: 'RECEBIDO' });
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
                <th className="w-52 px-3 py-2 text-center font-medium text-gray-600">Status</th>
                <th className="w-28 px-3 py-2 text-center font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {parcelasOrdenadas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
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
                          <div className="flex justify-center">
                            <Dropdown
                              value={editParcelaForm.status}
                              onChange={(value) =>
                                setEditParcelaForm((current) =>
                                  current
                                    ? {
                                      ...current,
                                      status: (value as IncomeStatusEnum | undefined) ?? 'RECEBIDO',
                                    }
                                    : current
                                )
                              }
                              disabled={isPersisting}
                              options={INCOME_STATUS_OPTIONS}
                              className="h-9 w-full rounded border border-gray-300 px-2 py-1 text-sm"
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
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getIncomeStatusBadgeClassName(parcela.status)}`}>
                            {getIncomeStatusLabel(parcela.status)}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {canManageChildren ? (
                            <div className="flex items-center justify-center gap-1">
                              {parcela.status === 'FATURADO' ? (
                                <button
                                  onClick={() => {
                                    void handleConfirmarRecebimentoParcela(parcela);
                                  }}
                                  disabled={isPersisting}
                                  className="rounded p-1 text-emerald-700 hover:bg-emerald-50"
                                  title="Confirmar recebimento"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              ) : (
                                <span className="rounded p-1 opacity-0" aria-hidden>
                                  <Check className="h-4 w-4" />
                                </span>
                              )}
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

      <RubricasHierarchySection
        rubricaViews={rubricaViews}
        isLoading={isLoading}
        loadError={loadError}
        canManageChildren={canManageChildren}
        loadingAccess={loadingAccess}
        isPersisting={isPersisting}
        onToggleRubrica={toggleRubrica}
        onStartAddPaymentFromRubrica={handleStartAddPaymentFromRubrica}
        onStartAddPayment={handleStartAddSubitem}
        onStartEditPayment={handleStartEditSubitem}
        onRemovePayment={handleRemoveSubitem}
        onTogglePaymentLaunches={toggleExpandedSubitem}
        onEditLaunches={handleEditLancamentos}
        onSaveLaunches={() => {
          void handleSaveSubitens();
        }}
        onCancelLaunchEditing={() => {
          void cancelEditingSubitem();
        }}
        onAddLaunch={handleAddLancamento}
        onUpdateLaunch={updateLancamentoCampo}
        onRemoveLaunch={handleRemoveLancamento}
        onMarkLaunchPaid={handleMarkLancamentoAsPaid}
        onStartReclassifyLaunch={handleStartReclassifyLaunch}
        onDuplicateLaunch={handleDuplicateLancamento}
      />

      <BudgetItemPickerModal
        isOpen={Boolean(rubricaPendingPaymentSelectionView)}
        rubricaView={rubricaPendingPaymentSelectionView}
        isPersisting={isPersisting}
        onClose={closeRubricaPaymentSelectionModal}
        onSelectItem={handleSelectItemForRubricaPayment}
      />

      <ExpenseReclassifyModal
        isOpen={Boolean(reclassifyModalState)}
        isPersisting={isPersisting}
        currentItemLabel={reclassifyModalState?.currentItemLabel ?? null}
        targetOptions={reclassifyTargetOptions}
        targetItemId={reclassifyTargetItemId}
        reason={reclassifyReason}
        fieldErrors={reclassifyFieldErrors}
        onClose={closeReclassifyModal}
        onChangeTargetItemId={setReclassifyTargetItemId}
        onChangeReason={setReclassifyReason}
        onConfirm={() => {
          void handleConfirmReclassify();
        }}
      />

      <AppModalShell
        isOpen={Boolean(parcelaPendingDeletion)}
        title="Excluir parcela"
        description="Confirme a exclusão da parcela antes de continuar."
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
                Esta ação remove a parcela do contrato e não pode ser desfeita.
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
        title="Excluir pagamento"
        description="Confirme a exclusão do pagamento antes de continuar."
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
              Excluir pagamento
            </button>
          </div>
        }
      >
        {subitemPendingDeletion && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-800">
                Tem certeza de que deseja excluir este pagamento?
              </p>
              <p className="mt-1 text-sm text-red-700">
                Esta ação remove o pagamento e todos os lançamentos dele na edição atual.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Pagamento selecionado
              </p>
              <p className="mt-1 font-medium text-slate-900">
                {subitemPendingDeletion.subitem.empresaRh || subitemPendingDeletion.itemDescricao}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                <span>Item: {subitemPendingDeletion.itemDescricao}</span>
                <span>
                  Lançamentos: {subitemPendingDeletion.subitem.lancamentos.length}
                </span>
                <span>{getSubitemVinculoLabel(subitemPendingDeletion.subitem)}</span>
              </div>
            </div>
          </div>
        )}
      </AppModalShell>

      <AppModalShell
        isOpen={Boolean(lancamentoPendingDeletion)}
        title="Excluir lançamento"
        description="Confirme a exclusão do lançamento antes de continuar."
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
              Excluir lançamento
            </button>
          </div>
        }
      >
        {lancamentoPendingDeletion && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-800">
                Tem certeza de que deseja excluir este lançamento?
              </p>
              <p className="mt-1 text-sm text-red-700">
                Esta ação remove o lançamento da edição atual do pagamento.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Lançamento selecionado
              </p>
              <p className="mt-1 font-medium text-slate-900">
                {lancamentoPendingDeletion.subitemNome || lancamentoPendingDeletion.itemDescricao}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                <span>Item: {lancamentoPendingDeletion.itemDescricao}</span>
                <span>Valor: {formatCurrency(lancamentoPendingDeletion.lancamento.valor)}</span>
                <span>
                  Status: {getPaymentStatusLabel(lancamentoPendingDeletion.lancamento.paymentStatus)}
                </span>
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
        title={subitemModalEditingContext ? 'Editar pagamento' : 'Novo pagamento'}
        subtitle={
          subitemModalEditingContext
            ? 'Atualize o nome do pagamento e o vínculo dele dentro do projeto.'
            : 'Cadastre o nome do pagamento e escolha como ele será vinculado dentro do projeto.'
        }
        submitLabel={subitemModalEditingContext ? 'Salvar pagamento' : 'Adicionar pagamento'}
        form={subitemModalForm}
        error={subitemModalError}
        fieldErrors={subitemModalFieldErrors}
        linksError={projectLinksError}
        isLoadingLinks={isLoadingProjectLinks}
        projectPeople={projectPeople}
        projectCompanies={projectCompanies}
        projectPartners={projectPartners}
        lockBeneficiary={false}
        isPersisting={isPersisting}
        onChange={(patch) => {
          setSubitemModalError(null);
          setSubitemModalFieldErrors({});
          setSubitemModalForm((current) => ({ ...current, ...patch }));
        }}
        onClose={closeSubitemModal}
        onOpenCreatePerson={() => {
          setSubitemModalError(null);
          setSubitemModalFieldErrors({});
          setSubitemModalForm((current) => ({
            ...current,
            vinculoTipo: 'person',
            organizationId: '',
            partnerId: '',
          }));
          setIsCreatePersonModalOpen(true);
        }}
        onOpenCreateCompany={() => {
          setSubitemModalError(null);
          setSubitemModalFieldErrors({});
          setSubitemModalForm((current) => ({
            ...current,
            vinculoTipo: 'company',
            personId: '',
            partnerId: '',
          }));
          setIsCreateCompanyModalOpen(true);
        }}
        onOpenLinkExistingPerson={() => {
          void handleOpenLinkExistingPersonModal();
        }}
        onOpenLinkExistingCompany={() => {
          void handleOpenLinkExistingCompanyModal();
        }}
        onOpenCreatePartner={() => {
          setSubitemModalError(null);
          setSubitemModalFieldErrors({});
          setSubitemModalForm((current) => ({
            ...current,
            vinculoTipo: 'partner',
            personId: '',
            organizationId: '',
          }));
          setIsCreatePartnerModalOpen(true);
        }}
        onOpenLinkExistingPartner={() => {
          void handleOpenLinkExistingPartnerModal();
        }}
        onSubmit={() => {
          setSubitemModalFieldErrors({});
          if (!subitemModalItemId) {
            setSubitemModalError('Item inválido para criar pagamento.');
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

      <CreateLinkedPartnerModal
        isOpen={isCreatePartnerModalOpen}
        onClose={() => setIsCreatePartnerModalOpen(false)}
        onSave={handleCreateAndLinkPartner}
      />

      <LinkExistingPartnerModal
        isOpen={isLinkExistingPartnerModalOpen}
        partners={linkableBasePartners}
        isLoading={isLoadingBasePartners}
        onClose={() => setIsLinkExistingPartnerModalOpen(false)}
        onSave={handleLinkExistingPartner}
      />
    </div>
  );
}


type LaunchUpdatePatch = Partial<Pick<Lancamento, 'valor' | 'dataPag' | 'paymentStatus' | 'paidBy'>>;

type SharedPaymentPresentationHandlers = {
  canManageChildren: boolean;
  loadingAccess: boolean;
  isPersisting: boolean;
  onStartAddPayment: (itemId: ID) => void;
  onStartEditPayment: (itemId: ID, paymentId: ID) => void;
  onRemovePayment: (itemId: ID, paymentId: ID) => void;
  onTogglePaymentLaunches: (paymentKey: ID) => void;
  onEditLaunches: (itemId: ID, paymentId: ID) => void;
  onSaveLaunches: () => void;
  onCancelLaunchEditing: () => void;
  onAddLaunch: (itemId: ID, paymentId: ID) => void;
  onUpdateLaunch: (itemId: ID, paymentId: ID, launchId: ID, patch: LaunchUpdatePatch) => void;
  onRemoveLaunch: (itemId: ID, paymentId: ID, launchId: ID) => void;
  onMarkLaunchPaid: (itemId: ID, paymentId: ID, launchId: ID) => Promise<void>;
  onStartReclassifyLaunch: (itemId: ID, launch: Lancamento) => void;
  onDuplicateLaunch: (itemId: ID, paymentId: ID, launchId: ID) => void;
};

const INCOME_STATUS_OPTIONS: Array<{ value: IncomeStatusEnum; label: string }> = [
  { value: 'RECEBIDO', label: 'Recebido' },
  { value: 'FATURADO', label: 'Faturado (NF emitida)' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

type RubricasHierarchySectionProps = SharedPaymentPresentationHandlers & {
  rubricaViews: RubricaViewModel[];
  isLoading: boolean;
  loadError: string | null;
  onToggleRubrica: (rubricaId: ID) => void;
  onStartAddPaymentFromRubrica: (rubricaId: ID) => void;
};

type RubricaCardProps = SharedPaymentPresentationHandlers & {
  view: RubricaViewModel;
  onToggleRubrica: (rubricaId: ID) => void;
  onStartAddPaymentFromRubrica: (rubricaId: ID) => void;
};

type BudgetItemSectionProps = SharedPaymentPresentationHandlers & {
  view: ItemViewModel;
};

type PaymentCardProps = Omit<SharedPaymentPresentationHandlers, 'onStartAddPayment'> & {
  view: PaymentViewModel;
};

type PaymentLaunchListProps = Pick<
  SharedPaymentPresentationHandlers,
  | 'canManageChildren'
  | 'isPersisting'
  | 'onAddLaunch'
  | 'onUpdateLaunch'
  | 'onRemoveLaunch'
  | 'onMarkLaunchPaid'
  | 'onStartReclassifyLaunch'
  | 'onDuplicateLaunch'
> & {
  view: PaymentViewModel;
};

type LaunchRowProps = Pick<
  SharedPaymentPresentationHandlers,
  'canManageChildren' | 'isPersisting' | 'onUpdateLaunch' | 'onRemoveLaunch' | 'onMarkLaunchPaid' | 'onStartReclassifyLaunch'
> & {
  itemId: ID;
  paymentId: ID;
  launch: Lancamento;
  index: number;
  isLast: boolean;
  isEditing: boolean;
  onDuplicateLaunch: (itemId: ID, paymentId: ID, launchId: ID) => void;
};

function SummaryMetricCard({
  label,
  value,
  description,
  tooltip,
  tone = 'slate',
}: {
  label: string;
  value: string;
  description: string;
  tooltip: string;
  tone?: 'emerald' | 'slate' | 'amber' | 'green' | 'blue' | 'danger';
}) {
  const toneStyles = {
    emerald: {
      surface: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-white',
      accent: 'from-emerald-500 to-teal-500',
      eyebrow: 'text-emerald-900/80',
      value: 'text-emerald-950',
      dot: 'bg-emerald-500',
      tooltipButton:
        'border-emerald-200 bg-white/80 text-emerald-700 hover:border-emerald-300 hover:text-emerald-800',
    },
    slate: {
      surface: 'border-slate-200 bg-gradient-to-br from-slate-100 via-white to-white',
      accent: 'from-slate-500 to-slate-700',
      eyebrow: 'text-slate-700',
      value: 'text-slate-950',
      dot: 'bg-slate-500',
      tooltipButton:
        'border-slate-200 bg-white/80 text-slate-600 hover:border-slate-300 hover:text-slate-800',
    },
    amber: {
      surface: 'border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-white',
      accent: 'from-amber-400 to-orange-500',
      eyebrow: 'text-amber-900/80',
      value: 'text-amber-700',
      dot: 'bg-amber-500',
      tooltipButton:
        'border-amber-200 bg-white/80 text-amber-700 hover:border-amber-300 hover:text-amber-800',
    },
    green: {
      surface: 'border-lime-200/80 bg-gradient-to-br from-lime-50 via-white to-white',
      accent: 'from-lime-500 to-emerald-500',
      eyebrow: 'text-lime-900/80',
      value: 'text-emerald-700',
      dot: 'bg-emerald-500',
      tooltipButton:
        'border-lime-200 bg-white/80 text-emerald-700 hover:border-lime-300 hover:text-emerald-800',
    },
    blue: {
      surface: 'border-blue-200/80 bg-gradient-to-br from-blue-50 via-white to-white',
      accent: 'from-blue-500 to-indigo-500',
      eyebrow: 'text-blue-900/80',
      value: 'text-blue-700',
      dot: 'bg-blue-500',
      tooltipButton:
        'border-blue-200 bg-white/80 text-blue-700 hover:border-blue-300 hover:text-blue-800',
    },
    danger: {
      surface: 'border-red-200/90 bg-gradient-to-br from-red-50 via-white to-rose-50/80',
      accent: 'from-red-500 to-rose-500',
      eyebrow: 'text-red-900/85',
      value: 'text-red-700',
      dot: 'bg-red-500',
      tooltipButton:
        'border-red-200 bg-white/85 text-red-700 hover:border-red-300 hover:text-red-800',
    },
  }[tone];

  return (
    <div className={`relative overflow-visible rounded-2xl border p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${toneStyles.surface}`}>
      <div className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${toneStyles.accent}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${toneStyles.dot}`} />
            <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${toneStyles.eyebrow}`}>
              {label}
            </p>
          </div>
          <p className={`mt-3 text-xl font-semibold tracking-tight ${toneStyles.value}`}>{value}</p>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>

        <div className="group/tooltip relative shrink-0">
          <button
            type="button"
            aria-label={`Saiba mais sobre ${label}`}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${toneStyles.tooltipButton}`}
          >
            <Info className="h-4 w-4" />
          </button>
          <div
            role="tooltip"
            className="pointer-events-none absolute right-0 top-full z-30 mt-2 w-56 max-w-[calc(100vw-3rem)] translate-y-1 rounded-xl bg-slate-900 px-3 py-2 text-xs leading-relaxed text-white opacity-0 shadow-xl transition-all duration-150 invisible group-hover/tooltip:visible group-hover/tooltip:translate-y-0 group-hover/tooltip:opacity-100 group-focus-within/tooltip:visible group-focus-within/tooltip:translate-y-0 group-focus-within/tooltip:opacity-100"
          >
            {tooltip}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompactMetricCard({
  label,
  value,
  toneClassName = 'text-slate-900',
}: {
  label: string;
  value: string;
  toneClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${toneClassName}`}>{value}</p>
    </div>
  );
}

function getPaymentRollupStatus(view: PaymentViewModel) {
  const lancamentos = view.payment.lancamentos ?? [];
  const hasPaid = lancamentos.some((lancamento) => lancamento.paymentStatus === 'PAGO');
  const hasReserved = lancamentos.some((lancamento) => lancamento.paymentStatus === 'RESERVADO');
  const hasPaymentReceived = lancamentos.some(
    (lancamento) => lancamento.paymentStatus === 'PAGAMENTO_RECEBIDO'
  );

  if (lancamentos.length === 0) {
    return {
      label: 'Sem lançamentos',
      className: 'border-slate-200 bg-slate-50 text-slate-600',
    };
  }

  if ((hasPaid && hasReserved) || (hasPaid && hasPaymentReceived) || (hasReserved && hasPaymentReceived)) {
    return {
      label: 'Misto',
      className: 'border-blue-200 bg-blue-50 text-blue-700',
    };
  }

  if (hasReserved) {
    return {
      label: 'Reservado',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    };
  }

  if (hasPaymentReceived) {
    return {
      label: 'Pagamento recebido',
      className: 'border-blue-200 bg-blue-50 text-blue-700',
    };
  }

  return {
    label: 'Pago',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  };
}

function PaymentsFinancialSummarySection({
  totalRecebido,
  totalPago,
  totalReservado,
  totalRecebimentoAguardo,
  saldoRealContrato,
  saldoProjetoContrato,
}: {
  totalRecebido: number;
  totalPago: number;
  totalReservado: number;
  totalRecebimentoAguardo: number;
  saldoRealContrato: number;
  saldoProjetoContrato: number;
}) {
  const metrics: Array<{
    label: string;
    value: string;
    description: string;
    tooltip: string;
    tone: 'emerald' | 'slate' | 'amber' | 'green' | 'blue' | 'danger';
  }> = [
    {
      label: 'Entradas',
      value: formatCurrency(totalRecebido),
      description: 'Recebido em caixa',
      tooltip: 'Soma das parcelas já recebidas, com entrada efetiva no caixa.',
      tone: 'emerald' as const,
    },
    {
      label: 'Em aguardo',
      value: formatCurrency(totalRecebimentoAguardo),
      description: 'Faturado e ainda não recebido',
      tooltip: 'Soma das parcelas faturadas (NF emitida) que ainda não entraram no caixa.',
      tone: 'blue' as const,
    },
    {
      label: 'Pagamentos',
      value: formatCurrency(totalPago),
      description: 'Pagamentos já realizados',
      tooltip: 'Soma de todos os pagamentos já realizados.',
      tone: 'slate' as const,
    },
    {
      label: 'Reservas',
      value: formatCurrency(totalReservado),
      description: 'Valores reservados para pagar',
      tooltip: 'Soma de valores reservados para pagamentos futuros que ainda não foram realizados.',
      tone: 'amber' as const,
    },
    {
      label: 'Caixa',
      value: formatSignedCurrency(saldoRealContrato),
      description: saldoRealContrato < 0 ? 'Déficit antes das reservas' : 'Disponível antes das reservas',
      tooltip: 'Valor em caixa considerando o que já entrou menos o que já foi pago.',
      tone: saldoRealContrato < 0 ? 'danger' : 'green',
    },
    {
      label: 'Livre após reservas',
      value: formatSignedCurrency(saldoProjetoContrato),
      description: saldoProjetoContrato < 0 ? 'Déficit após reservas' : 'Saldo realmente livre do projeto',
      tooltip: 'Saldo livre após descontar do caixa os valores já reservados para pagamentos futuros.',
      tone: saldoProjetoContrato < 0 ? 'danger' : 'blue',
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-1.5">
        <h4 className="text-lg font-semibold text-slate-900">Posição financeira do projeto</h4>
        <p className="text-sm text-slate-500">
          Acompanhe o que já entrou, o que já saiu, o que está reservado e o saldo realmente disponível.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <SummaryMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            description={metric.description}
            tooltip={metric.tooltip}
            tone={metric.tone}
          />
        ))}
      </div>
    </section>
  );
}

function RubricasHierarchySection({
  rubricaViews,
  isLoading,
  loadError,
  onToggleRubrica,
  ...handlers
}: RubricasHierarchySectionProps) {
  if (rubricaViews.length === 0 && !isLoading && !loadError) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm">
        Nenhuma rubrica encontrada para montar a tela de pagamentos.
      </div>
    );
  }

  return (
    <section className="space-y-5">
      {rubricaViews.map((view) => (
        <RubricaCard key={view.rubrica.id} view={view} onToggleRubrica={onToggleRubrica} {...handlers} />
      ))}
    </section>
  );
}

function RubricaCard({
  view,
  canManageChildren,
  loadingAccess,
  onToggleRubrica,
  onStartAddPaymentFromRubrica,
  ...handlers
}: RubricaCardProps) {
  const canShowManageActions = canManageChildren && !loadingAccess;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-white p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <button
            type="button"
            onClick={() => onToggleRubrica(view.rubrica.id)}
            className="flex flex-1 items-start gap-3 text-left"
          >
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500">
              {view.rubrica.expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-900">{view.rubrica.nome}</h3>
                {view.rubrica.codigo ? (
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {view.rubrica.codigo}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                <span>{view.totalPagamentosRubrica} pagamentos</span>
                <MetaBullet />
                <span>{view.totalLancamentosRubrica} lançamentos</span>
                <MetaBullet />
                <span>{view.itemViews.length} itens de apoio</span>
              </div>
            </div>
          </button>

          {canShowManageActions ? (
            <button
              type="button"
              onClick={() => onStartAddPaymentFromRubrica(view.rubrica.id)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#004225] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#003319]"
            >
              <Plus className="h-4 w-4" />
              Adicionar pagamento
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <CompactMetricCard label="Orçado" value={formatCurrency(view.orcadoRubrica)} />
          <CompactMetricCard label="Comprometido" value={formatCurrency(view.comprometidoRubrica)} />
          <CompactMetricCard label="Pago" value={formatCurrency(view.pagoRubrica)} />
          <CompactMetricCard
            label="Reservado"
            value={formatCurrency(view.reservadoRubrica)}
            toneClassName="text-amber-600"
          />
          <CompactMetricCard
            label="Saldo"
            value={formatCurrency(view.saldoRubrica)}
            toneClassName={view.saldoRubrica < 0 ? 'text-red-600' : 'text-blue-600'}
          />
        </div>
      </div>

      {view.rubrica.expanded ? (
        <div className="space-y-4 p-4">
          {view.itemViews.length === 0 ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
              <AlertCircle className="h-5 w-5" />
              <span>Nenhum item cadastrado nesta rubrica.</span>
            </div>
          ) : (
            view.itemViews.map((itemView) => (
              <BudgetItemSection
                key={itemView.item.id}
                view={itemView}
                canManageChildren={canManageChildren}
                loadingAccess={loadingAccess}
                {...handlers}
              />
            ))
          )}
        </div>
      ) : null}
    </section>
  );
}

function BudgetItemSection({
  view,
  canManageChildren,
  loadingAccess,
  onStartAddPayment,
  ...handlers
}: BudgetItemSectionProps) {
  const canShowManageActions = canManageChildren && !loadingAccess;

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-100/80 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Item de apoio da rubrica</div>
          <h4 className="text-base font-semibold text-slate-900">{view.item.descricao}</h4>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
            <span>Valor {formatCurrency(view.totalItem)}</span>
            <MetaBullet />
            <span>{view.totalPagamentosItem} pagamentos</span>
            <MetaBullet />
            <span>{view.totalLancamentosItem} lançamentos</span>
          </div>
        </div>

        {canShowManageActions ? (
          <button
            type="button"
            onClick={() => onStartAddPayment(view.item.id)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-medium text-[#004225] transition-colors hover:bg-emerald-50"
          >
            <Plus className="h-4 w-4" />
            Adicionar pagamento neste item
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CompactMetricCard label="Pago" value={formatCurrency(view.pagoItem)} />
        <CompactMetricCard label="Comprometido" value={formatCurrency(view.comprometidoItem)} />
        <CompactMetricCard
          label="Reservado"
          value={formatCurrency(view.reservadoItem)}
          toneClassName="text-amber-600"
        />
        <CompactMetricCard
          label="Saldo"
          value={formatCurrency(view.saldoItem)}
          toneClassName={view.saldoItem < 0 ? 'text-red-600' : 'text-blue-600'}
        />
      </div>

      <div className="mt-4 space-y-3">
        {view.paymentViews.length === 0 ? (
          <EmptyPaymentsState canShowManageActions={canShowManageActions} onAddPayment={() => onStartAddPayment(view.item.id)} />
        ) : (
          view.paymentViews.map((paymentView) => (
            <PaymentCard
              key={paymentView.key}
              view={paymentView}
              canManageChildren={canManageChildren}
              loadingAccess={loadingAccess}
              {...handlers}
            />
          ))
        )}
      </div>
    </section>
  );
}

function PaymentCard({
  view,
  canManageChildren,
  loadingAccess,
  isPersisting,
  onStartEditPayment,
  onRemovePayment,
  onTogglePaymentLaunches,
  onEditLaunches,
  onSaveLaunches,
  onCancelLaunchEditing,
  ...handlers
}: PaymentCardProps) {
  const canShowManageActions = canManageChildren && !loadingAccess;
  const status = getPaymentRollupStatus(view);
  const PrimaryActionIcon = view.isEditingLancamentos ? Save : view.hasLancamentos ? Pencil : Plus;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pagamento</span>
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${status.className}`}>
                {status.label}
              </span>
            </div>
            <h5 className="text-base font-semibold text-slate-900">{view.payment.empresaRh || view.itemDescricao}</h5>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
              <span>Item base: {view.itemDescricao}</span>
              <MetaBullet />
              <span>{view.vinculoLabel}</span>
              <MetaBullet />
              <span>{view.quantidade} {view.quantidade === 1 ? 'lançamento' : 'lançamentos'}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onTogglePaymentLaunches(view.key)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              {view.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              {view.isExpanded ? 'Ocultar lançamentos' : 'Ver lançamentos'}
            </button>

            {canShowManageActions ? (
              <>
                <button
                  type="button"
                  onClick={() => onStartEditPayment(view.itemId, view.payment.id)}
                  disabled={isPersisting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Pencil className="h-4 w-4" />
                  Editar pagamento
                </button>
                <button
                  type="button"
                  onClick={() => onRemovePayment(view.itemId, view.payment.id)}
                  disabled={isPersisting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <CompactMetricCard label="Lançamentos" value={String(view.quantidade)} />
          <CompactMetricCard label="Total comprometido" value={formatCurrency(view.totalComprometido)} />
          <CompactMetricCard label="Pago" value={formatCurrency(view.totalPago)} />
          <CompactMetricCard
            label="Reservado"
            value={formatCurrency(view.totalReservado)}
            toneClassName="text-amber-600"
          />
          <CompactMetricCard
            label="Último pagamento"
            value={view.ultimaDataPagamentoPago ? formatDate(view.ultimaDataPagamentoPago) : '-'}
          />
        </div>

        {canShowManageActions ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {view.isEditingLancamentos ? (
              <button
                type="button"
                onClick={onCancelLaunchEditing}
                disabled={isPersisting}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Cancelar edição
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => {
                if (view.isEditingLancamentos) {
                  onSaveLaunches();
                  return;
                }

                if (view.hasLancamentos) {
                  onEditLaunches(view.itemId, view.payment.id);
                  return;
                }

                handlers.onAddLaunch(view.itemId, view.payment.id);
              }}
              disabled={isPersisting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#004225] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#003319] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PrimaryActionIcon className="h-4 w-4" />
              {view.isEditingLancamentos
                ? 'Salvar lançamentos'
                : view.hasLancamentos
                  ? 'Editar lançamentos'
                  : 'Adicionar lançamento'}
            </button>
          </div>
        ) : null}

        {view.isExpanded ? (
          <PaymentLaunchList
            view={view}
            canManageChildren={canManageChildren}
            isPersisting={isPersisting}
            onAddLaunch={handlers.onAddLaunch}
            onUpdateLaunch={handlers.onUpdateLaunch}
            onRemoveLaunch={handlers.onRemoveLaunch}
            onMarkLaunchPaid={handlers.onMarkLaunchPaid}
            onStartReclassifyLaunch={handlers.onStartReclassifyLaunch}
            onDuplicateLaunch={handlers.onDuplicateLaunch}
          />
        ) : null}
      </div>
    </article>
  );
}

function PaymentLaunchList({
  view,
  canManageChildren,
  isPersisting,
  onAddLaunch,
  onUpdateLaunch,
  onRemoveLaunch,
  onMarkLaunchPaid,
  onStartReclassifyLaunch,
  onDuplicateLaunch,
}: PaymentLaunchListProps) {
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-slate-900">Lançamentos do pagamento</div>
          <div className="text-sm text-slate-700">{view.payment.empresaRh || view.itemDescricao}</div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <span>{view.quantidade} {view.quantidade === 1 ? 'lançamento' : 'lançamentos'}</span>
            <MetaBullet />
            <span>{view.vinculoLabel}</span>
            <MetaBullet />
            <span>Pago: {formatCurrency(view.totalPago)}</span>
            <MetaBullet />
            <span>Reservado: {formatCurrency(view.totalReservado)}</span>
          </div>
        </div>

        {canManageChildren && view.isEditingLancamentos ? (
          <button
            type="button"
            onClick={() => onAddLaunch(view.itemId, view.payment.id)}
            disabled={isPersisting}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#004225] bg-white px-4 py-2 text-sm font-medium text-[#004225] transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Novo lançamento
          </button>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        {view.lancamentosParaExibir.length === 0 ? (
          <EmptyLaunchesState />
        ) : (
          view.lancamentosParaExibir.map((launch, index) => (
            <LaunchRow
              key={launch.id}
              itemId={view.itemId}
              paymentId={view.payment.id}
              launch={launch}
              index={index}
              isLast={index === view.lancamentosParaExibir.length - 1}
              isEditing={view.isEditingLancamentos}
              canManageChildren={canManageChildren}
              isPersisting={isPersisting}
              onUpdateLaunch={onUpdateLaunch}
              onRemoveLaunch={onRemoveLaunch}
              onMarkLaunchPaid={onMarkLaunchPaid}
              onStartReclassifyLaunch={onStartReclassifyLaunch}
              onDuplicateLaunch={onDuplicateLaunch}
            />
          ))
        )}
      </div>
    </div>
  );
}

function LaunchRow({
  itemId,
  paymentId,
  launch,
  index,
  isLast,
  isEditing,
  canManageChildren,
  isPersisting,
  onUpdateLaunch,
  onRemoveLaunch,
  onMarkLaunchPaid,
  onStartReclassifyLaunch,
  onDuplicateLaunch,
}: LaunchRowProps) {
  if (canManageChildren && isEditing) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Lançamento {index + 1}</div>
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-[minmax(0,1fr)_180px_180px_220px_auto]">
          <MoneyInput
            valueCents={Math.round(launch.valor * 100)}
            onValueChange={(cents) =>
              onUpdateLaunch(itemId, paymentId, launch.id, {
                valor: cents / 100,
              })
            }
            disabled={isPersisting}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-sm"
          />          <Dropdown
            value={launch.paymentStatus}
            onChange={(value) =>
              onUpdateLaunch(itemId, paymentId, launch.id, {
                paymentStatus: (value as ExpensePaymentStatusEnum | undefined) ?? 'PAGO',
              })
            }
            disabled={isPersisting}
            options={[
              { value: 'PAGO', label: 'Pago' },
              { value: 'RESERVADO', label: 'Reservado' },
            ]}
            className="h-10 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
          />          <Dropdown
            value={launch.paidBy}
            onChange={(value) =>
              onUpdateLaunch(itemId, paymentId, launch.id, {
                paidBy: (value as ExpensePaidByEnum | undefined) ?? 'INNOVATIS',
              })
            }
            disabled={isPersisting}
            options={[
              { value: 'INNOVATIS', label: 'Innovatis' },
              { value: 'EXECUCAO', label: 'Execução' },
            ]}
            className="h-10 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
          />
          <DatePicker
            value={launch.dataPag || ''}
            onChange={(value) =>
              onUpdateLaunch(itemId, paymentId, launch.id, {
                dataPag: value,
              })
            }
            placeholder="Selecionar data"
            disabled={isPersisting}
            className="h-10 min-w-[220px] rounded-xl border-slate-300 bg-white px-1 py-1 text-sm [&_input]:text-center [&_input]:font-medium [&_input]:tabular-nums"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onRemoveLaunch(itemId, paymentId, launch.id)}
              disabled={isPersisting}
              className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Excluir lançamento"
              title="Excluir lançamento"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        {isLast && isEditing ? (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={() => onDuplicateLaunch(itemId, paymentId, launch.id)}
              disabled={isPersisting}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Duplicar último lançamento"
              title="Duplicar último lançamento"
            >
              <CopyPlus className="h-5 w-5" />
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Lançamento {index + 1}</div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-semibold text-slate-900">{formatCurrency(launch.valor)}</span>
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getPaymentStatusBadgeClassName(launch.paymentStatus)}`}>
            {getPaymentStatusLabel(launch.paymentStatus)}
          </span>
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getPaidByBadgeClassName(launch.paidBy)}`}>
            {getPaidByLabel(launch.paidBy)}
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            {formatDate(launch.dataPag)}
          </span>
        </div>
        {isLast && isEditing ? (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={() => onDuplicateLaunch(itemId, paymentId, launch.id)}
              disabled={isPersisting}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Duplicar último lançamento"
              title="Duplicar último lançamento"
            >
              <CopyPlus className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {canManageChildren ? (
          <div className="flex items-center gap-2 self-end lg:self-auto">
            {launch.paymentStatus === 'RESERVADO' ? (
              <button
                type="button"
                onClick={() => {
                  void onMarkLaunchPaid(itemId, paymentId, launch.id);
                }}
                disabled={isPersisting}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Tornar pago
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onStartReclassifyLaunch(itemId, launch)}
              disabled={isPersisting || !launch.expenseId}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Pencil className="h-4 w-4" />
              Reclassificar
            </button>
            <button
              type="button"
              onClick={() => onRemoveLaunch(itemId, paymentId, launch.id)}
              disabled={isPersisting}
              className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Excluir lançamento"
              title="Excluir lançamento"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EmptyPaymentsState({
  canShowManageActions,
  onAddPayment,
}: {
  canShowManageActions: boolean;
  onAddPayment: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
      <div className="flex flex-col items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <p className="font-medium text-slate-700">Nenhum pagamento cadastrado neste item.</p>
          <p>Crie o primeiro pagamento para depois registrar os lançamentos.</p>
        </div>
        {canShowManageActions ? (
          <button
            type="button"
            onClick={onAddPayment}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-[#004225] transition-colors hover:bg-emerald-50"
          >
            <Plus className="h-4 w-4" />
            Adicionar pagamento
          </button>
        ) : null}
      </div>
    </div>
  );
}

function EmptyLaunchesState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
      Nenhum lançamento cadastrado para este pagamento.
    </div>
  );
}

function BudgetItemPickerModal({
  isOpen,
  rubricaView,
  isPersisting,
  onClose,
  onSelectItem,
}: {
  isOpen: boolean;
  rubricaView: RubricaViewModel | null;
  isPersisting: boolean;
  onClose: () => void;
  onSelectItem: (itemId: ID) => void;
}) {
  if (!isOpen || !rubricaView) {
    return null;
  }

  return (
    <AppModalShell
      isOpen={isOpen}
      title="Escolher item para o novo pagamento"
      description={`A rubrica ${rubricaView.rubrica.nome} possui mais de um item de apoio. Escolha em qual item o pagamento deve ser criado.`}
      icon={<Plus className="h-5 w-5" />}
      tone="brand"
      onClose={onClose}
      maxWidthClassName="max-w-2xl"
      closeDisabled={isPersisting}
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isPersisting}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      }
    >
      <div className="space-y-3 p-6">
        {rubricaView.itemViews.map((itemView) => (
          <button
            key={itemView.item.id}
            type="button"
            onClick={() => onSelectItem(itemView.item.id)}
            disabled={isPersisting}
            className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-emerald-200 hover:bg-emerald-50/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-900">{itemView.item.descricao}</p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                  <span>Valor {formatCurrency(itemView.totalItem)}</span>
                  <MetaBullet />
                  <span>{itemView.totalPagamentosItem} pagamentos</span>
                  <MetaBullet />
                  <span>Saldo {formatCurrency(itemView.saldoItem)}</span>
                </div>
              </div>
              <ChevronRight className="mt-0.5 h-4 w-4 text-slate-400" />
            </div>
          </button>
        ))}
      </div>
    </AppModalShell>
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
  fieldErrors,
  linksError,
  isLoadingLinks,
  projectPeople,
  projectCompanies,
  projectPartners,
  lockBeneficiary,
  isPersisting,
  onChange,
  onClose,
  onOpenCreatePerson,
  onOpenCreateCompany,
  onOpenCreatePartner,
  onOpenLinkExistingPerson,
  onOpenLinkExistingCompany,
  onOpenLinkExistingPartner,
  onSubmit,
}: {
  isOpen: boolean;
  title: string;
  subtitle: string;
  submitLabel: string;
  form: NewSubitemFormState;
  error: string | null;
  fieldErrors: PaymentFieldErrors;
  linksError: string | null;
  isLoadingLinks: boolean;
  projectPeople: ProjectLinkedPerson[];
  projectCompanies: ProjectLinkedCompany[];
  projectPartners: ProjectLinkedPartner[];
  lockBeneficiary: boolean;
  isPersisting: boolean;
  onChange: (patch: Partial<NewSubitemFormState>) => void;
  onClose: () => void;
  onOpenCreatePerson: () => void;
  onOpenCreateCompany: () => void;
  onOpenCreatePartner: () => void;
  onOpenLinkExistingPerson: () => void;
  onOpenLinkExistingCompany: () => void;
  onOpenLinkExistingPartner: () => void;
  onSubmit: () => void;
}) {
  const personFieldRef = useRef<HTMLDivElement | null>(null);
  const companyFieldRef = useRef<HTMLDivElement | null>(null);
  const budgetFieldRef = useRef<HTMLDivElement | null>(null);
  const categoryFieldRef = useRef<HTMLDivElement | null>(null);
  const hasFilledData =
    form.nome.trim().length > 0 ||
    form.vinculoTipo !== 'none' ||
    form.personId.length > 0 ||
    form.organizationId.length > 0 ||
    form.partnerId.length > 0;
  const { requestClose, discardConfirmProps } = useModalCloseGuard({
    isOpen,
    shouldConfirm: hasFilledData,
    closeDisabled: isPersisting,
    onClose,
  });

  const showPersonSelector = form.vinculoTipo === 'person';
  const showCompanySelector = form.vinculoTipo === 'company';
  const showPartnerSelector = form.vinculoTipo === 'partner';
  const showLinksError =
    Boolean(linksError) &&
    (lockBeneficiary || showPersonSelector || showCompanySelector || showPartnerSelector);

  useEffect(() => {
    if (!isOpen) return;
    if (fieldErrors.projectCompanyId && showCompanySelector) {
      companyFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (fieldErrors.personId && showPersonSelector) {
      personFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (fieldErrors.budgetItemId) {
      budgetFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (fieldErrors.categoryId) {
      categoryFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [
    fieldErrors.budgetItemId,
    fieldErrors.categoryId,
    fieldErrors.personId,
    fieldErrors.projectCompanyId,
    isOpen,
    showCompanySelector,
    showPersonSelector,
  ]);

  if (!isOpen) return null;
  return (
    <>
      <ModalShell
        title={title}
        subtitle={subtitle}
        onClose={requestClose}
        maxWidthClassName="max-w-2xl"
      >
        <div className="space-y-5 p-6">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Nome do pagamento <span className="text-red-500">*</span>
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

        <Field label="Vínculo do pagamento">
          {lockBeneficiary ? (
            <p className="mb-2 text-xs text-amber-700">
              Vínculo bloqueado: altere o beneficiário apenas na aba de rubricas.
            </p>
          ) : null}
          <Dropdown
            options={[
              {
                value: 'none',
                label: 'Sem vínculo',
              },
              {
                value: 'person',
                label: 'Pessoa vinculada ao projeto',
              },
              {
                value: 'company',
                label: 'Empresa vinculada ao projeto',
              },
              {
                value: 'partner',
                label: 'IF / Fundação (parceiro)',
              },
            ]}
            value={form.vinculoTipo}
            onChange={(value) => {
              if (lockBeneficiary) return;
              const nextType = (value || 'none') as SubitemLinkType;

              onChange({
                vinculoTipo: nextType,
                personId: nextType === 'person' ? form.personId : '',
                organizationId: nextType === 'company' ? form.organizationId : '',
                partnerId: nextType === 'partner' ? form.partnerId : '',
              });
            }}
            placeholder="Selecione..."
            disabled={isPersisting || lockBeneficiary}
            className="w-full"
          />
        </Field>

        {(fieldErrors.budgetItemId || fieldErrors.categoryId) ? (
          <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {fieldErrors.budgetItemId ? (
              <p ref={budgetFieldRef}>{fieldErrors.budgetItemId}</p>
            ) : null}
            {fieldErrors.categoryId ? (
              <p ref={categoryFieldRef}>{fieldErrors.categoryId}</p>
            ) : null}
          </div>
        ) : null}

        {showLinksError ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {linksError}
          </div>
        ) : null}

        {showPersonSelector ? (
          <div
            ref={personFieldRef}
            className={`space-y-3 rounded-lg border bg-gray-50 p-4 ${
              fieldErrors.personId ? 'border-red-300' : 'border-gray-200'
            }`}
          >
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
                  disabled={isPersisting || lockBeneficiary}
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <Check className="h-4 w-4" />
                  Vincular existente
                </button>
                <button
                  type="button"
                  onClick={onOpenCreatePerson}
                  disabled={isPersisting || lockBeneficiary}
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
            <Dropdown
              options={projectPeople.map((person) => ({
                value: person.personId,
                label: person.label,
              }))}
              value={form.personId}
              onChange={(value) => {
                if (lockBeneficiary) return;
                const nextPersonId = value || '';

                const selectedPerson = projectPeople.find(
                  (person) => person.personId === nextPersonId
                );

                onChange({
                  personId: nextPersonId,
                  organizationId: '',
                  nome: form.nome.trim()
                    ? form.nome
                    : selectedPerson?.fullName ?? form.nome,
                });
              }}
              placeholder="Selecione uma pessoa"
              disabled={isPersisting || lockBeneficiary}
              className="w-full"
            />
            )}
            {fieldErrors.personId ? (
              <p className="text-sm text-red-700">{fieldErrors.personId}</p>
            ) : null}
          </div>
        ) : null}

        {showCompanySelector ? (
          <div
            ref={companyFieldRef}
            className={`space-y-3 rounded-lg border bg-gray-50 p-4 ${
              fieldErrors.projectCompanyId ? 'border-red-300' : 'border-gray-200'
            }`}
          >
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
                  disabled={isPersisting || lockBeneficiary}
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <Check className="h-4 w-4" />
                  Vincular existente
                </button>
                <button
                  type="button"
                  onClick={onOpenCreateCompany}
                  disabled={isPersisting || lockBeneficiary}
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
                  if (lockBeneficiary) return;
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
                disabled={isPersisting || lockBeneficiary}
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
            {fieldErrors.projectCompanyId ? (
              <p className="text-sm text-red-700">{fieldErrors.projectCompanyId}</p>
            ) : null}
          </div>
        ) : null}

        {showPartnerSelector ? (
          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">IF / Fundação vinculada</h3>
                <p className="text-xs text-gray-500">
                  Selecione um parceiro já vinculado ao projeto ou cadastre um novo.
                </p>
              </div>
              <div className="flex flex-nowrap items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={onOpenLinkExistingPartner}
                  disabled={isPersisting || lockBeneficiary}
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <Check className="h-4 w-4" />
                  Vincular existente
                </button>
                <button
                  type="button"
                  onClick={onOpenCreatePartner}
                  disabled={isPersisting || lockBeneficiary}
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-[#004225] hover:bg-emerald-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <Plus className="h-4 w-4" />
                  Novo parceiro
                </button>
              </div>
            </div>
            {isLoadingLinks ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-white px-3 py-4 text-sm text-gray-500">
                Carregando parceiros vinculados...
              </div>
            ) : projectPartners.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-white px-3 py-4 text-sm text-gray-500">
                Nenhum parceiro vinculado ao projeto.
              </div>
            ) : (
              <Dropdown
                options={projectPartners.map((partner) => ({
                  value: partner.projectLinkId,
                  label: partner.label,
                }))}
                value={form.partnerId}
                onChange={(value) => {
                  const nextPartnerId = value || '';
                  const selectedPartner = projectPartners.find(
                    (partner) => partner.projectLinkId === nextPartnerId
                  );

                  onChange({
                    partnerId: nextPartnerId,
                    personId: '',
                    organizationId: '',
                    nome: form.nome.trim() ? form.nome : selectedPartner?.name ?? form.nome,
                  });
                }}
                placeholder="Selecione um parceiro"
                disabled={isPersisting || lockBeneficiary}
                className="w-full"
              />
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
            onClick={requestClose}
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
      <ConfirmDiscardModal {...discardConfirmProps} isLoading={isPersisting} />
    </>
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
      subtitle="Escolha uma pessoa já cadastrada na base para vinculá-la ao projeto."
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
            Todas as pessoas cadastradas já estão vinculadas a este projeto.
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
      subtitle="Escolha uma empresa já cadastrada na base para vinculá-la ao projeto."
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
            Todas as empresas cadastradas já estão vinculadas a este projeto.
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

function LinkExistingPartnerModal({
  isOpen,
  partners,
  isLoading,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  partners: PartnerResponseDTO[];
  isLoading: boolean;
  onClose: () => void;
  onSave: (partnerId: number) => Promise<void>;
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
      setError('Selecione um parceiro cadastrado para vincular.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(Number(selectedId));
    } catch (saveError) {
      setError(toErrorMessage(saveError, 'Não foi possível vincular o parceiro existente.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalShell
      title="Vincular parceiro existente"
      subtitle="Escolha um IF ou Fundação já cadastrado na base para vinculá-lo ao projeto."
      onClose={onClose}
      maxWidthClassName="max-w-xl"
      zIndexClassName="z-[60]"
    >
      <div className="space-y-4 p-6">
        {isLoading ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-500">
            Carregando parceiros cadastrados...
          </div>
        ) : partners.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-500">
            Todos os parceiros cadastrados já estão vinculados a este projeto.
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Parceiro cadastrado <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              disabled={isSaving}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]"
            >
              <option value="">Selecione um parceiro</option>
              {partners.map((partner) => {
                const displayName = partner.tradeName?.trim() || partner.name;
                const typeLabel = partner.partnersType === 'IF' ? 'IF' : 'Fundação';
                return (
                  <option key={partner.id} value={String(partner.id)}>
                    {displayName} • {typeLabel}
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
            disabled={isSaving || isLoading || partners.length === 0}
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

function CreateLinkedPartnerModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: PartnerRequestDTO) => Promise<void>;
}) {
  const [form, setForm] = useState<CreatePartnerFormState>(DEFAULT_CREATE_PARTNER_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(DEFAULT_CREATE_PARTNER_FORM);
    setError(null);
    setIsSaving(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const name = form.name.trim();
    if (!name) {
      setError('Informe o nome do parceiro.');
      return;
    }
    if (!form.partnersType) {
      setError('Selecione o tipo de parceiro (IF ou Fundação).');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        name,
        tradeName: form.tradeName.trim() || undefined,
        partnersType: form.partnersType,
        cnpj: onlyDigits(form.cnpj) || undefined,
      });
    } catch (saveError) {
      setError(toErrorMessage(saveError, 'Não foi possível cadastrar o parceiro.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalShell
      title="Novo parceiro"
      subtitle="Cadastre o parceiro e vincule-o automaticamente a este projeto."
      onClose={onClose}
      maxWidthClassName="max-w-xl"
      zIndexClassName="z-[60]"
    >
      <div className="space-y-4 p-6">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Nome <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            disabled={isSaving}
            autoFocus
            placeholder="Ex: Universidade Federal de Minas Gerais"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Nome fantasia / Sigla
          </label>
          <input
            type="text"
            value={form.tradeName}
            onChange={(event) => setForm((current) => ({ ...current, tradeName: event.target.value }))}
            disabled={isSaving}
            placeholder="Ex: UFMG"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Tipo <span className="text-red-500">*</span>
          </label>
          <select
            value={form.partnersType}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                partnersType: event.target.value as PartnersTypeEnum | '',
              }))
            }
            disabled={isSaving}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]"
          >
            <option value="">Selecione o tipo</option>
            <option value="IF">IF (Instituto Federal)</option>
            <option value="FUNDACAO">Fundação</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">CNPJ</label>
          <input
            type="text"
            value={form.cnpj}
            onChange={(event) => setForm((current) => ({ ...current, cnpj: event.target.value }))}
            disabled={isSaving}
            placeholder="00.000.000/0000-00"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]"
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
            {isSaving ? 'Cadastrando...' : 'Cadastrar e vincular'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className || ""}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      {children}
    </div>
  );
}

