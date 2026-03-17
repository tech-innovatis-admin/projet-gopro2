'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
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
import { ResizableTable } from '@/components/ui/resizable-table';
import {
  createExpense,
  createIncome,
  deleteExpense,
  deleteIncome,
  listBudgetCategories,
  listBudgetItems,
  listBudgetTransfers,
  listExpenses,
  listGoals,
  listIncomes,
  updateExpense,
  updateIncome,
} from '@/src/lib/api/endpoints';
import {
  canManageContractChildren,
  fetchCurrentUser,
} from '@/src/lib/auth/session';
import type {
  BudgetCategoryResponseDTO,
  BudgetItemResponseDTO,
  BudgetTransferResponseDTO,
  ExpenseRequestDTO,
  ExpenseResponseDTO,
  ExpenseUpdateDTO,
  GoalResponseDTO,
  IncomeResponseDTO,
  PageResponseDTO,
} from '@/src/lib/api/types';
import { HttpError } from '@/src/lib/api/types';

type ID = string;
const PAGE_SIZE = 20;
const MAX_PAGE_REQUESTS = 1000;

type Lancamento = {
  valor: number;
  dataPag: string;
  expenseId?: ID;
};

type Subitem = {
  id: ID;
  empresaRh: string;
  lancamentos: Record<ID, Lancamento | undefined>;
};

type ItemRubrica = {
  id: ID; // budget item id
  categoryId: number;
  codigo?: string;
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
  id: ID; // category id
  codigo: string;
  nome: string;
  expanded: boolean;
  itens: ItemRubrica[];
};

type Parcela = {
  id: ID; // income id
  numero: number;
  valorRecebido: number;
  dataRecebimento: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString + 'T00:00:00');
    if (isNaN(date.getTime())) return dateString;
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

function ordinal(n: number) {
  return `${n}º`;
}

const STICKY_ITEM_HEADER_CLASS =
  '!sticky left-0 z-30 bg-white shadow-[6px_0_10px_-8px_rgba(15,23,42,0.25)]';
const STICKY_ITEM_PARENT_CELL_CLASS =
  'sticky left-0 z-20 bg-gray-50 shadow-[6px_0_10px_-8px_rgba(15,23,42,0.18)]';
const STICKY_ITEM_SUBITEM_CELL_CLASS =
  'sticky left-0 z-10 bg-white shadow-[6px_0_10px_-8px_rgba(15,23,42,0.12)] group-hover:bg-gray-50';

function safeNumber(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
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
  if (error instanceof HttpError) return error.message;
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
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

function getLancamento(sub: Subitem, parcelaId: ID): Lancamento {
  return sub.lancamentos[parcelaId] ?? { valor: 0, dataPag: '', expenseId: undefined };
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

  // UI: adicionar/editar parcela
  const [isAddingParcela, setIsAddingParcela] = useState(false);
  const [newParcela, setNewParcela] = useState<{ valorRecebido: number; dataRecebimento: string }>({
    valorRecebido: 0,
    dataRecebimento: '',
  });

  const [editingParcelaId, setEditingParcelaId] = useState<ID | null>(null);
  const [editParcelaForm, setEditParcelaForm] = useState<Parcela | null>(null);

  // UI: adicionar subitem por item
  const [addingToItemId, setAddingToItemId] = useState<ID | null>(null);
  const [newSubitemEmpresa, setNewSubitemEmpresa] = useState('');

  // UI: modo de edição global dos subitens
  const [isEditingSubitens, setIsEditingSubitens] = useState(false);

  const showSavedMessage = (message: string) => {
    setSavedMessage(message);
    setTimeout(() => setSavedMessage(null), 2500);
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

    setActionError('Seu perfil pode apenas visualizar esta area do contrato.');
    return false;
  };

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
        fetchAllPages<BudgetCategoryResponseDTO>((query) =>
          listBudgetCategories({ ...query, projectId })
        ),
        fetchAllPages<BudgetItemResponseDTO>((query) =>
          listBudgetItems({ ...query, projectId })
        ),
        fetchAllPages<GoalResponseDTO>((query) => listGoals({ ...query, projectId })).catch(
          () => [] as GoalResponseDTO[]
        ),
        fetchAllPages<IncomeResponseDTO>((query) => listIncomes({ ...query, projectId })),
        fetchAllPages<ExpenseResponseDTO>((query) => listExpenses({ ...query, projectId })),
        fetchAllPages<BudgetTransferResponseDTO>((query) =>
          listBudgetTransfers({ ...query, projectId })
        ),
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
      const parcelasSet = new Set(parcelasMapped.map((parcela) => parcela.id));

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
        const valorBaseOrcado = toMoneyValue(
          item.plannedAmount ?? quantidade * meses * valorUnitario
        );
        const transferBalance = transferBalanceByItem.get(item.id) ?? { debito: 0, credito: 0 };

        const mappedItem: ItemRubrica = {
          id: String(item.id),
          categoryId: item.categoryId,
          codigo: undefined,
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
      for (const expense of expenses
        .slice()
        .sort((a, b) => {
          const aDate = a.createdAt ?? '';
          const bDate = b.createdAt ?? '';
          return aDate.localeCompare(bDate) || a.id - b.id;
        })) {
        const item = itemById.get(expense.budgetItemId);
        if (!item) continue;

        const parcelaId = String(expense.incomeId);
        if (!parcelasSet.has(parcelaId)) continue;

        const description = expense.description?.trim() || `Lançamento ${expense.id}`;
        const baseKey = `${expense.personId ?? '0'}|${expense.organizationId ?? '0'}|${description.toLowerCase()}`;

        if (!subitemsByItem.has(expense.budgetItemId)) {
          subitemsByItem.set(expense.budgetItemId, new Map());
        }
        const subitemMap = subitemsByItem.get(expense.budgetItemId)!;

        let key = baseKey;
        if (subitemMap.has(key) && subitemMap.get(key)!.lancamentos[parcelaId]) {
          key = `${baseKey}|${expense.id}`;
        }

        let subitem = subitemMap.get(key);
        if (!subitem) {
          subitem = {
            id: `sub-${expense.budgetItemId}-${subitemMap.size + 1}`,
            empresaRh: description,
            lancamentos: {},
          };
          subitemMap.set(key, subitem);
          item.subitens = [...(item.subitens ?? []), subitem];
        }

        subitem.lancamentos[parcelaId] = {
          valor: toMoneyValue(expense.amount),
          dataPag: expense.expenseDate || '',
          expenseId: String(expense.id),
        };
      }

      for (const item of itemById.values()) {
        item.subitens = (item.subitens ?? []).sort((a, b) =>
          a.empresaRh.localeCompare(b.empresaRh, 'pt-BR')
        );
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

  // Helpers de cálculo
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

  const calcularTotalPagoSubitem = (sub: Subitem) =>
    parcelas.reduce((acc, p) => acc + safeNumber(getLancamento(sub, p.id).valor), 0);

  const calcularTotalPagoItem = (item: ItemRubrica) =>
    (item.subitens || []).reduce((acc, s) => acc + calcularTotalPagoSubitem(s), 0);

  const calcularPagoItemPorParcela = (item: ItemRubrica, parcelaId: ID) =>
    (item.subitens || []).reduce((acc, s) => acc + safeNumber(getLancamento(s, parcelaId).valor), 0);

  const calcularTotalOrcadoRubrica = (rub: Rubrica) =>
    rub.itens.reduce((acc, it) => acc + calcularTotalOrcadoItem(it), 0);

  const calcularTotalPagoRubrica = (rub: Rubrica) =>
    rub.itens.reduce((acc, it) => acc + calcularTotalPagoItem(it), 0);

  const totalRecebido = useMemo(
    () => parcelas.reduce((acc, p) => acc + safeNumber(p.valorRecebido), 0),
    [parcelas]
  );

  const totalPago = useMemo(() => {
    let sum = 0;
    for (const r of rubricas) {
      for (const it of r.itens) {
        for (const s of it.subitens || []) {
          for (const p of parcelas) {
            sum += safeNumber(getLancamento(s, p.id).valor);
          }
        }
      }
    }
    return sum;
  }, [rubricas, parcelas]);

  const saldoTotalContrato = totalRecebido - totalPago;

  const totalPagoPorParcela = useMemo(() => {
    const map = new Map<ID, number>();
    for (const p of parcelas) map.set(p.id, 0);

    for (const r of rubricas) {
      for (const it of r.itens) {
        for (const s of it.subitens || []) {
          for (const p of parcelas) {
            map.set(p.id, (map.get(p.id) || 0) + safeNumber(getLancamento(s, p.id).valor));
          }
        }
      }
    }

    return map;
  }, [rubricas, parcelas]);

  const saldoParcela = (p: Parcela) => safeNumber(p.valorRecebido) - (totalPagoPorParcela.get(p.id) || 0);

  // Ações: Rubricas (expand/collapse)
  const toggleRubrica = (rubricaId: ID) => {
    setRubricas(prev => prev.map(r => (r.id === rubricaId ? { ...r, expanded: !r.expanded } : r)));
  };

  // Ações: Parcelas
  const handleAddParcela = async () => {
    if (!ensureCanManageChildren()) return;
    if (!Number.isFinite(projectId)) {
      setActionError('ID do contrato inválido para criar parcela.');
      return;
    }
    if (!newParcela.dataRecebimento) return;
    if (!newParcela.valorRecebido || newParcela.valorRecebido <= 0) return;

    const nextNumero = (Math.max(0, ...parcelas.map(p => p.numero)) || 0) + 1;

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

  const handleStartEditParcela = (p: Parcela) => {
    if (!ensureCanManageChildren()) return;
    setEditingParcelaId(p.id);
    setEditParcelaForm({ ...p });
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
    const alvo = parcelas.find(p => p.id === parcelaId);
    if (!alvo) return;
    if (!isPersistedId(parcelaId)) {
      setActionError('Parcela inválida para remoção.');
      return;
    }

    if (!confirm(`Remover a parcela ${ordinal(alvo.numero)}?`)) {
      return;
    }

    setIsPersisting(true);
    setActionError(null);
    try {
      const incomeId = Number.parseInt(parcelaId, 10);
      const relatedExpenseIds = backendExpenses
        .filter((expense) => expense.incomeId === incomeId)
        .map((expense) => expense.id);

      await Promise.all(relatedExpenseIds.map((id) => deleteExpense(id)));
      await deleteIncome(incomeId);
      await loadData();
      showSavedMessage('Parcela removida com sucesso.');
    } catch (error) {
      setActionError(toErrorMessage(error, 'Não foi possível remover a parcela.'));
    } finally {
      setIsPersisting(false);
    }
  };

  // Ações: Subitens
  const handleAddSubitem = (itemId: ID) => {
    if (!ensureCanManageChildren()) return;
    if (!newSubitemEmpresa.trim()) return;

    const sub: Subitem = {
      id: `sub-${Date.now()}`,
      empresaRh: newSubitemEmpresa.trim(),
      lancamentos: {},
    };

    setRubricas(prev =>
      prev.map(r => ({
        ...r,
        itens: r.itens.map(it => (it.id === itemId ? { ...it, subitens: [...(it.subitens || []), sub] } : it)),
      }))
    );

    setNewSubitemEmpresa('');
    setAddingToItemId(null);
  };

  const handleRemoveSubitem = (itemId: ID, subitemId: ID) => {
    if (!ensureCanManageChildren()) return;
    if (!confirm('Remover este subitem?')) return;

    setRubricas(prev =>
      prev.map(r => ({
        ...r,
        itens: r.itens.map(it =>
          it.id === itemId ? { ...it, subitens: (it.subitens || []).filter(s => s.id !== subitemId) } : it
        ),
      }))
    );
  };

  const updateSubitemEmpresa = (itemId: ID, subitemId: ID, empresaRh: string) => {
    if (!canManageChildren) return;
    setRubricas(prev =>
      prev.map(r => ({
        ...r,
        itens: r.itens.map(it => {
          if (it.id !== itemId) return it;
          return {
            ...it,
            subitens: (it.subitens || []).map(s => (s.id === subitemId ? { ...s, empresaRh } : s)),
          };
        }),
      }))
    );
  };

  const updateLancamentoCampo = (
    itemId: ID,
    subitemId: ID,
    parcelaId: ID,
    patch: Partial<Lancamento>
  ) => {
    if (!canManageChildren) return;
    setRubricas(prev =>
      prev.map(r => ({
        ...r,
        itens: r.itens.map(it => {
          if (it.id !== itemId) return it;

          return {
            ...it,
            subitens: (it.subitens || []).map(s => {
              if (s.id !== subitemId) return s;

              const atual = getLancamento(s, parcelaId);
              const prox: Lancamento = {
                valor: Math.max(0, safeNumber(patch.valor ?? atual.valor)),
                dataPag: (patch.dataPag ?? atual.dataPag) || '',
                expenseId: atual.expenseId,
              };

              return {
                ...s,
                lancamentos: {
                  ...s.lancamentos,
                  [parcelaId]: prox,
                },
              };
            }),
          };
        }),
      }))
    );
  };

  const handleSaveSubitens = async () => {
    if (!ensureCanManageChildren()) return;
    if (!Number.isFinite(projectId)) {
      setActionError('ID do contrato inválido para salvar pagamentos.');
      return;
    }

    const currentExpenseById = new Map(backendExpenses.map((expense) => [expense.id, expense]));
    const keepExpenseIds = new Set<number>();
    const createPayloads: ExpenseRequestDTO[] = [];
    const updatePayloads: Array<{ id: number; payload: ExpenseUpdateDTO }> = [];
    const validationErrors: string[] = [];

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

          for (const parcela of parcelas) {
            const incomeId = parsePersistedId(parcela.id);
            if (!incomeId) {
              validationErrors.push(`Parcela ${ordinal(parcela.numero)} inválida para persistência.`);
              continue;
            }

            const cell = getLancamento(subitem, parcela.id);
            const amount = toMoneyValue(cell.valor);
            const expenseDate = (cell.dataPag || '').trim();
            const hasAmount = amount > 0;
            const hasDate = expenseDate.length > 0;
            const expenseId = parsePersistedId(cell.expenseId);

            if (!hasAmount && !hasDate) {
              continue;
            }

            if (!hasAmount || !hasDate) {
              validationErrors.push(
                `Preencha valor e data no subitem "${description || item.descricao}" da parcela ${ordinal(parcela.numero)}.`
              );
              continue;
            }

            if (!description) {
              validationErrors.push(
                `Informe o nome do subitem no item "${item.descricao}" para a parcela ${ordinal(parcela.numero)}.`
              );
              continue;
            }

            if (expenseId) {
              keepExpenseIds.add(expenseId);
              const currentExpense = currentExpenseById.get(expenseId);

              if (!currentExpense) {
                createPayloads.push({
                  budgetItemId,
                  categoryId,
                  incomeId,
                  expenseDate,
                  quantity: 1,
                  amount,
                  description,
                });
                continue;
              }

              const payload: ExpenseUpdateDTO = {
                budgetItemId,
                categoryId,
                incomeId,
                expenseDate,
                quantity: toPositiveInt(currentExpense.quantity, 1),
                amount,
                personId: currentExpense.personId ?? undefined,
                organizationId: currentExpense.organizationId ?? undefined,
                description,
                invoiceNumber: currentExpense.invoiceNumber ?? undefined,
                invoiceDate: currentExpense.invoiceDate ?? undefined,
                documentId: currentExpense.documentId ?? undefined,
              };

              const shouldUpdate =
                currentExpense.budgetItemId !== payload.budgetItemId ||
                currentExpense.categoryId !== payload.categoryId ||
                currentExpense.incomeId !== payload.incomeId ||
                (currentExpense.expenseDate || '') !== payload.expenseDate ||
                toPositiveInt(currentExpense.quantity, 1) !== payload.quantity ||
                toMoneyValue(currentExpense.amount) !== payload.amount ||
                (currentExpense.description || '') !== (payload.description || '');

              if (shouldUpdate) {
                updatePayloads.push({ id: expenseId, payload });
              }
            } else {
              createPayloads.push({
                budgetItemId,
                categoryId,
                incomeId,
                expenseDate,
                quantity: 1,
                amount,
                description,
              });
            }
          }
        }
      }
    }

    if (validationErrors.length > 0) {
      setActionError(validationErrors[0]);
      return;
    }

    const deleteIds = backendExpenses
      .map((expense) => expense.id)
      .filter((expenseId) => !keepExpenseIds.has(expenseId));

    const totalOperations = createPayloads.length + updatePayloads.length + deleteIds.length;
    if (totalOperations === 0) {
      setIsEditingSubitens(false);
      await loadData();
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
      setIsEditingSubitens(false);
      showSavedMessage('Pagamentos salvos com sucesso.');
    } catch (error) {
      setActionError(toErrorMessage(error, 'Não foi possível salvar os pagamentos.'));
    } finally {
      setIsPersisting(false);
    }
  };

  return (
    <div className="space-y-6">
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

      {/* Resumo topo */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Resumo Financeiro</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500">Total Recebido (pagamentos)</p>
            <p className="text-xl font-semibold text-gray-900">{formatCurrency(totalRecebido)}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500">Total Pago (lançamentos)</p>
            <p className="text-xl font-semibold text-gray-900">{formatCurrency(totalPago)}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500">Saldo Total do Contrato</p>
            <p className={`text-xl font-semibold ${saldoTotalContrato < 0 ? 'text-red-600' : 'text-blue-600'}`}>
              {formatCurrency(saldoTotalContrato)}
            </p>
          </div>
        </div>
      </div>

      {/* Entrada de Recurso (Parcelas) */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
          <div>
            <h4 className="font-medium text-gray-900">Parcelas recebidas</h4>
          </div>

          {!isAddingParcela && canManageChildren && (
            <div className="flex items-center gap-2">
              {isEditingSubitens && (
                <button
                  onClick={() => setIsEditingSubitens(false)}
                  disabled={isPersisting}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              )}
              <button
                onClick={() => {
                  if (isEditingSubitens) {
                    void handleSaveSubitens();
                    return;
                  }
                  setActionError(null);
                  setIsEditingSubitens(true);
                }}
                disabled={isPersisting || isLoading || Boolean(loadError)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors
                  ${isEditingSubitens
                    ? 'bg-[#003319] text-white'
                    : 'bg-[#004225] text-white hover:bg-[#003319]'}
                  `}
              >
                {isEditingSubitens ? (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar
                  </>
                ) : (
                  <>
                    <Pencil className="w-4 h-4" />
                    Editar
                  </>
                )}
              </button>
              <button
                onClick={() => setIsAddingParcela(true)}
                disabled={isPersisting || isLoading || Boolean(loadError)}
                className="flex items-center gap-2 px-4 py-2 bg-[#004225] text-white text-sm font-medium rounded-lg hover:bg-[#003319] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nova Parcela
              </button>
            </div>
          )}
        </div>

        {canManageChildren && isAddingParcela && (
          <div className="border-t border-gray-200 p-4 bg-emerald-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Valor recebido <span className="text-red-500">*</span>
                </label>
                <MoneyInput
                  valueCents={Math.round(newParcela.valorRecebido * 100)}
                  onValueChange={(cents) => setNewParcela(v => ({ ...v, valorRecebido: cents / 100 }))}
                  disabled={isPersisting}
                  className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Data de recebimento <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newParcela.dataRecebimento}
                  onChange={(e) => setNewParcela(v => ({ ...v, dataRecebimento: e.target.value }))}
                  disabled={isPersisting}
                  className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAddParcela}
                disabled={isPersisting || !newParcela.dataRecebimento || newParcela.valorRecebido <= 0}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                Criar
              </button>
              <button
                onClick={() => {
                  setIsAddingParcela(false);
                  setNewParcela({ valorRecebido: 0, dataRecebimento: '' });
                }}
                disabled={isPersisting}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-gray-200 bg-white">
                <th className="text-center py-2 px-3 font-medium text-gray-600 w-28">Parcela</th>
                <th className="text-center py-2 px-3 font-medium text-gray-600 w-48">Valor Recebido</th>
                <th className="text-center py-2 px-3 font-medium text-gray-600 w-44">Data Receb.</th>
                <th className="text-center py-2 px-3 font-medium text-gray-600 w-48">Total Pago</th>
                <th className="text-center py-2 px-3 font-medium text-gray-600 w-48">Saldo</th>
                <th className="text-center py-2 px-3 font-medium text-gray-600 w-28">Ações</th>
              </tr>
            </thead>
            <tbody>
              {parcelas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500">
                    <div className="inline-flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Nenhuma parcela cadastrada
                    </div>
                  </td>
                </tr>
              ) : (
                parcelas
                  .slice()
                  .sort((a, b) => a.numero - b.numero)
                  .map((p) => {
                    const pago = totalPagoPorParcela.get(p.id) || 0;
                    const saldo = safeNumber(p.valorRecebido) - pago;

                    return (
                      <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                        {canManageChildren && editingParcelaId === p.id && editParcelaForm ? (
                          <>
                            <td className="py-2 px-3 text-center font-medium text-gray-900">{ordinal(p.numero)}</td>
                            <td className="py-2 px-3">
                              <div className="flex justify-center">
                                <MoneyInput
                                  valueCents={Math.round(editParcelaForm.valorRecebido * 100)}
                                  onValueChange={(cents) => setEditParcelaForm(v => (v ? { ...v, valorRecebido: cents / 100 } : v))}
                                  disabled={isPersisting}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center"
                                />
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex justify-center">
                                <input
                                  type="date"
                                  value={editParcelaForm.dataRecebimento}
                                  onChange={(e) => setEditParcelaForm(v => (v ? { ...v, dataRecebimento: e.target.value } : v))}
                                  disabled={isPersisting}
                                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </div>
                            </td>
                            <td className="py-2 px-3 text-center font-medium text-gray-900">{formatCurrency(pago)}</td>
                            <td className={`py-2 px-3 text-center font-semibold ${saldo < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                              {formatCurrency(saldo)}
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={handleSaveEditParcela}
                                  disabled={isPersisting}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                                  title="Salvar"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={handleCancelEditParcela}
                                  disabled={isPersisting}
                                  className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                  title="Cancelar"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-2 px-3 text-center font-medium text-gray-900">{ordinal(p.numero)}</td>
                            <td className="py-2 px-3 text-center font-semibold text-gray-900">{formatCurrency(p.valorRecebido)}</td>
                            <td className="py-2 px-3 text-center text-gray-700">{p.dataRecebimento || '-'}</td>
                            <td className="py-2 px-3 text-center font-medium text-gray-900">{formatCurrency(pago)}</td>
                            <td className={`py-2 px-3 text-center font-semibold ${saldo < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                              {formatCurrency(saldo)}
                            </td>
                            <td className="py-2 px-3">
                              {canManageChildren ? (
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => handleStartEditParcela(p)}
                                    disabled={isPersisting}
                                    className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                    title="Editar"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveParcela(p.id)}
                                    disabled={isPersisting}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                    title="Remover"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <span className="block text-center text-xs text-gray-400">Somente leitura</span>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rubricas / Itens / Subitens (Planilha) */}
      <div className="space-y-4">
        {rubricas.map((rub) => {
          const orcadoRub = calcularTotalOrcadoRubrica(rub);
          const pagoRub = calcularTotalPagoRubrica(rub);
          const saldoRub = orcadoRub - pagoRub;

          return (
            <div key={rub.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Header rubrica */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100">
                <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleRubrica(rub.id)}>
                  {rub.expanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{rub.nome}</span>
                    <span className="text-xs text-gray-500">
                      Orçado: {formatCurrency(orcadoRub)} • Pago: {formatCurrency(pagoRub)} •{' '}
                      <span className={saldoRub < 0 ? 'text-red-600 font-semibold' : 'text-blue-600 font-semibold'}>
                        Saldo: {formatCurrency(saldoRub)}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Conteúdo */}
              {rub.expanded && (
                <div className="px-4 py-3 bg-white">
                  {rub.itens.length === 0 ? (
                    <div className="flex items-center gap-2 text-gray-500 py-6 justify-center">
                      <AlertCircle className="w-5 h-5" />
                      <span>Nenhum item cadastrado nesta rubrica</span>
                    </div>
                  ) : (
                    <ResizableTable
                      columnCount={9 + parcelas.length * 2}
                      defaultWidths={[
                        100, // Código
                        260, // Item
                        100, // Qtd
                        100, // Meses
                        140, // Valor unit.
                        150, // Total
                        200, // Meta
                        240, // Subitem
                        ...parcelas.flatMap(() => [270, 270]), // Valor e Data de pag. para cada parcela
                        150, // SALDO
                      ]}
                      minColumnWidth={80}
                      className="divide-y divide-gray-200"
                    >
                      <thead>
                        {/* Header agrupado (colSpan) */}
                        <tr className="border-b border-gray-200">
                          <th
                            rowSpan={2}
                            className={`text-center py-2 px-2 font-medium text-gray-600 ${STICKY_ITEM_HEADER_CLASS}`}
                          >
                            Item
                          </th>
                          <th rowSpan={2} className="text-center py-2 px-2 font-medium text-gray-600">Qtd</th>
                          <th rowSpan={2} className="text-center py-2 px-2 font-medium text-gray-600">Meses</th>
                          <th rowSpan={2} className="text-center py-2 px-2 font-medium text-gray-600">Valor unit.</th>
                          <th rowSpan={2} className="text-center py-2 px-2 font-medium text-gray-600">Total</th>
                          <th rowSpan={2} className="text-center py-2 px-2 font-medium text-gray-600">Meta</th>
                          <th rowSpan={2} className="text-center py-2 px-2 font-medium text-gray-600">Subitem</th>

                            {parcelas
                              .slice()
                              .sort((a, b) => a.numero - b.numero)
                              .map((p) => (
                                <th
                                  key={p.id}
                                  colSpan={2}
                                  className="text-center py-2 px-2 font-medium text-gray-600 min-w-[240px]"
                                >
                                  <div className="font-semibold text-gray-800">{ordinal(p.numero)} PAGAMENTO</div>
                                  <div className="text-xs text-gray-500">{formatCurrency(p.valorRecebido)}</div>
                                  <div className="text-xs text-gray-500">{p.dataRecebimento || '-'}</div>
                                </th>
                              ))}

                            <th rowSpan={2} className="text-center py-2 px-2 font-medium text-gray-600 w-36">SALDO</th>
                          </tr>

                          <tr className="border-b border-gray-200">
                            {parcelas
                              .slice()
                              .sort((a, b) => a.numero - b.numero)
                              .flatMap((p) => [
                                <th key={`${p.id}-valor`} className="text-center py-2 px-2 font-medium text-gray-600 w-32">
                                  Valor
                                </th>,
                                <th key={`${p.id}-data`} className="text-center py-2 px-2 font-medium text-gray-600 w-36">
                                  Data de pag.
                                </th>,
                              ])}
                          </tr>
                        </thead>

                        <tbody>
                          {rub.itens.map((it) => {
                            const totalItem = calcularTotalOrcadoItem(it);
                            const pagoItem = calcularTotalPagoItem(it);
                            const saldoItem = totalItem - pagoItem;

                            return (
                              <Fragment key={it.id}>
                                {/* Linha do ITEM (pai) */}
                                <tr className="border-b border-gray-100 bg-gray-50">
                                  <td
                                    className={`py-2 px-2 text-left font-medium text-gray-900 ${STICKY_ITEM_PARENT_CELL_CLASS}`}
                                  >
                                    {it.descricao}
                                  </td>
                                  <td className="py-2 px-2 text-center text-gray-700">{it.quantidade}</td>
                                  <td className="py-2 px-2 text-center text-gray-700">{it.meses}</td>
                                  <td className="py-2 px-2 text-center text-gray-700">{formatCurrency(it.valorUnitario)}</td>
                                  <td className="py-2 px-2 text-center font-semibold text-gray-900">{formatCurrency(totalItem)}</td>
                                  <td className="py-2 px-2 text-gray-700">{it.meta || '-'}</td>

                                  <td className="py-2 px-2">
                                    {canManageChildren && addingToItemId !== it.id ? (
                                      <button
                                        onClick={() => setAddingToItemId(it.id)}
                                        disabled={!isEditingSubitens || isPersisting}
                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-sm ${
                                          isEditingSubitens && !isPersisting
                                            ? 'text-[#004225] hover:bg-emerald-50'
                                            : 'text-gray-400 cursor-not-allowed bg-gray-100'
                                        }`}
                                      >
                                        <Plus className="w-4 h-4" />
                                        Novo subitem
                                      </button>
                                    ) : canManageChildren ? (
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="text"
                                          value={newSubitemEmpresa}
                                          onChange={(e) => setNewSubitemEmpresa(e.target.value)}
                                          disabled={isPersisting}
                                          className="w-full px-2 py-1 border border-emerald-300 rounded text-sm"
                                          autoFocus
                                        />
                                        <button
                                          onClick={() => handleAddSubitem(it.id)}
                                          disabled={isPersisting || !newSubitemEmpresa.trim()}
                                          className="p-1 text-green-700 hover:bg-green-50 rounded disabled:opacity-50"
                                          title="Adicionar"
                                        >
                                          <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            setAddingToItemId(null);
                                            setNewSubitemEmpresa('');
                                          }}
                                          disabled={isPersisting}
                                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                          title="Cancelar"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-gray-400">Somente leitura</span>
                                    )}
                                  </td>

                                  {/* Totais por parcela (somatório dos subitens) */}
                                  {parcelas
                                    .slice()
                                    .sort((a, b) => a.numero - b.numero)
                                    .flatMap((p) => {
                                      const totalParcelaItem = calcularPagoItemPorParcela(it, p.id);

                                      return [
                                        <td key={`${it.id}-${p.id}-sum`} className="py-2 px-2 text-center font-medium text-gray-900">
                                          {formatCurrency(totalParcelaItem)}
                                        </td>,
                                        <td key={`${it.id}-${p.id}-dash`} className="py-2 px-2 text-center text-gray-400">
                                          
                                        </td>,
                                      ];
                                    })}

                                  <td className={`py-2 px-2 text-center font-semibold ${saldoItem < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                    {formatCurrency(saldoItem)}
                                  </td>
                                </tr>

                                {/* Linhas de SUBITENS (filhas) */}
                                {(!it.subitens || it.subitens.length === 0) ? (
                                  <tr key={`${it.id}-empty`} className="border-b border-gray-100">
                                    <td colSpan={8 + parcelas.length * 2 + 1} className="py-4 text-center text-gray-500">
                                      Nenhum subitem cadastrado para este item
                                    </td>
                                  </tr>
                                ) : (
                                  it.subitens.map((sub) => {
                                    const totalSub = calcularTotalPagoSubitem(sub);

                                    return (
                                      <tr key={sub.id} className="group border-b border-gray-100 hover:bg-gray-50">
                                        <td
                                          className={`py-2 px-2 text-left text-sm text-gray-600 ${STICKY_ITEM_SUBITEM_CELL_CLASS}`}
                                        >
                                          <span className="block truncate font-medium text-gray-700">
                                            {it.descricao}
                                          </span>
                                        </td>
                                        <td className="py-2 px-2 text-gray-400"> </td>
                                        <td className="py-2 px-2 text-gray-400"> </td>
                                        <td className="py-2 px-2 text-gray-400"> </td>
                                        <td className="py-2 px-2 text-gray-400"> </td>
                                        <td className="py-2 px-2 text-gray-400"> </td>
                                        <td className="py-2 px-2 text-gray-400"> </td>

                                        <td className="py-2 px-2">
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="text"
                                              value={sub.empresaRh}
                                              onChange={(e) => updateSubitemEmpresa(it.id, sub.id, e.target.value)}
                                              disabled={!isEditingSubitens || isPersisting}
                                              className={`w-full px-2 py-1 border border-gray-300 rounded text-sm ${
                                                isEditingSubitens && !isPersisting
                                                  ? 'bg-white'
                                                  : 'bg-gray-50 cursor-not-allowed'
                                              }`}
                                            />
                                            {canManageChildren && isEditingSubitens && !isPersisting && (
                                              <button
                                                onClick={() => handleRemoveSubitem(it.id, sub.id)}
                                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                title="Remover subitem"
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </button>
                                            )}
                                          </div>
                                          <p className="text-xs text-gray-500 mt-1 text-left">
                                            Total lançado: <span className="font-medium">{formatCurrency(totalSub)}</span>
                                          </p>
                                        </td>

                                        {parcelas
                                          .slice()
                                          .sort((a, b) => a.numero - b.numero)
                                          .flatMap((p) => {
                                            const cell = getLancamento(sub, p.id);

                                            return [
                                              <td key={`${sub.id}-${p.id}-v`} className="py-2 px-2 text-center">
                                                {canManageChildren && isEditingSubitens ? (
                                                  <div className="flex justify-center">
                                                    <MoneyInput
                                                      valueCents={Math.round(cell.valor * 100)}
                                                      onValueChange={(cents) =>
                                                        updateLancamentoCampo(it.id, sub.id, p.id, { valor: cents / 100 })
                                                      }
                                                      disabled={isPersisting}
                                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center bg-white"
                                                    />
                                                  </div>
                                                ) : (
                                                  <div className="text-center text-gray-700 py-1 px-2">
                                                    {formatCurrency(cell.valor)}
                                                  </div>
                                                )}
                                              </td>,
                                              <td key={`${sub.id}-${p.id}-d`} className="py-2 px-2 text-center">
                                                {canManageChildren && isEditingSubitens ? (
                                                  <div className="flex justify-center">
                                                    <input
                                                      type="date"
                                                      value={cell.dataPag || ''}
                                                      onChange={(e) =>
                                                        updateLancamentoCampo(it.id, sub.id, p.id, { dataPag: e.target.value })
                                                      }
                                                      disabled={isPersisting}
                                                      className="px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                                                    />
                                                  </div>
                                                ) : (
                                                  <div className="text-center text-gray-700 py-1 px-2">
                                                    {formatDate(cell.dataPag)}
                                                  </div>
                                                )}
                                              </td>,
                                            ];
                                          })}

                                        {/* SALDO: não se aplica para subitem (na planilha costuma ficar no item). */}
                                        <td className="py-2 px-2 text-center text-gray-400">—</td>
                                      </tr>
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
    </div>
  );
}

