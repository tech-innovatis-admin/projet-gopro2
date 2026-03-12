'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Edit2,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { RemanejamentoModal } from './_components/RemanejamentoModal';
import { HistoricoRemanejamentos } from './_components/HistoricoRemanejamentos';
import { MoneyInput } from '../desembolso/_components/MoneyImput';
import { ResizableTable } from '@/components/ui/resizable-table';
import {
  createBudgetCategory,
  createBudgetItem,
  createBudgetTransfer,
  deleteBudgetCategory,
  deleteBudgetItem,
  listBudgetCategories,
  listBudgetItems,
  listBudgetTransfers,
  listGoals,
  updateBudgetCategory,
  updateBudgetItem,
} from '@/src/lib/api/endpoints';
import { resolveUserNamesById } from '@/src/lib/audit/userLookup';
import { requireCurrentUserId } from '@/src/lib/auth/session';
import {
  HttpError,
  type BudgetTransferRequestDTO,
  type GoalResponseDTO,
  type PageResponseDTO,
} from '@/src/lib/api/types';

type ID = string;

interface Remanejamento {
  id: string;
  contratoId: string;
  itemOrigemId: string;
  itemDestinoId: string;
  valor: number;
  data: string;
  motivo: string;
  createdBy: string;
  createdAt: string;
  status?: 'PENDENTE' | 'APROVADO';
}

type Lancamento = {
  valor: number;
  dataPag: string;
};

type Subitem = {
  id: ID;
  empresaRh: string;
  lancamentos: Record<ID, Lancamento | undefined>;
};

interface ItemRubrica {
  id: string;
  codigo?: string;
  descricao: string;
  quantidade: number;
  meses: number;
  valorUnitario: number;
  valorTotal: number;
  meta?: string;
  metaId?: string;
  subitens?: Subitem[];
  remanejamentoDebito?: number;
  remanejamentoCredito?: number;
  valorFinal?: number;
}

interface Rubrica {
  id: string;
  codigo: string;
  nome: string;
  itens: ItemRubrica[];
  expanded: boolean;
}

interface MetaOption {
  id: string;
  numero: number;
  titulo: string;
}

interface RubricaEditForm {
  nome: string;
}

const PAGE_SIZE = 20;
const MAX_PAGE_REQUESTS = 1000;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

const toSafeNumber = (value: number | null | undefined): number => {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }
  return value;
};

const toPositiveInt = (value: number | undefined, fallback = 1): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.trunc(parsed));
};

const toMoneyValue = (value: number | undefined): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Number(parsed.toFixed(2));
};

const toErrorMessage = (error: unknown, fallback: string) =>
  error instanceof HttpError ? error.message : fallback;

const isPersistedId = (id: string) => /^\d+$/.test(id);
const toPersistedId = (id: string) => Number.parseInt(id, 10);

const normalizeTransferStatus = (status: string | null | undefined): 'PENDENTE' | 'APROVADO' =>
  status === 'APROVADO' ? 'APROVADO' : 'PENDENTE';

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

export default function RubricasPage() {
  const params = useParams();
  const contratoId = params.contratoId as string;
  const projectId = useMemo(() => Number.parseInt(contratoId, 10), [contratoId]);

  const [rubricas, setRubricas] = useState<Rubrica[]>([]);
  const [metas, setMetas] = useState<MetaOption[]>([]);
  const [editingRubrica, setEditingRubrica] = useState<string | null>(null);
  const [editRubricaForm, setEditRubricaForm] = useState<RubricaEditForm | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ItemRubrica | null>(null);
  const [addingToRubrica, setAddingToRubrica] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Partial<ItemRubrica>>({
    descricao: '',
    quantidade: 1,
    meses: 1,
    valorUnitario: 0,
  });
  const [isAddingRubrica, setIsAddingRubrica] = useState(false);
  const [newRubrica, setNewRubrica] = useState({ nome: '' });
  const [remanejamentos, setRemanejamentos] = useState<Remanejamento[]>([]);
  const [remanejamentoModalOpen, setRemanejamentoModalOpen] = useState(false);
  const [itemParaRemanejamento, setItemParaRemanejamento] = useState<ItemRubrica | null>(null);
  const [historicoModalOpen, setHistoricoModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const showSavedMessage = (message: string) => {
    setSavedMessage(message);
    setTimeout(() => setSavedMessage(null), 2500);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    if (!Number.isFinite(projectId)) {
      setRubricas([]);
      setMetas([]);
      setRemanejamentos([]);
      setLoadError('ID do contrato invalido para carregar rubricas.');
      setIsLoading(false);
      return;
    }

    try {
      const [allCategories, allItems, allGoals, allTransfers] = await Promise.all([
        fetchAllPages((query) => listBudgetCategories({ ...query, projectId })),
        fetchAllPages((query) => listBudgetItems({ ...query, projectId })),
        fetchAllPages((query) => listGoals({ ...query, projectId })).catch(
          () => [] as GoalResponseDTO[]
        ),
        fetchAllPages((query) => listBudgetTransfers({ ...query, projectId })),
      ]);

      const projectGoals = (allGoals as GoalResponseDTO[])
        .filter((goal) => goal.projectId === projectId)
        .sort((a, b) => a.numero - b.numero || a.id - b.id);

      setMetas(
        projectGoals.map((goal) => ({
          id: String(goal.id),
          numero: goal.numero,
          titulo: goal.titulo,
        }))
      );

      const categories = allCategories
        .filter((category) => category.projectId === projectId)
        .sort((a, b) => {
          const codeA = a.code || '';
          const codeB = b.code || '';
          return codeA.localeCompare(codeB, 'pt-BR') || a.id - b.id;
        });

      const categoryIds = new Set(categories.map((category) => category.id));
      const itemsByCategory = new Map<number, ItemRubrica[]>();

      for (const item of allItems) {
        if (!categoryIds.has(item.categoryId)) continue;

        const quantidade = toPositiveInt(item.quantity ?? 1);
        const meses = toPositiveInt(item.months ?? 1);
        const valorUnitario = toMoneyValue(item.unitCost ?? 0);
        const valorPlanejado = toMoneyValue(item.plannedAmount);
        const valorTotal =
          valorPlanejado > 0
            ? valorPlanejado
            : Number((quantidade * meses * valorUnitario).toFixed(2));

        const mappedItem: ItemRubrica = {
          id: String(item.id),
          descricao: item.description,
          quantidade,
          meses,
          valorUnitario,
          valorTotal,
          metaId: item.goalId ? String(item.goalId) : undefined,
          subitens: [],
        };

        const existing = itemsByCategory.get(item.categoryId) ?? [];
        existing.push(mappedItem);
        itemsByCategory.set(item.categoryId, existing);
      }

      for (const [categoryId, categoryItems] of itemsByCategory.entries()) {
        itemsByCategory.set(
          categoryId,
          [...categoryItems].sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR'))
        );
      }

      setRubricas((previous) => {
        const expandedById = new Map(previous.map((rubrica) => [rubrica.id, rubrica.expanded]));
        return categories.map((category) => ({
          id: String(category.id),
          codigo: category.code || `RUB-${category.id}`,
          nome: category.name,
          itens: itemsByCategory.get(category.id) ?? [],
          expanded: expandedById.get(String(category.id)) ?? true,
        }));
      });

      const projectTransfers = allTransfers.filter((transfer) => transfer.projectId === projectId);
      const transferCreatorNames = await resolveUserNamesById(
        projectTransfers.map((transfer) => transfer.createdBy)
      );

      const transfers = projectTransfers
        .map<Remanejamento>((transfer) => ({
          id: String(transfer.id),
          contratoId: String(transfer.projectId),
          itemOrigemId: String(transfer.fromItemId),
          itemDestinoId: String(transfer.toItemId),
          valor: toSafeNumber(transfer.amount),
          data: transfer.transferDate || '',
          motivo: transfer.reason || '',
          createdBy: transfer.createdBy
            ? (transferCreatorNames[transfer.createdBy] ?? `ID ${transfer.createdBy}`)
            : '-',
          createdAt: transfer.createdAt || '',
          status: normalizeTransferStatus(transfer.status),
        }))
        .sort((a, b) => b.data.localeCompare(a.data));

      setRemanejamentos(transfers);
    } catch (error) {
      setLoadError(toErrorMessage(error, 'Nao foi possivel carregar rubricas.'));
      setRubricas([]);
      setMetas([]);
      setRemanejamentos([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const calcularRemanejamentosItem = (itemId: string) => {
    const debito = remanejamentos
      .filter((rem) => rem.itemOrigemId === itemId)
      .reduce((acc, rem) => acc + rem.valor, 0);

    const credito = remanejamentos
      .filter((rem) => rem.itemDestinoId === itemId)
      .reduce((acc, rem) => acc + rem.valor, 0);

    return { debito, credito };
  };

  const calcularValorFinalItem = (item: ItemRubrica) => {
    const { debito, credito } = calcularRemanejamentosItem(item.id);
    return item.valorTotal - debito + credito;
  };

  const calcularTotalRubrica = (rubrica: Rubrica) =>
    rubrica.itens.reduce((acc, item) => acc + calcularValorFinalItem(item), 0);

  const calcularTotalGeral = () =>
    rubricas.reduce((acc, rubrica) => acc + calcularTotalRubrica(rubrica), 0);

  const toggleExpand = (rubricaId: string) => {
    setRubricas((current) =>
      current.map((rubrica) =>
        rubrica.id === rubricaId ? { ...rubrica, expanded: !rubrica.expanded } : rubrica
      )
    );
  };

  const handleAddItem = async (rubricaId: string) => {
    if (!newItem.descricao?.trim()) return;
    if (!isPersistedId(rubricaId)) {
      setActionError('Rubrica invalida para adicionar item.');
      return;
    }

    const quantidade = toPositiveInt(newItem.quantidade, 1);
    const meses = toPositiveInt(newItem.meses, 1);
    const valorUnitario = toMoneyValue(newItem.valorUnitario);
    const valorTotal = Number((quantidade * meses * valorUnitario).toFixed(2));
    const goalId =
      newItem.metaId && isPersistedId(newItem.metaId) ? toPersistedId(newItem.metaId) : null;

    setIsSubmitting(true);
    setActionError(null);
    setSavedMessage(null);

    try {
      const actorUserId = await requireCurrentUserId();
      await createBudgetItem({
        categoryId: toPersistedId(rubricaId),
        description: newItem.descricao.trim(),
        quantity: quantidade,
        months: meses,
        unitCost: valorUnitario,
        plannedAmount: valorTotal,
        executedAmount: 0,
        goalId,
        createdBy: actorUserId,
      });

      await loadData();
      setNewItem({
        descricao: '',
        quantidade: 1,
        meses: 1,
        valorUnitario: 0,
        metaId: undefined,
      });
      setAddingToRubrica(null);
      showSavedMessage('Item adicionado com sucesso.');
    } catch (error) {
      setActionError(toErrorMessage(error, 'Nao foi possivel adicionar o item.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (item: ItemRubrica) => {
    setEditingItem(item.id);
    setEditForm({ ...item });
  };

  const handleSaveEdit = async (rubricaId: string) => {
    if (!editForm || !editingItem) return;
    if (!isPersistedId(editingItem) || !isPersistedId(rubricaId)) {
      setActionError('Item ou rubrica invalida para atualizar.');
      return;
    }

    const quantidade = toPositiveInt(editForm.quantidade, 1);
    const meses = toPositiveInt(editForm.meses, 1);
    const valorUnitario = toMoneyValue(editForm.valorUnitario);
    const valorTotal = Number((quantidade * meses * valorUnitario).toFixed(2));
    const goalId =
      editForm.metaId && isPersistedId(editForm.metaId) ? toPersistedId(editForm.metaId) : null;

    setIsSubmitting(true);
    setActionError(null);
    setSavedMessage(null);

    try {
      const actorUserId = await requireCurrentUserId();
      await updateBudgetItem(toPersistedId(editingItem), {
        categoryId: toPersistedId(rubricaId),
        description: editForm.descricao.trim(),
        quantity: quantidade,
        months: meses,
        unitCost: valorUnitario,
        plannedAmount: valorTotal,
        goalId,
        updatedBy: actorUserId,
      });

      await loadData();
      setEditingItem(null);
      setEditForm(null);
      showSavedMessage('Item atualizado com sucesso.');
    } catch (error) {
      setActionError(toErrorMessage(error, 'Nao foi possivel atualizar o item.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditForm(null);
  };

  const handleRemoveItem = async (rubricaId: string, itemId: string) => {
    if (!confirm('Tem certeza que deseja remover este item?')) return;
    if (!isPersistedId(rubricaId) || !isPersistedId(itemId)) {
      setActionError('Item invalido para remocao.');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setSavedMessage(null);

    try {
      await deleteBudgetItem(toPersistedId(itemId));
      await loadData();
      showSavedMessage('Item removido com sucesso.');
    } catch (error) {
      setActionError(toErrorMessage(error, 'Nao foi possivel remover o item.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddRubrica = async () => {
    if (!newRubrica.nome.trim()) return;
    if (!Number.isFinite(projectId)) {
      setActionError('ID do contrato invalido para criar rubrica.');
      return;
    }

    const generatedCode = `RUB-${projectId}-${Date.now().toString().slice(-6)}`;

    setIsSubmitting(true);
    setActionError(null);
    setSavedMessage(null);

    try {
      const actorUserId = await requireCurrentUserId();
      await createBudgetCategory({
        projectId,
        code: generatedCode,
        name: newRubrica.nome.trim(),
        createdBy: actorUserId,
      });

      await loadData();
      setNewRubrica({ nome: '' });
      setIsAddingRubrica(false);
      showSavedMessage('Rubrica criada com sucesso.');
    } catch (error) {
      setActionError(toErrorMessage(error, 'Nao foi possivel criar a rubrica.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEditRubrica = (rubrica: Rubrica) => {
    setEditingRubrica(rubrica.id);
    setEditRubricaForm({ nome: rubrica.nome });
    setEditingItem(null);
    setEditForm(null);
    setAddingToRubrica(null);
  };

  const handleSaveRubricaEdit = async (rubricaId: string) => {
    if (!editRubricaForm?.nome.trim()) {
      setActionError('Informe o nome da rubrica.');
      return;
    }

    if (!isPersistedId(rubricaId)) {
      setActionError('Rubrica invalida para atualizacao.');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setSavedMessage(null);

    try {
      const actorUserId = await requireCurrentUserId();
      await updateBudgetCategory(toPersistedId(rubricaId), {
        name: editRubricaForm.nome.trim(),
        updatedBy: actorUserId,
      });

      await loadData();
      setEditingRubrica(null);
      setEditRubricaForm(null);
      showSavedMessage('Rubrica atualizada com sucesso.');
    } catch (error) {
      setActionError(toErrorMessage(error, 'Nao foi possivel atualizar a rubrica.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAddRubrica = () => {
    setNewRubrica({ nome: '' });
    setIsAddingRubrica(false);
  };

  const handleCancelEditRubrica = () => {
    setEditingRubrica(null);
    setEditRubricaForm(null);
  };

  const handleRemoveRubrica = async (rubricaId: string) => {
    if (!confirm('Tem certeza que deseja remover esta rubrica? Todos os itens serao removidos.')) {
      return;
    }

    if (!isPersistedId(rubricaId)) {
      setActionError('Rubrica invalida para remocao.');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setSavedMessage(null);

    try {
      await deleteBudgetCategory(toPersistedId(rubricaId));
      await loadData();
      showSavedMessage('Rubrica removida com sucesso.');
    } catch (error) {
      setActionError(toErrorMessage(error, 'Nao foi possivel remover a rubrica.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAbrirRemanejamento = (item: ItemRubrica) => {
    setItemParaRemanejamento(item);
    setRemanejamentoModalOpen(true);
  };

  const handleConfirmarRemanejamento = async (form: {
    itemOrigemId: string;
    itemDestinoId: string;
    valor: number;
    data: string;
    motivo: string;
  }) => {
    if (!Number.isFinite(projectId)) {
      setActionError('ID do contrato invalido para remanejamento.');
      return;
    }
    if (!isPersistedId(form.itemOrigemId) || !isPersistedId(form.itemDestinoId)) {
      setActionError('Itens invalidos para remanejamento.');
      return;
    }

    const itemOrigemAtual = rubricas.flatMap((rubrica) => rubrica.itens).find(
      (item) => item.id === form.itemOrigemId
    );
    const saldoDisponivel = itemOrigemAtual ? calcularValorFinalItem(itemOrigemAtual) : 0;

    if (form.valor > saldoDisponivel) {
      setActionError(
        `Valor acima do saldo disponivel do item de origem (${formatCurrency(saldoDisponivel)}).`
      );
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setSavedMessage(null);

    try {
      const actorUserId = await requireCurrentUserId();
      const payload: BudgetTransferRequestDTO = {
        projectId,
        fromItemId: toPersistedId(form.itemOrigemId),
        toItemId: toPersistedId(form.itemDestinoId),
        amount: toMoneyValue(form.valor),
        transferDate: form.data,
        status: 'APROVADO',
        reason: form.motivo.trim(),
        createdBy: actorUserId,
      };

      await createBudgetTransfer(payload);
      await loadData();
      setRemanejamentoModalOpen(false);
      setItemParaRemanejamento(null);
      showSavedMessage('Remanejamento registrado com sucesso.');
    } catch (error) {
      setActionError(toErrorMessage(error, 'Nao foi possivel registrar o remanejamento.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const remanejamentosComDados = useMemo(() => {
    return remanejamentos.map((remanejamento) => {
      const itemOrigem = rubricas
        .flatMap((rubrica) => rubrica.itens)
        .find((item) => item.id === remanejamento.itemOrigemId);

      const itemDestino = rubricas
        .flatMap((rubrica) => rubrica.itens)
        .find((item) => item.id === remanejamento.itemDestinoId);

      const rubricaOrigem = rubricas.find((rubrica) =>
        rubrica.itens.some((item) => item.id === remanejamento.itemOrigemId)
      );

      const rubricaDestino = rubricas.find((rubrica) =>
        rubrica.itens.some((item) => item.id === remanejamento.itemDestinoId)
      );

      return {
        ...remanejamento,
        itemOrigem: itemOrigem
          ? {
              descricao: itemOrigem.descricao,
              codigo: itemOrigem.codigo,
              rubricaNome: rubricaOrigem?.nome || '',
              rubricaCodigo: rubricaOrigem?.codigo || '',
            }
          : undefined,
        itemDestino: itemDestino
          ? {
              descricao: itemDestino.descricao,
              codigo: itemDestino.codigo,
              rubricaNome: rubricaDestino?.nome || '',
              rubricaCodigo: rubricaDestino?.codigo || '',
            }
          : undefined,
      };
    });
  }, [remanejamentos, rubricas]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Rubricas Orcamentarias</h3>
          <p className="text-sm text-gray-500">
            Gerencie os itens de despesa organizados por categoria orcamentaria
          </p>
        </div>
        <div className="flex items-center gap-4">
          {!isAddingRubrica && (
            <button
              onClick={() => setIsAddingRubrica(true)}
              disabled={isSubmitting || isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-[#004225] text-white text-sm font-medium rounded-lg hover:bg-[#003319] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Nova Rubrica
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Carregando rubricas...
        </div>
      )}

      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div>{loadError}</div>
          <button
            type="button"
            onClick={() => void loadData()}
            className="mt-2 rounded-md border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {savedMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {savedMessage}
        </div>
      )}

      {isAddingRubrica && (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Plus className="w-5 h-5 text-emerald-700" />
            <h4 className="font-medium text-emerald-900">Nova Rubrica</h4>
          </div>
          <div className="mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newRubrica.nome}
                onChange={(e) => setNewRubrica({ ...newRubrica, nome: e.target.value })}
                placeholder="Ex: Material de Consumo"
                className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                maxLength={100}
                autoFocus
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void handleAddRubrica()}
              disabled={isSubmitting || !newRubrica.nome.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              Criar Rubrica
            </button>
            <button
              onClick={handleCancelAddRubrica}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {rubricas.map((rubrica) => (
          <div key={rubrica.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100">
              {editingRubrica === rubrica.id && editRubricaForm ? (
                <div className="flex items-center gap-3 flex-1">
                  {rubrica.expanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                  <div className="flex-1 max-w-xl">
                    <p className="font-mono text-sm text-gray-500 mb-1">[{rubrica.codigo}]</p>
                    <input
                      type="text"
                      value={editRubricaForm.nome}
                      onChange={(e) => setEditRubricaForm({ nome: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Nome da rubrica"
                      maxLength={100}
                      autoFocus
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {rubrica.itens.length} {rubrica.itens.length === 1 ? 'item cadastrado' : 'itens cadastrados'}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => toggleExpand(rubrica.id)}
                >
                  {rubrica.expanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                  <div>
                    <span className="font-mono text-sm text-gray-500 mr-2">[{rubrica.codigo}]</span>
                    <span className="font-medium text-gray-900">{rubrica.nome}</span>
                    <span className="ml-2 text-sm text-gray-500">
                      ({rubrica.itens.length} {rubrica.itens.length === 1 ? 'item' : 'itens'})
                    </span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4">
                <span className="font-semibold text-gray-700">
                  {formatCurrency(calcularTotalRubrica(rubrica))}
                </span>
                {editingRubrica === rubrica.id ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => void handleSaveRubricaEdit(rubrica.id)}
                      disabled={isSubmitting || !editRubricaForm?.nome.trim()}
                      className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check className="w-4 h-4" />
                      Salvar
                    </button>
                    <button
                      onClick={handleCancelEditRubrica}
                      disabled={isSubmitting}
                      className="flex items-center gap-1 px-3 py-1 bg-white text-gray-700 text-sm rounded-md border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" />
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAddingToRubrica(rubrica.id);
                        setRubricas((current) =>
                          current.map((item) =>
                            item.id === rubrica.id ? { ...item, expanded: true } : item
                          )
                        );
                      }}
                      disabled={isSubmitting}
                      className="flex items-center gap-1 px-3 py-1 bg-[#004225] text-white text-sm rounded-md hover:bg-[#003319] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      Novo Item
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEditRubrica(rubrica);
                      }}
                      disabled={isSubmitting}
                      className="flex items-center gap-1 px-3 py-1 bg-white text-gray-700 text-sm rounded-md border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Editar rubrica"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleRemoveRubrica(rubrica.id);
                      }}
                      disabled={isSubmitting}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Remover rubrica"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {rubrica.expanded && (
              <div className="px-4 py-3 bg-white">
                {rubrica.itens.length === 0 && !addingToRubrica ? (
                  <div className="flex items-center gap-2 text-gray-500 py-4 justify-center">
                    <AlertCircle className="w-5 h-5" />
                    <span>Nenhum item cadastrado nesta rubrica</span>
                  </div>
                ) : (
                  <ResizableTable
                    columnCount={10}
                    defaultWidths={[250, 80, 80, 150, 150, 120, 120, 150, 220, 130]}
                    minColumnWidth={60}
                    className="text-sm"
                  >
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 font-medium text-gray-600">Descrição</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600">Qtd</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600">Meses</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600">Valor Unit.</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600">Valor Total</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600 text-red-600">Rem. (Deb.)</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600 text-green-600">Rem. (Cred.)</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600 text-blue-600">Valor Final</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600">Meta</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rubrica.itens.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                          {editingItem === item.id && editForm ? (
                            <>
                              <td className="py-2 px-2">
                                <input
                                  type="text"
                                  value={editForm.descricao}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, descricao: e.target.value })
                                  }
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </td>
                              <td className="py-2 px-2 text-center">
                                <input
                                  type="number"
                                  value={editForm.quantidade}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      quantidade: Number(e.target.value),
                                    })
                                  }
                                  min={1}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center"
                                />
                              </td>
                              <td className="py-2 px-2 text-center">
                                <input
                                  type="number"
                                  value={editForm.meses}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, meses: Number(e.target.value) })
                                  }
                                  min={1}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center"
                                />
                              </td>
                              <td className="py-2 px-2">
                                <MoneyInput
                                  valueCents={Math.round(editForm.valorUnitario * 100)}
                                  onValueChange={(cents) =>
                                    setEditForm({ ...editForm, valorUnitario: cents / 100 })
                                  }
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
                                />
                              </td>
                              <td className="py-2 px-2 text-right font-medium text-gray-700">
                                {formatCurrency(
                                  editForm.quantidade * editForm.meses * editForm.valorUnitario
                                )}
                              </td>
                              <td className="py-2 px-2 text-right text-gray-400">-</td>
                              <td className="py-2 px-2 text-right text-gray-400">-</td>
                              <td className="py-2 px-2 text-right text-gray-400">-</td>
                              <td className="py-2 px-2">
                                <select
                                  value={editForm.metaId || ''}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      metaId: e.target.value || undefined,
                                    })
                                  }
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                >
                                  <option value="">Sem meta vinculada</option>
                                  {metas.map((meta) => (
                                    <option key={meta.id} value={meta.id}>
                                      {meta.numero} - {meta.titulo}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-2 px-2">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => void handleSaveEdit(rubrica.id)}
                                    disabled={isSubmitting}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Salvar"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    disabled={isSubmitting}
                                    className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Cancelar"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-2 px-2 text-gray-900">{item.descricao}</td>
                              <td className="py-2 px-2 text-center text-gray-700">
                                {item.quantidade}
                              </td>
                              <td className="py-2 px-2 text-center text-gray-700">{item.meses}</td>
                              <td className="py-2 px-2 text-right text-gray-700">
                                {formatCurrency(item.valorUnitario)}
                              </td>
                              <td className="py-2 px-2 text-right font-medium text-gray-900">
                                {formatCurrency(item.valorTotal)}
                              </td>
                              <td className="py-2 px-2 text-right">
                                {(() => {
                                  const { debito } = calcularRemanejamentosItem(item.id);
                                  return debito > 0 ? (
                                    <span className="text-red-600 font-medium">
                                      {formatCurrency(debito)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  );
                                })()}
                              </td>
                              <td className="py-2 px-2 text-right">
                                {(() => {
                                  const { credito } = calcularRemanejamentosItem(item.id);
                                  return credito > 0 ? (
                                    <span className="text-green-600 font-medium">
                                      {formatCurrency(credito)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  );
                                })()}
                              </td>
                              <td className="py-2 px-2 text-right">
                                <span className="font-semibold text-blue-600">
                                  {formatCurrency(calcularValorFinalItem(item))}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-gray-700">
                                {item.metaId
                                  ? metas.find((meta) => meta.id === item.metaId)?.titulo ||
                                    item.meta ||
                                    '-'
                                  : item.meta || '-'}
                              </td>
                              <td className="py-2 px-2">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => handleAbrirRemanejamento(item)}
                                    disabled={isSubmitting}
                                    className="p-1 text-[#004225] hover:bg-emerald-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Remanejar"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="lucide lucide-arrow-up-down-icon lucide-arrow-up-down"
                                    >
                                      <path d="m21 16-4 4-4-4" />
                                      <path d="M17 20V4" />
                                      <path d="m3 8 4-4 4 4" />
                                      <path d="M7 4v16" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleStartEdit(item)}
                                    disabled={isSubmitting}
                                    className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Editar"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => void handleRemoveItem(rubrica.id, item.id)}
                                    disabled={isSubmitting}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Remover"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}

                      {addingToRubrica === rubrica.id && (
                        <tr className="bg-blue-50">
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={newItem.descricao || ''}
                              onChange={(e) =>
                                setNewItem({ ...newItem, descricao: e.target.value })
                              }
                              placeholder="Descricao do item"
                              className="w-full px-2 py-1 border border-blue-300 rounded text-sm"
                              autoFocus
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              value={newItem.quantidade || 1}
                              onChange={(e) =>
                                setNewItem({ ...newItem, quantidade: Number(e.target.value) })
                              }
                              min={1}
                              className="w-full px-2 py-1 border border-blue-300 rounded text-sm text-center"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              value={newItem.meses || 1}
                              onChange={(e) =>
                                setNewItem({ ...newItem, meses: Number(e.target.value) })
                              }
                              min={1}
                              className="w-full px-2 py-1 border border-blue-300 rounded text-sm text-center"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <MoneyInput
                              valueCents={Math.round((newItem.valorUnitario || 0) * 100)}
                              onValueChange={(cents) =>
                                setNewItem({ ...newItem, valorUnitario: cents / 100 })
                              }
                              className="w-full px-2 py-1 border border-blue-300 rounded text-sm text-right"
                            />
                          </td>
                          <td className="py-2 px-2 text-right font-medium text-blue-700">
                            {formatCurrency(
                              (newItem.quantidade || 0) *
                                (newItem.meses || 0) *
                                (newItem.valorUnitario || 0)
                            )}
                          </td>
                          <td className="py-2 px-2 text-right text-gray-400">-</td>
                          <td className="py-2 px-2 text-right text-gray-400">-</td>
                          <td className="py-2 px-2 text-right text-gray-400">-</td>
                          <td className="py-2 px-2">
                            <select
                              value={newItem.metaId || ''}
                              onChange={(e) =>
                                setNewItem({ ...newItem, metaId: e.target.value || undefined })
                              }
                              className="w-full px-2 py-1 border border-blue-300 rounded text-sm"
                            >
                              <option value="">Sem meta vinculada</option>
                              {metas.map((meta) => (
                                <option key={meta.id} value={meta.id}>
                                  {meta.numero} - {meta.titulo}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-2">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => void handleAddItem(rubrica.id)}
                                disabled={isSubmitting || !newItem.descricao?.trim()}
                                className="p-1 text-green-600 hover:bg-green-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Adicionar"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setAddingToRubrica(null);
                                  setNewItem({
                                    descricao: '',
                                    quantidade: 1,
                                    meses: 1,
                                    valorUnitario: 0,
                                    metaId: undefined,
                                  });
                                }}
                                disabled={isSubmitting}
                                className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Cancelar"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </ResizableTable>
                )}

                {rubrica.itens.length === 0 && addingToRubrica !== rubrica.id && (
                  <div className="flex justify-center py-2">
                    <button
                      onClick={() => setAddingToRubrica(rubrica.id)}
                      disabled={isSubmitting}
                      className="flex items-center gap-1 px-4 py-2 text-[#004225] hover:bg-emerald-50 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar primeiro item
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mt-6">
        <h4 className="font-medium text-gray-900 mb-3">Resultado por Rubrica</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {rubricas
            .filter((rubrica) => rubrica.itens.length > 0)
            .map((rubrica) => (
              <div key={rubrica.id} className="bg-white p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 font-mono">[{rubrica.codigo}]</p>
                <p className="text-sm font-medium text-gray-700 truncate">{rubrica.nome}</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(calcularTotalRubrica(rubrica))}
                </p>
                <p className="text-xs text-gray-500">{rubrica.itens.length} itens</p>
              </div>
            ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-300 flex justify-end">
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Geral de Rubricas</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(calcularTotalGeral())}</p>
          </div>
        </div>
      </div>

      {itemParaRemanejamento && (
        <RemanejamentoModal
          isOpen={remanejamentoModalOpen}
          onClose={() => {
            setRemanejamentoModalOpen(false);
            setItemParaRemanejamento(null);
          }}
          onConfirm={handleConfirmarRemanejamento}
          itemOrigem={itemParaRemanejamento}
          rubricas={rubricas}
          contratoId={contratoId}
        />
      )}

      <HistoricoRemanejamentos
        isOpen={historicoModalOpen}
        onClose={() => setHistoricoModalOpen(false)}
        remanejamentos={remanejamentosComDados}
        contratoId={contratoId}
      />
    </div>
  );
}
