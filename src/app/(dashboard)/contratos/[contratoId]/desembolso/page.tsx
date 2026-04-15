"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Calendar,
  CheckCircle,
  Edit,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { AppModalShell } from "@/components/ui/app-modal-shell";
import { ResizableTable } from "@/components/ui/resizable-table";
import { DatePicker } from "@/components/ui/DatePicker";
import { MoneyInput } from "./_components/MoneyImput";
import {
  createDisbursementSchedule,
  deleteDisbursementSchedule,
  getProjectById,
  listDisbursementSchedules,
  updateDisbursementSchedule,
} from "@/src/lib/api/endpoints";
import { canManageContractChildren, fetchCurrentUser } from "@/src/lib/auth/session";
import { type StatusDisbursementScheduleEnum } from "@/src/lib/api/types";
import { getUserErrorMessage } from "@/src/lib/feedback/user-messages";

type ParcelaPrevista = {
  id: string;
  numero: number;
  dataPrevista: string;
  valorPrevisto: number;
  status: StatusDisbursementScheduleEnum;
  observacao?: string;
};

type ParcelaModalDraft = {
  dataPrevista: string;
  valorPrevistoCents: number;
  status: StatusDisbursementScheduleEnum;
  observacao: string;
};

type ParcelaModalState =
  | {
      mode: "create" | "edit";
      numero: number;
      parcelaId?: string;
    }
  | null;

type ParcelaCreatedConfirmationState =
  | {
      numero: number;
    }
  | null;

const PAGE_SIZE = 20;
const MAX_PAGE_REQUESTS = 1000;
const DEFAULT_MAX_DISBURSEMENT_VALUE = 9999999999999.99;
const configuredMaxDisbursementValue = Number(
  process.env.NEXT_PUBLIC_PROJECT_MAX_CONTRACT_VALUE
);
const MAX_DISBURSEMENT_VALUE =
  Number.isFinite(configuredMaxDisbursementValue) && configuredMaxDisbursementValue > 0
    ? configuredMaxDisbursementValue
    : DEFAULT_MAX_DISBURSEMENT_VALUE;

const statusOptions: {
  value: StatusDisbursementScheduleEnum;
  label: string;
  color: string;
}[] = [
  { value: "PREVISTO", label: "Previsto", color: "bg-gray-100 text-gray-800" },
  { value: "PARCIAL", label: "Parcial", color: "bg-blue-100 text-blue-800" },
  { value: "RECEBIDO", label: "Recebido", color: "bg-green-100 text-green-800" },
  { value: "CANCELADO", label: "Cancelado", color: "bg-red-100 text-red-800" },
];

const EMPTY_PARCELA_MODAL_DRAFT: ParcelaModalDraft = {
  dataPrevista: "",
  valorPrevistoCents: 0,
  status: "PREVISTO",
  observacao: "",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "-";
  const date = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(date.getTime()) ? dateStr : date.toLocaleDateString("pt-BR");
};

const parseNumber = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeCurrencyNumber = (value: unknown) =>
  Math.round(parseNumber(value) * 100) / 100;

const currencyNumberToCents = (value: unknown) =>
  Math.round(normalizeCurrencyNumber(value) * 100);

const isValidISODate = (value: string) => {
  if (!value) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime());
};

const getStatusLabel = (status: StatusDisbursementScheduleEnum): string =>
  statusOptions.find((option) => option.value === status)?.label || status;

const getStatusColor = (status: StatusDisbursementScheduleEnum): string =>
  statusOptions.find((option) => option.value === status)?.color || "bg-gray-100 text-gray-800";

const isPersistedId = (id: string) => /^\d+$/.test(id);
const toPersistedId = (id: string) => Number.parseInt(id, 10);

function StatusBadge({ status }: { status: StatusDisbursementScheduleEnum }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
        status
      )}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function sortAndRenumber(items: ParcelaPrevista[]) {
  return [...items]
    .sort((a, b) => a.numero - b.numero)
    .map((item, index) => ({ ...item, numero: index + 1 }));
}

function createEmptyParcelaModalDraft(): ParcelaModalDraft {
  return { ...EMPTY_PARCELA_MODAL_DRAFT };
}

function toOptionalText(value?: string) {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function validateParcelaDraft(draft: ParcelaModalDraft) {
  if (!draft.dataPrevista || !isValidISODate(draft.dataPrevista)) {
    return "Informe uma data prevista válida.";
  }

  if (draft.valorPrevistoCents <= 0) {
    return "Informe um valor previsto maior que zero.";
  }

  return null;
}

async function fetchAllDisbursementSchedules(projectId: number) {
  const all = [];
  let page = 0;
  let requests = 0;

  while (requests < MAX_PAGE_REQUESTS) {
    requests += 1;
    const response = await listDisbursementSchedules({ page, size: PAGE_SIZE, projectId });
    all.push(...response.content);
    if (response.last) break;
    page += 1;
  }

  return all;
}

function toErrorMessage(error: unknown, fallback: string) {
  return getUserErrorMessage(error, fallback);
}

export default function DesembolsoPage() {
  const params = useParams();
  const contratoId = params.contratoId as string;

  const [projectCode, setProjectCode] = useState("");
  const [valorTotalContrato, setValorTotalContrato] = useState(0);
  const [parcelas, setParcelas] = useState<ParcelaPrevista[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [canManageChildren, setCanManageChildren] = useState(false);
  const [parcelaModalState, setParcelaModalState] = useState<ParcelaModalState>(null);
  const [parcelaModalDraft, setParcelaModalDraft] = useState<ParcelaModalDraft>(
    createEmptyParcelaModalDraft()
  );
  const [parcelaModalError, setParcelaModalError] = useState<string | null>(null);
  const [parcelaCreatedConfirmation, setParcelaCreatedConfirmation] =
    useState<ParcelaCreatedConfirmationState>(null);
  const [parcelaPendingDeletion, setParcelaPendingDeletion] = useState<ParcelaPrevista | null>(
    null
  );

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

  const flashSavedMessage = useCallback(() => {
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2500);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    const projectId = Number.parseInt(contratoId, 10);
    if (!Number.isFinite(projectId)) {
      setParcelas([]);
      setProjectCode("");
      setValorTotalContrato(0);
      setLoadError("ID do contrato inválido para carregar desembolsos.");
      setIsLoading(false);
      return;
    }

    try {
      const [project, allSchedules] = await Promise.all([
        getProjectById(projectId).catch(() => null),
        fetchAllDisbursementSchedules(projectId),
      ]);

      const projectSchedules = allSchedules.map<ParcelaPrevista>((schedule) => ({
        id: String(schedule.id),
        numero: schedule.numero,
        dataPrevista: schedule.expectedMonth,
        valorPrevisto: normalizeCurrencyNumber(schedule.expectedAmount),
        status: schedule.status,
        observacao: schedule.notes || "",
      }));

      const normalized = sortAndRenumber(projectSchedules);
      setParcelas(normalized);
      setProjectCode(project?.code || `PROJ-${projectId}`);
      setValorTotalContrato(normalizeCurrencyNumber(project?.contractValue));
    } catch (error) {
      setLoadError(toErrorMessage(error, "Não foi possível carregar os desembolsos."));
      setParcelas([]);
    } finally {
      setIsLoading(false);
    }
  }, [contratoId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const valorTotalContratoCents = currencyNumberToCents(valorTotalContrato);
  const totalPrevistoCents = parcelas.reduce(
    (total, parcela) => total + currencyNumberToCents(parcela.valorPrevisto),
    0
  );
  const balanceDifferenceCents = valorTotalContratoCents - totalPrevistoCents;
  const totalPrevisto = totalPrevistoCents / 100;
  const restante = balanceDifferenceCents > 0 ? balanceDifferenceCents / 100 : 0;
  const excedente = balanceDifferenceCents < 0 ? Math.abs(balanceDifferenceCents) / 100 : 0;
  const percentualPrevisto =
    valorTotalContratoCents > 0 ? (totalPrevistoCents / valorTotalContratoCents) * 100 : 0;
  const maxParcelValue =
    valorTotalContrato > 0
      ? Math.min(valorTotalContrato, MAX_DISBURSEMENT_VALUE)
      : MAX_DISBURSEMENT_VALUE;
  const maxParcelValueCents = Math.round(maxParcelValue * 100);
  const parcelaModalDescription =
    parcelaModalState?.mode === "edit"
      ? "Atualize os dados do desembolso e salve diretamente por este modal."
      : "Cadastre um novo desembolso previsto e salve diretamente por este modal.";

  const openCreateParcelaModal = () => {
    if (!canManageChildren) return;
    setSaveError(null);
    setSavedMessage(false);
    setParcelaModalError(null);
    setParcelaModalDraft(createEmptyParcelaModalDraft());
    setParcelaModalState({
      mode: "create",
      numero: parcelas.length + 1,
    });
  };

  const openEditParcelaModal = (parcela: ParcelaPrevista) => {
    if (!canManageChildren) return;
    setSaveError(null);
    setSavedMessage(false);
    setParcelaModalError(null);
    setParcelaModalDraft({
      dataPrevista: parcela.dataPrevista ?? "",
      valorPrevistoCents: Math.round(parseNumber(parcela.valorPrevisto) * 100),
      status: parcela.status,
      observacao: parcela.observacao ?? "",
    });
    setParcelaModalState({
      mode: "edit",
      numero: parcela.numero,
      parcelaId: parcela.id,
    });
  };

  const closeParcelaModal = () => {
    setParcelaModalState(null);
    setParcelaModalError(null);
    setParcelaModalDraft(createEmptyParcelaModalDraft());
  };

  const closeParcelaCreatedConfirmation = () => {
    setParcelaCreatedConfirmation(null);
  };

  const handleContinueCreatingParcela = () => {
    setParcelaCreatedConfirmation(null);
    openCreateParcelaModal();
  };

  const saveParcelaModal = async () => {
    if (!canManageChildren || !parcelaModalState) return;

    const validationError = validateParcelaDraft(parcelaModalDraft);
    if (validationError) {
      setParcelaModalError(validationError);
      return;
    }

    const projectId = Number.parseInt(contratoId, 10);
    if (!Number.isFinite(projectId)) {
      setParcelaModalError("ID do contrato inválido para salvar o desembolso.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setParcelaModalError(null);

    try {
      const isCreateMode = parcelaModalState.mode === "create";
      const createdNumero = parcelaModalState.numero;
      const payloadBase = {
        projectId,
        expectedMonth: parcelaModalDraft.dataPrevista,
        expectedAmount: parcelaModalDraft.valorPrevistoCents / 100,
        status: parcelaModalDraft.status,
        notes: toOptionalText(parcelaModalDraft.observacao),
      };

      if (parcelaModalState.mode === "edit") {
        const parcelaAtual = parcelas.find((item) => item.id === parcelaModalState.parcelaId);
        if (!parcelaAtual || !isPersistedId(parcelaAtual.id)) {
          setParcelaModalError("Não foi possível localizar o desembolso para atualizar.");
          return;
        }

        await updateDisbursementSchedule(toPersistedId(parcelaAtual.id), {
          ...payloadBase,
          numero: parcelaAtual.numero,
        });
      } else {
        await createDisbursementSchedule({
          ...payloadBase,
          numero: parcelaModalState.numero,
        });
      }

      await loadData();
      closeParcelaModal();
      if (isCreateMode) {
        setParcelaCreatedConfirmation({ numero: createdNumero });
      } else {
        flashSavedMessage();
      }
    } catch (error) {
      setParcelaModalError(toErrorMessage(error, "Não foi possível salvar o desembolso."));
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteParcelaModal = (parcela: ParcelaPrevista) => {
    if (!canManageChildren) return;
    setSaveError(null);
    setSavedMessage(false);
    setParcelaPendingDeletion(parcela);
  };

  const closeDeleteParcelaModal = () => {
    setParcelaPendingDeletion(null);
  };

  const confirmDeleteParcela = async () => {
    if (!canManageChildren || !parcelaPendingDeletion) return;

    if (!isPersistedId(parcelaPendingDeletion.id)) {
      setSaveError("Não foi possível localizar o desembolso para exclusão.");
      setParcelaPendingDeletion(null);
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await deleteDisbursementSchedule(toPersistedId(parcelaPendingDeletion.id));
      setParcelaPendingDeletion(null);
      await loadData();
      flashSavedMessage();
    } catch (error) {
      setSaveError(toErrorMessage(error, "Não foi possível excluir o desembolso."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Cronograma de Desembolso</h2>
          <p className="text-sm text-gray-500">
            Cadastre os desembolsos previstos para recebimento do valor total do projeto.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {savedMessage && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-1.5 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Salvo com sucesso!
            </div>
          )}

          {canManageChildren && (
            <button
              type="button"
              onClick={openCreateParcelaModal}
              disabled={isLoading || isSaving || loadingAccess}
              className="inline-flex items-center gap-2 rounded-lg bg-[#004225] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#003319] disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Novo Desembolso
            </button>
          )}
        </div>
      </div>

      {!loadingAccess && !canManageChildren && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Perfil em modo leitura neste módulo. O estagiário pode consultar os desembolsos, mas
          não pode criar ou alterar parcelas.
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

      {saveError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {saveError}
        </div>
      )}

      {isLoading && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Carregando desembolsos...
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-sm text-gray-500">Valor Total do Projeto</p>
          <p className="mt-1 whitespace-nowrap pr-1 text-[clamp(0.95rem,1.2vw,1.35rem)] font-bold leading-tight tracking-tight text-gray-900">
            {formatCurrency(valorTotalContrato)}
          </p>
          <p className="mt-1 min-w-0 truncate text-xs text-gray-400">
            Contrato: {projectCode || "-"}
          </p>
        </div>

        <div className="min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-sm text-gray-500">Desembolsos</p>
          <p className="mt-1 whitespace-nowrap pr-1 text-[clamp(0.95rem,1.2vw,1.35rem)] font-bold leading-tight tracking-tight text-gray-900">
            {parcelas.length}
          </p>
          <p className="mt-1 text-xs text-gray-400">Quantidade prevista</p>
        </div>

        <div className="min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Previsto</p>
          <p className="mt-1 whitespace-nowrap pr-1 text-[clamp(0.95rem,1.2vw,1.35rem)] font-bold leading-tight tracking-tight text-gray-900">
            {formatCurrency(totalPrevisto)}
          </p>
          <p className="mt-1 text-xs text-gray-400">Somatório do cronograma</p>
        </div>

        <div className="min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-sm text-gray-500">{excedente > 0 ? "Excedente" : "Restante"}</p>
          <p
            className={`mt-1 whitespace-nowrap pr-1 text-[clamp(0.95rem,1.2vw,1.35rem)] font-bold leading-tight tracking-tight ${
              excedente > 0 ? "text-red-600" : "text-[#004225]"
            }`}
          >
            {formatCurrency(excedente > 0 ? excedente : restante)}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {excedente > 0 ? "Ultrapassa o total" : "Falta para fechar"}
          </p>
        </div>

        <div className="min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-sm text-gray-500">% Previsto</p>
          <p
            className={`mt-1 whitespace-nowrap pr-1 text-[clamp(0.95rem,1.2vw,1.35rem)] font-bold leading-tight tracking-tight ${
              excedente > 0 ? "text-red-600" : "text-[#004225]"
            }`}
          >
            {percentualPrevisto.toFixed(1)}%
          </p>
          <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
            <div
              className={`h-2 rounded-full transition-all ${
                excedente > 0 ? "bg-red-600" : "bg-[#004225]"
              }`}
              style={{ width: `${Math.min(percentualPrevisto, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {parcelas.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 py-12 text-center">
          <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <p className="font-medium text-gray-700">Nenhuma parcela cadastrada</p>
          <p className="mt-1 text-sm text-gray-500">
            Cadastre os desembolsos previstos para recebimento do valor total do projeto.
          </p>
          {canManageChildren && (
            <button
              type="button"
              onClick={openCreateParcelaModal}
              disabled={isSaving || loadingAccess}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#004225] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#003319] disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Criar primeiro desembolso
            </button>
          )}
        </div>
      ) : (
        <ResizableTable
          columnCount={canManageChildren ? 7 : 6}
          defaultWidths={[110, 160, 180, 140, 140, 320, ...(canManageChildren ? [120] : [])]}
          minColumnWidth={90}
        >
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-center font-medium text-gray-600">Desembolso</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Data prevista</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Valor previsto</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">% do total</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Observação</th>
              {canManageChildren && (
                <th className="px-4 py-3 text-center font-medium text-gray-600">Ações</th>
              )}
            </tr>
          </thead>
          <tbody>
            {parcelas.map((parcela) => {
              const parcelaPercentual =
                valorTotalContratoCents > 0
                  ? (currencyNumberToCents(parcela.valorPrevisto) / valorTotalContratoCents) * 100
                  : 0;

              return (
                <tr key={parcela.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-center font-medium text-gray-500">
                    {parcela.numero}°
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {formatDate(parcela.dataPrevista)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(parcela.valorPrevisto)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={parcela.status} />
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-gray-700">
                    {valorTotalContrato > 0 ? `${parcelaPercentual.toFixed(1)}%` : "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {parcela.observacao ? (
                      <span className="line-clamp-2">{parcela.observacao}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  {canManageChildren && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditParcelaModal(parcela)}
                          disabled={isSaving}
                          className="rounded p-1 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
                          title="Editar desembolso"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteParcelaModal(parcela)}
                          disabled={isSaving}
                          className="rounded p-1 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                          title="Excluir desembolso"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-medium">
              <td colSpan={2} className="px-4 py-3 text-right text-gray-600">
                Totais:
              </td>
              <td className="px-4 py-3 text-center text-gray-900">
                {formatCurrency(totalPrevisto)}
              </td>
              <td className="px-4 py-3 text-center text-gray-500">-</td>
              <td className="px-4 py-3 text-center text-gray-700">
                {valorTotalContrato > 0 ? `${Math.min(percentualPrevisto, 999).toFixed(1)}%` : "-"}
              </td>
              <td className="px-4 py-3 text-left text-gray-500">
                {excedente > 0
                  ? `Excede em ${formatCurrency(excedente)}`
                  : restante > 0
                    ? `Falta ${formatCurrency(restante)}`
                    : "Fechado"}
              </td>
              {canManageChildren && <td />}
            </tr>
          </tfoot>
        </ResizableTable>
      )}

      <AppModalShell
        isOpen={Boolean(parcelaModalState)}
        title={parcelaModalState?.mode === "edit" ? "Editar desembolso" : "Novo desembolso"}
        description={parcelaModalDescription}
        icon={<Calendar className="h-5 w-5" />}
        tone="neutral"
        onClose={closeParcelaModal}
        closeDisabled={isSaving}
        maxWidthClassName="max-w-2xl"
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeParcelaModal}
              disabled={isSaving}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="parcela-modal-form"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-900 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSaving
                ? "Salvando..."
                : parcelaModalState?.mode === "edit"
                  ? "Salvar desembolso"
                  : "Criar desembolso"}
            </button>
          </div>
        }
      >
        {parcelaModalState && (
          <form
            id="parcela-modal-form"
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void saveParcelaModal();
            }}
          >
            <div className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
                Estrutura vinculada
              </p>
              <p className="mt-1 font-medium text-slate-900">
                Contrato {projectCode || "-"} • Desembolso {parcelaModalState.numero}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {parcelaModalState.mode === "edit"
                  ? "As alterações deste desembolso serão salvas diretamente."
                  : "O novo desembolso será criado diretamente no cronograma."}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Data prevista
                </label>
                <DatePicker
                  value={parcelaModalDraft.dataPrevista}
                  onChange={(value) =>
                    setParcelaModalDraft((prev) => ({
                      ...prev,
                      dataPrevista: value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Status</label>
                <select
                  value={parcelaModalDraft.status}
                  onChange={(event) =>
                    setParcelaModalDraft((prev) => ({
                      ...prev,
                      status: event.target.value as StatusDisbursementScheduleEnum,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-500/15"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Valor previsto
                </label>
                <MoneyInput
                  valueCents={parcelaModalDraft.valorPrevistoCents}
                  onValueChange={(nextCents) =>
                    setParcelaModalDraft((prev) => ({
                      ...prev,
                      valorPrevistoCents: nextCents,
                    }))
                  }
                  maxCents={maxParcelValueCents}
                  placeholder="R$ 0,00"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-500/15"
                />
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>
                    Valor informado: {formatCurrency(parcelaModalDraft.valorPrevistoCents / 100)}
                  </span>
                  <span>Limite do contrato: {formatCurrency(maxParcelValueCents / 100)}</span>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Observação
                </label>
                <textarea
                  value={parcelaModalDraft.observacao}
                  onChange={(event) =>
                    setParcelaModalDraft((prev) => ({
                      ...prev,
                      observacao: event.target.value,
                    }))
                  }
                  placeholder="Detalhes adicionais deste desembolso."
                  rows={4}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/15"
                />
              </div>
            </div>

            {parcelaModalError && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {parcelaModalError}
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Ao confirmar este modal, o desembolso será salvo imediatamente.
            </div>
          </form>
        )}
      </AppModalShell>

      <AppModalShell
        isOpen={Boolean(parcelaCreatedConfirmation)}
        title="Desembolso criado"
        description="O desembolso foi cadastrado com sucesso."
        icon={<CheckCircle className="h-5 w-5" />}
        tone="brand"
        onClose={closeParcelaCreatedConfirmation}
        maxWidthClassName="max-w-lg"
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeParcelaCreatedConfirmation}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Ver desembolsos
            </button>
            <button
              type="button"
              onClick={handleContinueCreatingParcela}
              className="inline-flex items-center gap-2 rounded-xl bg-[#004225] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#003319]"
            >
              <Plus className="h-4 w-4" />
              Continuar cadastrando
            </button>
          </div>
        }
      >
        {parcelaCreatedConfirmation && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-sm font-medium text-emerald-800">
                Desembolso {parcelaCreatedConfirmation.numero} cadastrado com sucesso.
              </p>
              <p className="mt-1 text-sm text-emerald-700">
                Você pode continuar cadastrando novas parcelas ou voltar para a lista.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Contrato vinculado
              </p>
              <p className="mt-1 font-medium text-slate-900">Contrato {projectCode || "-"}</p>
            </div>
          </div>
        )}
      </AppModalShell>

      <AppModalShell
        isOpen={Boolean(parcelaPendingDeletion)}
        title="Excluir desembolso"
        description="Confirme a exclusão do desembolso antes de continuar."
        icon={<Trash2 className="h-5 w-5" />}
        tone="danger"
        onClose={closeDeleteParcelaModal}
        closeDisabled={isSaving}
        maxWidthClassName="max-w-lg"
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeDeleteParcelaModal}
              disabled={isSaving}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                void confirmDeleteParcela();
              }}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {isSaving ? "Excluindo..." : "Excluir desembolso"}
            </button>
          </div>
        }
      >
        {parcelaPendingDeletion && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-800">
                Tem certeza de que deseja excluir este desembolso?
              </p>
              <p className="mt-1 text-sm text-red-700">
                Esta ação remove a parcela do cronograma e não pode ser desfeita.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Desembolso selecionado
              </p>
              <p className="mt-1 font-medium text-slate-900">
                Contrato {projectCode || "-"} • Desembolso {parcelaPendingDeletion.numero}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {formatDate(parcelaPendingDeletion.dataPrevista)} •{" "}
                {formatCurrency(parcelaPendingDeletion.valorPrevisto)}
              </p>
            </div>
          </div>
        )}
      </AppModalShell>
    </div>
  );
}
