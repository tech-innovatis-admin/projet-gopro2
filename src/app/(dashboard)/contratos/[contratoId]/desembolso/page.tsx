"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Edit,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
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

const PAGE_SIZE = 20;
const MAX_PAGE_REQUESTS = 1000;
const DEFAULT_MAX_DISBURSEMENT_VALUE = 9999999999999.99;
const configuredMaxDisbursementValue = Number(process.env.NEXT_PUBLIC_PROJECT_MAX_CONTRACT_VALUE);
const MAX_DISBURSEMENT_VALUE =
  Number.isFinite(configuredMaxDisbursementValue) && configuredMaxDisbursementValue > 0
    ? configuredMaxDisbursementValue
    : DEFAULT_MAX_DISBURSEMENT_VALUE;

const statusOptions: { value: StatusDisbursementScheduleEnum; label: string; color: string }[] = [
  { value: "PREVISTO", label: "Previsto", color: "bg-gray-100 text-gray-800" },
  { value: "PARCIAL", label: "Parcial", color: "bg-blue-100 text-blue-800" },
  { value: "RECEBIDO", label: "Recebido", color: "bg-green-100 text-green-800" },
  { value: "CANCELADO", label: "Cancelado", color: "bg-red-100 text-red-800" },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "-";
  const date = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(date.getTime()) ? dateStr : date.toLocaleDateString("pt-BR");
};

const parseNumber = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const isValidISODate = (value: string) => {
  if (!value) return false;
  const d = new Date(`${value}T00:00:00`);
  return !Number.isNaN(d.getTime());
};

const getStatusLabel = (status: StatusDisbursementScheduleEnum): string =>
  statusOptions.find((opt) => opt.value === status)?.label || status;

const getStatusColor = (status: StatusDisbursementScheduleEnum): string =>
  statusOptions.find((opt) => opt.value === status)?.color || "bg-gray-100 text-gray-800";

const isPersistedId = (id: string) => /^\d+$/.test(id);
const toPersistedId = (id: string) => Number.parseInt(id, 10);

const copyParcelas = (items: ParcelaPrevista[]) => items.map((item) => ({ ...item }));

function StatusBadge({ status }: { status: StatusDisbursementScheduleEnum }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function sortAndRenumber(items: ParcelaPrevista[]) {
  return [...items]
    .sort((a, b) => a.numero - b.numero)
    .map((item, idx) => ({ ...item, numero: idx + 1 }));
}

function createDraftParcela(nextNumero: number): ParcelaPrevista {
  return {
    id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    numero: nextNumero,
    dataPrevista: "",
    valorPrevisto: 0,
    status: "PREVISTO",
    observacao: "",
  };
}

function toOptionalText(value?: string) {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
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
  const [isEditing, setIsEditing] = useState(false);
  const [parcelas, setParcelas] = useState<ParcelaPrevista[]>([]);
  const [editParcelas, setEditParcelas] = useState<ParcelaPrevista[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [canManageChildren, setCanManageChildren] = useState(false);

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

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    const projectId = Number.parseInt(contratoId, 10);
    if (!Number.isFinite(projectId)) {
      setParcelas([]);
      setEditParcelas([]);
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

      const projectSchedules = allSchedules
        .map<ParcelaPrevista>((schedule) => ({
          id: String(schedule.id),
          numero: schedule.numero,
          dataPrevista: schedule.expectedMonth,
          valorPrevisto: parseNumber(schedule.expectedAmount),
          status: schedule.status,
          observacao: schedule.notes || "",
        }));

      const normalized = sortAndRenumber(projectSchedules);
      setParcelas(normalized);
      setEditParcelas(copyParcelas(normalized));
      setProjectCode(project?.code || `PROJ-${projectId}`);
      setValorTotalContrato(parseNumber(project?.contractValue));
      setIsEditing(false);
    } catch (error) {
      const message = toErrorMessage(error, "Não foi possível carregar os desembolsos.");
      setLoadError(message);
      setParcelas([]);
      setEditParcelas([]);
    } finally {
      setIsLoading(false);
    }
  }, [contratoId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const validateParcela = (p: ParcelaPrevista) =>
    Boolean(p.dataPrevista && isValidISODate(p.dataPrevista) && parseNumber(p.valorPrevisto) > 0);

  const currentParcelas = isEditing ? editParcelas : parcelas;
  const totalPrevisto = currentParcelas.reduce((acc, p) => acc + parseNumber(p.valorPrevisto), 0);
  const restante = Math.max(valorTotalContrato - totalPrevisto, 0);
  const excedente = Math.max(totalPrevisto - valorTotalContrato, 0);
  const percentualPrevisto =
    valorTotalContrato > 0 ? (totalPrevisto / valorTotalContrato) * 100 : 0;
  const maxParcelValue = valorTotalContrato > 0
    ? Math.min(valorTotalContrato, MAX_DISBURSEMENT_VALUE)
    : MAX_DISBURSEMENT_VALUE;
  const maxParcelValueCents = Math.round(maxParcelValue * 100);

  const canSave = useMemo(() => {
    if (!isEditing) return true;
    return editParcelas.every(validateParcela);
  }, [editParcelas, isEditing]);

  const handleEdit = () => {
    if (!canManageChildren) return;
    setSaveError(null);
    setSavedMessage(false);
    setEditParcelas(copyParcelas(parcelas));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setSaveError(null);
    setEditParcelas(copyParcelas(parcelas));
    setIsEditing(false);
  };

  const handleNovaParcela = () => {
    if (!canManageChildren) return;
    setSaveError(null);
    if (!isEditing) {
      setEditParcelas(copyParcelas(parcelas));
      setIsEditing(true);
    }
    setEditParcelas((prev) => sortAndRenumber([...prev, createDraftParcela(prev.length + 1)]));
  };

  const handleChangeParcela = (
    id: string,
    updates: Partial<Pick<ParcelaPrevista, "dataPrevista" | "valorPrevisto" | "status" | "observacao">>
  ) => {
    setEditParcelas((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const handleRemove = (id: string) => {
    if (!canManageChildren) return;
    if (!confirm("Deseja realmente remover esta parcela?")) return;
    setEditParcelas((prev) => sortAndRenumber(prev.filter((p) => p.id !== id)));
  };

  const handleSave = async () => {
    if (!canManageChildren) return;
    if (!canSave) return;

    const projectId = Number.parseInt(contratoId, 10);
    if (!Number.isFinite(projectId)) {
      setSaveError("ID do contrato inválido para salvar desembolsos.");
      return;
    }

    const normalizedEdit = sortAndRenumber(copyParcelas(editParcelas));
    const invalidRow = normalizedEdit.find((p) => !validateParcela(p));
    if (invalidRow) {
      setSaveError(`Parcela ${invalidRow.numero} inválida. Verifique data e valor.`);
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const previous = sortAndRenumber(copyParcelas(parcelas));
      const nextPersistedIds = new Set(
        normalizedEdit.filter((p) => isPersistedId(p.id)).map((p) => toPersistedId(p.id))
      );

      for (const oldParcela of previous) {
        if (!isPersistedId(oldParcela.id)) continue;
        const oldId = toPersistedId(oldParcela.id);
        if (!nextPersistedIds.has(oldId)) {
          await deleteDisbursementSchedule(oldId);
        }
      }

      for (const parcela of normalizedEdit) {
        const payload = {
          projectId,
          numero: parcela.numero,
          expectedMonth: parcela.dataPrevista,
          expectedAmount: parseNumber(parcela.valorPrevisto),
          status: parcela.status,
          notes: toOptionalText(parcela.observacao),
        };

        if (isPersistedId(parcela.id)) {
          await updateDisbursementSchedule(toPersistedId(parcela.id), payload);
        } else {
          await createDisbursementSchedule(payload);
        }
      }

      await loadData();
      setIsEditing(false);
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 2500);
    } catch (error) {
      const message = toErrorMessage(error, "Não foi possível salvar os desembolsos.");
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Cronograma de Desembolso</h2>
          <p className="text-sm text-gray-500">
            Cadastre os desembolsos previstos para recebimento do valor total do projeto.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {savedMessage && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              Salvo com sucesso!
            </div>
          )}

          {canManageChildren && (
            <button
              onClick={handleNovaParcela}
              disabled={isLoading || isSaving || loadingAccess}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Novo Desembolso
            </button>
          )}

          {!isEditing && canManageChildren ? (
            <button
              onClick={handleEdit}
              disabled={isLoading || !!loadError || loadingAccess}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors disabled:opacity-50"
            >
              <Edit className="h-4 w-4" />
              Editar
            </button>
          ) : isEditing && canManageChildren ? (
            <>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !canSave}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Salvando..." : "Salvar"}
              </button>
            </>
          ) : null}
        </div>
      </div>

      {!loadingAccess && !canManageChildren && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Perfil em modo leitura neste modulo. O estagiario pode consultar os desembolsos, mas não pode criar ou alterar parcelas.
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

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Valor Total do Projeto</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(valorTotalContrato)}</p>
          <p className="text-xs text-gray-400 mt-1">Contrato: {projectCode || "-"}</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Desembolsos</p>
          <p className="text-2xl font-bold text-gray-900">{currentParcelas.length}</p>
          <p className="text-xs text-gray-400 mt-1">Quantidade prevista</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Total Previsto</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPrevisto)}</p>
          <p className="text-xs text-gray-400 mt-1">Somatório do cronograma</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">{excedente > 0 ? "Excedente" : "Restante"}</p>
          <p className={`text-2xl font-bold ${excedente > 0 ? "text-red-600" : "text-[#004225]"}`}>
            {formatCurrency(excedente > 0 ? excedente : restante)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {excedente > 0 ? "Ultrapassa o total" : "Falta para fechar"}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">% Previsto</p>
          <p className={`text-2xl font-bold ${excedente > 0 ? "text-red-600" : "text-[#004225]"}`}>
            {percentualPrevisto.toFixed(1)}%
          </p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className={`${excedente > 0 ? "bg-red-600" : "bg-[#004225]"} h-2 rounded-full transition-all`}
              style={{ width: `${Math.min(percentualPrevisto, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {currentParcelas.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Nenhuma parcela cadastrada</p>
          <p className="text-gray-500 text-sm mt-1">
            Cadastre os desembolsos previstos para recebimento do valor total do projeto.
          </p>
        </div>
      ) : (
        <ResizableTable
          columnCount={isEditing ? 7 : 6}
          defaultWidths={[110, 160, 180, 140, 140, 320, ...(isEditing ? [120] : [])]}
          minColumnWidth={90}
        >
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-center py-3 px-4 font-medium text-gray-600">Desembolso</th>
              <th className="text-center py-3 px-4 font-medium text-gray-600">Data prevista</th>
              <th className="text-center py-3 px-4 font-medium text-gray-600">Valor previsto</th>
              <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
              <th className="text-center py-3 px-4 font-medium text-gray-600">% do total</th>
              <th className="text-center py-3 px-4 font-medium text-gray-600">Observação</th>
              {isEditing && <th className="text-center py-3 px-4 font-medium text-gray-600">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {currentParcelas.map((parcela) => {
              const parcelaPercentual =
                valorTotalContrato > 0 ? (parcela.valorPrevisto / valorTotalContrato) * 100 : 0;
              const isParcelaValid = validateParcela(parcela);

              return (
                <tr key={parcela.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-500 text-center">{parcela.numero}o</td>
                  <td className="py-3 px-4 text-center">
                    {isEditing ? (
                      <DatePicker
                        value={parcela.dataPrevista || ""}
                        onChange={(value) => handleChangeParcela(parcela.id, { dataPrevista: value })}
                        placeholder="Selecione a data"
                        className="w-full"
                      />
                    ) : (
                      <span className="text-gray-700">{formatDate(parcela.dataPrevista)}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {isEditing ? (
                      <MoneyInput
                        valueCents={Math.round(parcela.valorPrevisto * 100)}
                        onValueChange={(cents) =>
                          handleChangeParcela(parcela.id, { valorPrevisto: cents / 100 })
                        }
                        maxCents={maxParcelValueCents}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center"
                        placeholder="R$ 0,00"
                      />
                    ) : (
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(parcela.valorPrevisto)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {isEditing ? (
                      <select
                        value={parcela.status}
                        onChange={(e) =>
                          handleChangeParcela(parcela.id, {
                            status: e.target.value as StatusDisbursementScheduleEnum,
                          })
                        }
                        className="px-2 py-1 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#004225]/20"
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <StatusBadge status={parcela.status} />
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-gray-700 font-medium">
                    {valorTotalContrato > 0 ? `${parcelaPercentual.toFixed(1)}%` : "-"}
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {isEditing ? (
                      <input
                        type="text"
                        value={parcela.observacao || ""}
                        onChange={(e) =>
                          handleChangeParcela(parcela.id, { observacao: e.target.value })
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Opcional"
                      />
                    ) : parcela.observacao ? (
                      parcela.observacao
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                    {isEditing && !isParcelaValid && (
                      <p className="text-xs text-red-600 mt-1">
                        Preencha data prevista e valor maior que zero.
                      </p>
                    )}
                  </td>
                  {isEditing && (
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleRemove(parcela.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
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
              <td colSpan={2} className="py-3 px-4 text-right text-gray-600">
                Totais:
              </td>
              <td className="py-3 px-4 text-center text-gray-900">{formatCurrency(totalPrevisto)}</td>
              <td className="py-3 px-4 text-center text-gray-500">-</td>
              <td className="py-3 px-4 text-center text-gray-700">
                {valorTotalContrato > 0 ? `${Math.min(percentualPrevisto, 999).toFixed(1)}%` : "-"}
              </td>
              <td className="py-3 px-4 text-left text-gray-500">
                {excedente > 0
                  ? `Excede em ${formatCurrency(excedente)}`
                  : restante > 0
                  ? `Falta ${formatCurrency(restante)}`
                  : "Fechado"}
              </td>
              {isEditing && <td />}
            </tr>
          </tfoot>
        </ResizableTable>
      )}

      {isEditing && !canSave && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-amber-700 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              Existem desembolsos com informações inválidas.
            </p>
            <p className="text-xs text-amber-800 mt-1">
              Verifique: data prevista e valor previsto maior que zero.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
