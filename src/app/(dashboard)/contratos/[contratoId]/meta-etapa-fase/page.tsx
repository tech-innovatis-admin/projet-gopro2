"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Save,
  X,
  CheckCircle,
  CalendarClock,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Crosshair,
  Milestone,
  Flag,
  Edit2,
  Check,
} from "lucide-react";
import { AppModalShell } from "@/components/ui/app-modal-shell";
import { DatePicker } from "@/components/ui/DatePicker";
import { MoneyInput } from "../desembolso/_components/MoneyImput";
import {
  createGoal,
  createPhase,
  createStage,
  concludeGoal,
  concludePhase,
  concludeStage,
  deleteGoal,
  deletePhase,
  deleteStage,
  listGoals,
  listPhases,
  listStages,
  reopenGoal,
  reopenPhase,
  reopenStage,
  updateGoal,
  updatePhase,
  updateStage,
} from "@/src/lib/api/endpoints";
import {
  type GoalRequestDTO,
  type GoalResponseDTO,
  type GoalUpdateDTO,
  type PageResponseDTO,
  type PhaseRequestDTO,
  type PhaseResponseDTO,
  type PhaseUpdateDTO,
  type StageRequestDTO,
  type StageResponseDTO,
  type StageUpdateDTO,
} from "@/src/lib/api/types";
import { canManageContractChildren, fetchCurrentUser } from "@/src/lib/auth/session";
import { getUserErrorMessage } from "@/src/lib/feedback/user-messages";

// Tipos
type Fase = {
  id: string;
  backendId?: number;
  stageId?: number;
  numero: number;
  titulo: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
  concluida?: boolean;
  dataConclusao?: string;
};

type Etapa = {
  id: string;
  backendId?: number;
  goalId?: number;
  numero: number;
  titulo: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
  hasFinancialValue?: boolean;
  financialAmount?: number;
  concluida?: boolean;
  dataConclusao?: string;
  fases: Fase[];
};

type Meta = {
  id: string;
  backendId?: number;
  projectId?: number;
  numero: number;
  titulo: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
  hasFinancialValue?: boolean;
  financialAmount?: number;
  concluida?: boolean;
  dataConclusao?: string;
  etapas: Etapa[];
};

type TimelineStatus =
  | "SEM_DATA"
  | "NAO_INICIADO"
  | "EM_ANDAMENTO"
  | "ATRASADO"
  | "CONCLUIDO";

function toDateOnly(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  return value.slice(0, 10);
}

function toLocalDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateOnly(value?: string | null): Date | null {
  if (!value) return null;
  const normalized = value.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
  if (!match) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    parsed.setHours(0, 0, 0, 0);
    return parsed;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function getErrorMessage(error: unknown): string {
  return getUserErrorMessage(error, "Não foi possível carregar metas, etapas e fases.");
}

async function fetchAllPages<T>(
  fetcher: (params: { page: number; size: number }) => Promise<PageResponseDTO<T>>
): Promise<T[]> {
  const pageSize = 100;
  let page = 0;
  const all: T[] = [];

  while (true) {
    const response = await fetcher({ page, size: pageSize });
    all.push(...response.content);

    if (response.last || page >= response.totalPages - 1) {
      break;
    }
    page += 1;
  }

  return all;
}

function formatDate(iso?: string) {
  if (!iso) return "-";
  const parsed = parseDateOnly(iso);
  if (!parsed) return iso;
  return parsed.toLocaleDateString("pt-BR");
}

function formatCurrencyBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function amountToCents(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

function centsToAmount(valueCents: number) {
  return Number((valueCents / 100).toFixed(2));
}

function resolveEtapaFinancialContext(meta?: Meta | null, currentEtapaId?: string) {
  const goalHasFinancialValue =
    Boolean(meta?.hasFinancialValue) && typeof meta?.financialAmount === "number";
  const goalAmountCents = goalHasFinancialValue ? amountToCents(meta?.financialAmount) : 0;

  const currentEtapa = currentEtapaId
    ? meta?.etapas.find((item) => item.id === currentEtapaId)
    : undefined;
  const currentEtapaAmountCents =
    currentEtapa?.hasFinancialValue && typeof currentEtapa.financialAmount === "number"
      ? amountToCents(currentEtapa.financialAmount)
      : 0;

  const allocatedByOtherEtapasCents =
    meta?.etapas.reduce((total, etapa) => {
      if (etapa.id === currentEtapaId) return total;
      if (!etapa.hasFinancialValue || typeof etapa.financialAmount !== "number") {
        return total;
      }
      return total + amountToCents(etapa.financialAmount);
    }, 0) ?? 0;

  const availableForEtapaCents = goalHasFinancialValue
    ? Math.max(goalAmountCents - allocatedByOtherEtapasCents, 0)
    : 0;
  const remainingToCompleteGoalCents = goalHasFinancialValue
    ? Math.max(goalAmountCents - allocatedByOtherEtapasCents - currentEtapaAmountCents, 0)
    : 0;

  return {
    goalHasFinancialValue,
    goalAmountCents,
    currentEtapaAmountCents,
    allocatedByOtherEtapasCents,
    availableForEtapaCents,
    remainingToCompleteGoalCents,
  };
}

type MetaModalDraft = {
  titulo: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  hasFinancialValue: boolean;
  financialAmountCents: number;
};

type MetaModalState =
  | {
      mode: "create" | "edit";
      metaId?: string;
      numero: number;
    }
  | null;

type StructureModalDraft = {
  titulo: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
};

type EtapaModalDraft = StructureModalDraft & {
  hasFinancialValue: boolean;
  financialAmountCents: number;
};

type EtapaCreateModalState =
  | {
      mode: "create" | "edit";
      metaId: string;
      metaNumero: number;
      numero: number;
      etapaId?: string;
    }
  | null;

type FaseCreateModalState =
  | {
      mode: "create" | "edit";
      metaId: string;
      metaNumero: number;
      etapaId: string;
      etapaNumero: number;
      numero: number;
      faseId?: string;
    }
  | null;

function areMetaDraftsEqual(first: MetaModalDraft, second: MetaModalDraft) {
  return (
    first.titulo === second.titulo &&
    first.descricao === second.descricao &&
    first.dataInicio === second.dataInicio &&
    first.dataFim === second.dataFim &&
    first.hasFinancialValue === second.hasFinancialValue &&
    first.financialAmountCents === second.financialAmountCents
  );
}

function areEtapaDraftsEqual(first: EtapaModalDraft, second: EtapaModalDraft) {
  return (
    first.titulo === second.titulo &&
    first.descricao === second.descricao &&
    first.dataInicio === second.dataInicio &&
    first.dataFim === second.dataFim &&
    first.hasFinancialValue === second.hasFinancialValue &&
    first.financialAmountCents === second.financialAmountCents
  );
}

function areStructureDraftsEqual(first: StructureModalDraft, second: StructureModalDraft) {
  return (
    first.titulo === second.titulo &&
    first.descricao === second.descricao &&
    first.dataInicio === second.dataInicio &&
    first.dataFim === second.dataFim
  );
}

function cloneMetaHierarchy(list: Meta[]) {
  return JSON.parse(JSON.stringify(list)) as Meta[];
}

const STATUS_STYLES: Record<
  TimelineStatus,
  { label: string; chip: string; dot: string; progress: string }
> = {
  SEM_DATA: {
    label: "Sem data",
    chip: "border-slate-200 bg-slate-100 text-slate-700",
    dot: "bg-slate-500",
    progress: "bg-slate-400",
  },
  NAO_INICIADO: {
    label: "Não iniciado",
    chip: "border-zinc-200 bg-zinc-100 text-zinc-700",
    dot: "bg-zinc-500",
    progress: "bg-zinc-500",
  },
  EM_ANDAMENTO: {
    label: "Em andamento",
    chip: "border-blue-200 bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
    progress: "bg-blue-500",
  },
  ATRASADO: {
    label: "Atrasado",
    chip: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
    progress: "bg-amber-500",
  },
  CONCLUIDO: {
    label: "Concluído",
    chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
    progress: "bg-emerald-500",
  },
};

function parseDay(value?: string) {
  return parseDateOnly(value);
}

function todayStart() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function getDateStatus(dataInicio?: string, dataFim?: string): TimelineStatus {
  const now = todayStart();
  const inicio = parseDay(dataInicio);
  const fim = parseDay(dataFim);

  if (!inicio && !fim) return "SEM_DATA";
  if (inicio && now < inicio) return "NAO_INICIADO";
  if (fim && now > fim) return "ATRASADO";
  return "EM_ANDAMENTO";
}

function getDateProgress(dataInicio?: string, dataFim?: string) {
  const now = todayStart();
  const inicio = parseDay(dataInicio);
  const fim = parseDay(dataFim);

  if (!inicio && !fim) return 0;
  if (inicio && !fim) return now >= inicio ? 55 : 0;
  if (!inicio && fim) return now > fim ? 100 : 45;
  if (!inicio || !fim) return 0;
  if (now <= inicio) return 0;
  if (now >= fim) return 100;

  const duration = fim.getTime() - inicio.getTime();
  if (duration <= 0) return 100;
  const elapsed = now.getTime() - inicio.getTime();
  return Math.max(0, Math.min(100, Math.round((elapsed / duration) * 100)));
}

function avg(values: number[], fallback: number) {
  if (values.length === 0) return fallback;
  const total = values.reduce((acc, value) => acc + value, 0);
  return Math.round(total / values.length);
}

function resolveFaseIndicators(fase: Fase) {
  if (fase.concluida) {
    return {
      status: "CONCLUIDO" as TimelineStatus,
      progress: 100,
    };
  }

  return {
    status: getDateStatus(fase.dataInicio, fase.dataFim),
    progress: getDateProgress(fase.dataInicio, fase.dataFim),
  };
}

function resolveEtapaIndicators(etapa: Etapa) {
  if (etapa.concluida) {
    return {
      status: "CONCLUIDO" as TimelineStatus,
      progress: 100,
    };
  }

  const ownStatus = getDateStatus(etapa.dataInicio, etapa.dataFim);
  const ownProgress = getDateProgress(etapa.dataInicio, etapa.dataFim);
  if (etapa.fases.length === 0) {
    return { status: ownStatus, progress: ownProgress };
  }

  const faseIndicators = etapa.fases.map((fase) => resolveFaseIndicators(fase));
  if (faseIndicators.every((item) => item.status === "CONCLUIDO")) {
    return {
      status: "CONCLUIDO" as TimelineStatus,
      progress: 100,
    };
  }

  const status = faseIndicators.some((item) => item.status === "ATRASADO")
    ? "ATRASADO"
    : faseIndicators.every((item) => item.status === "SEM_DATA")
      ? ownStatus
      : faseIndicators.every(
            (item) =>
              item.status === "NAO_INICIADO" || item.status === "SEM_DATA"
          )
        ? "NAO_INICIADO"
        : "EM_ANDAMENTO";
  return {
    status,
    progress: avg(
      faseIndicators.map((item) => item.progress),
      ownProgress
    ),
  };
}

function resolveMetaIndicators(meta: Meta) {
  if (meta.concluida) {
    return { status: "CONCLUIDO" as TimelineStatus, progress: 100 };
  }

  const ownStatus = getDateStatus(meta.dataInicio, meta.dataFim);
  const ownProgress = getDateProgress(meta.dataInicio, meta.dataFim);
  if (meta.etapas.length === 0) {
    return { status: ownStatus, progress: ownProgress };
  }

  const etapaIndicators = meta.etapas.map((etapa) => resolveEtapaIndicators(etapa));
  if (etapaIndicators.every((item) => item.status === "CONCLUIDO")) {
    return {
      status: "CONCLUIDO" as TimelineStatus,
      progress: 100,
    };
  }

  const status = etapaIndicators.some((item) => item.status === "ATRASADO")
    ? "ATRASADO"
    : etapaIndicators.every((item) => item.status === "SEM_DATA")
      ? ownStatus
      : etapaIndicators.every(
            (item) =>
              item.status === "NAO_INICIADO" || item.status === "SEM_DATA"
          )
        ? "NAO_INICIADO"
        : "EM_ANDAMENTO";
  return {
    status,
    progress: avg(
      etapaIndicators.map((item) => item.progress),
      ownProgress
    ),
  };
}

function StatusChip({ status }: { status: TimelineStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${style.chip}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

function ProgressBar({
  value,
  status,
}: {
  value: number;
  status: TimelineStatus;
}) {
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full transition-all duration-300 ${STATUS_STYLES[status].progress}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default function MetaEtapaFasePage() {
  const params = useParams();
  const contratoId = params.contratoId as string;
  const projectId = Number(contratoId);

  const [isEditing, setIsEditing] = useState(false);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [editMetas, setEditMetas] = useState<Meta[]>([]);
  const [expandedMetas, setExpandedMetas] = useState<Set<string>>(new Set());
  const [expandedEtapas, setExpandedEtapas] = useState<Set<string>>(new Set());
  const [metaModalState, setMetaModalState] = useState<MetaModalState>(null);
  const [metaModalDraft, setMetaModalDraft] = useState<MetaModalDraft>({
    titulo: "",
    descricao: "",
    dataInicio: "",
    dataFim: "",
    hasFinancialValue: false,
    financialAmountCents: 0,
  });
  const [metaModalError, setMetaModalError] = useState<string | null>(null);
  const [etapaCreateModalState, setEtapaCreateModalState] =
    useState<EtapaCreateModalState>(null);
  const [etapaCreateDraft, setEtapaCreateDraft] = useState<EtapaModalDraft>({
    titulo: "",
    descricao: "",
    dataInicio: "",
    dataFim: "",
    hasFinancialValue: false,
    financialAmountCents: 0,
  });
  const [etapaModalError, setEtapaModalError] = useState<string | null>(null);
  const [faseCreateModalState, setFaseCreateModalState] =
    useState<FaseCreateModalState>(null);
  const [faseCreateDraft, setFaseCreateDraft] = useState<StructureModalDraft>({
    titulo: "",
    descricao: "",
    dataInicio: "",
    dataFim: "",
  });
  const [metaPendingDeletion, setMetaPendingDeletion] = useState<Meta | null>(null);
  const [etapaPendingDeletion, setEtapaPendingDeletion] = useState<{
    metaId: string;
    metaNumero: number;
    etapa: Etapa;
  } | null>(null);
  const [fasePendingDeletion, setFasePendingDeletion] = useState<{
    metaId: string;
    metaNumero: number;
    etapaId: string;
    etapaNumero: number;
    fase: Fase;
  } | null>(null);
  const [editingDate, setEditingDate] = useState<{ id: string; type: "meta" | "etapa" | "fase"; field: "dataInicio" | "dataFim"; ids: string[] } | null>(null);
  const [editDateValue, setEditDateValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
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

  const loadHierarchy = useCallback(async () => {
    if (!Number.isFinite(projectId) || projectId <= 0) {
      setLoadError("ID do contrato inválido para carregar metas.");
      setMetas([]);
      setEditMetas([]);
      return;
    }

    setIsLoadingData(true);
    setLoadError(null);

    try {
      const [goals, stages, phases] = await Promise.all([
        fetchAllPages<GoalResponseDTO>((query) => listGoals({ ...query, projectId })),
        fetchAllPages<StageResponseDTO>((query) => listStages({ ...query, projectId })),
        fetchAllPages<PhaseResponseDTO>((query) => listPhases({ ...query, projectId })),
      ]);

      const activeGoals = goals
        .filter((goal) => goal.isActive)
        .sort((a, b) => a.numero - b.numero);
      const activeStages = stages
        .filter((stage) => stage.isActive)
        .sort((a, b) => a.numero - b.numero);
      const activePhases = phases
        .filter((phase) => phase.isActive)
        .sort((a, b) => a.numero - b.numero);

      const phasesByStage = new Map<number, PhaseResponseDTO[]>();
      for (const phase of activePhases) {
        const list = phasesByStage.get(phase.stageId) ?? [];
        list.push(phase);
        phasesByStage.set(phase.stageId, list);
      }

      const stagesByGoal = new Map<number, StageResponseDTO[]>();
      for (const stage of activeStages) {
        const list = stagesByGoal.get(stage.goalId) ?? [];
        list.push(stage);
        stagesByGoal.set(stage.goalId, list);
      }

      const nextMetas: Meta[] = activeGoals.map((goal) => {
        const nextEtapas: Etapa[] = (stagesByGoal.get(goal.id) ?? []).map((stage) => {
          const nextFases: Fase[] = (phasesByStage.get(stage.id) ?? []).map((phase) => ({
            id: `phase-${phase.id}`,
            backendId: phase.id,
            stageId: phase.stageId,
            numero: phase.numero,
            titulo: phase.titulo,
            descricao: phase.descricao ?? undefined,
            dataInicio: toDateOnly(phase.dataInicio),
            dataFim: toDateOnly(phase.dataFim),
            concluida: Boolean(phase.dataConclusao),
            dataConclusao: toDateOnly(phase.dataConclusao),
          }));

          return {
            id: `stage-${stage.id}`,
            backendId: stage.id,
            goalId: stage.goalId,
            numero: stage.numero,
            titulo: stage.titulo,
            descricao: stage.descricao ?? undefined,
            dataInicio: toDateOnly(stage.dataInicio),
            dataFim: toDateOnly(stage.dataFim),
            hasFinancialValue: Boolean(stage.hasFinancialValue),
            financialAmount:
              stage.hasFinancialValue && typeof stage.financialAmount === "number"
                ? stage.financialAmount
                : undefined,
            concluida: Boolean(stage.dataConclusao),
            dataConclusao: toDateOnly(stage.dataConclusao),
            fases: nextFases,
          };
        });

        return {
          id: `goal-${goal.id}`,
          backendId: goal.id,
          projectId: goal.projectId,
          numero: goal.numero,
          titulo: goal.titulo,
          descricao: goal.descricao ?? undefined,
          dataInicio: toDateOnly(goal.dataInicio),
          dataFim: toDateOnly(goal.dataFim),
          hasFinancialValue: Boolean(goal.hasFinancialValue),
          financialAmount: goal.financialAmount ?? undefined,
          concluida: Boolean(goal.dataConclusao),
          dataConclusao: toDateOnly(goal.dataConclusao),
          etapas: nextEtapas,
        };
      });

      setMetas(nextMetas);
      setEditMetas(cloneMetaHierarchy(nextMetas));
      setExpandedMetas(new Set(nextMetas.slice(0, 1).map((meta) => meta.id)));
      setExpandedEtapas(
        new Set(
          nextMetas
            .flatMap((meta) => meta.etapas)
            .slice(0, 1)
            .map((etapa) => etapa.id)
        )
      );
    } catch (error) {
      setLoadError(getErrorMessage(error));
      setMetas([]);
      setEditMetas([]);
    } finally {
      setIsLoadingData(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadHierarchy();
  }, [loadHierarchy]);

  const handleCancel = () => {
    setEditMetas(cloneMetaHierarchy(metas));
    setMetaModalState(null);
    setMetaModalError(null);
    setEtapaCreateModalState(null);
    setFaseCreateModalState(null);
    setMetaPendingDeletion(null);
    setEditingDate(null);
    setEditDateValue("");
    setIsEditing(false);
  };

  const normalizeOptionalText = (value?: string) => {
    if (!value) return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };

  const normalizeOptionalDate = (value?: string) => {
    if (!value) return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };

  const normalizeRequiredTitle = (value: string, fallback: string) => {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  };

  const flashSavedMessage = () => {
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const persistHierarchyChanges = async () => {
    if (!Number.isFinite(projectId) || projectId <= 0) {
      throw new Error("ID do contrato inválido para salvar metas.");
    }

    const metasOrdered = [...editMetas].sort((a, b) => a.numero - b.numero);

    for (const meta of metasOrdered) {
      const goalCreatePayload: GoalRequestDTO = {
        projectId,
        numero: meta.numero,
        titulo: normalizeRequiredTitle(meta.titulo, `Meta ${meta.numero}`),
        descricao: normalizeOptionalText(meta.descricao),
        dataInicio: normalizeOptionalDate(meta.dataInicio),
        dataFim: normalizeOptionalDate(meta.dataFim),
        hasFinancialValue: Boolean(meta.hasFinancialValue),
        financialAmount:
          meta.hasFinancialValue && typeof meta.financialAmount === "number"
            ? meta.financialAmount
            : undefined,
      };

      const goalUpdatePayload: GoalUpdateDTO = {
        projectId,
        numero: meta.numero,
        titulo: normalizeRequiredTitle(meta.titulo, `Meta ${meta.numero}`),
        descricao: normalizeOptionalText(meta.descricao),
        dataInicio: normalizeOptionalDate(meta.dataInicio),
        dataFim: normalizeOptionalDate(meta.dataFim),
        hasFinancialValue: Boolean(meta.hasFinancialValue),
        financialAmount:
          meta.hasFinancialValue && typeof meta.financialAmount === "number"
            ? meta.financialAmount
            : undefined,
      };

      const goalId =
        meta.backendId ??
        (await createGoal(goalCreatePayload)).id;

      if (meta.backendId) {
        await updateGoal(meta.backendId, goalUpdatePayload);
      }

      const etapasOrdered = [...meta.etapas].sort((a, b) => a.numero - b.numero);
      for (const etapa of etapasOrdered) {
        const stageCreatePayload: StageRequestDTO = {
          goalId,
          numero: etapa.numero,
          titulo: normalizeRequiredTitle(etapa.titulo, `Etapa ${etapa.numero}`),
          descricao: normalizeOptionalText(etapa.descricao),
          dataInicio: normalizeOptionalDate(etapa.dataInicio),
          dataFim: normalizeOptionalDate(etapa.dataFim),
          hasFinancialValue: Boolean(etapa.hasFinancialValue),
          financialAmount:
            etapa.hasFinancialValue && typeof etapa.financialAmount === "number"
              ? etapa.financialAmount
              : undefined,
        };

        const stageUpdatePayload: StageUpdateDTO = {
          goalId,
          numero: etapa.numero,
          titulo: normalizeRequiredTitle(etapa.titulo, `Etapa ${etapa.numero}`),
          descricao: normalizeOptionalText(etapa.descricao),
          dataInicio: normalizeOptionalDate(etapa.dataInicio),
          dataFim: normalizeOptionalDate(etapa.dataFim),
          hasFinancialValue: Boolean(etapa.hasFinancialValue),
          financialAmount:
            etapa.hasFinancialValue && typeof etapa.financialAmount === "number"
              ? etapa.financialAmount
              : undefined,
        };

        const stageId =
          etapa.backendId ??
          (await createStage(stageCreatePayload)).id;

        if (etapa.backendId) {
          await updateStage(etapa.backendId, stageUpdatePayload);
        }

        const fasesOrdered = [...etapa.fases].sort((a, b) => a.numero - b.numero);
        for (const fase of fasesOrdered) {
          const phaseCreatePayload: PhaseRequestDTO = {
            stageId,
            numero: fase.numero,
            titulo: normalizeRequiredTitle(fase.titulo, `Fase ${fase.numero}`),
            descricao: normalizeOptionalText(fase.descricao),
            dataInicio: normalizeOptionalDate(fase.dataInicio),
            dataFim: normalizeOptionalDate(fase.dataFim),
          };

          const phaseUpdatePayload: PhaseUpdateDTO = {
            stageId,
            numero: fase.numero,
            titulo: normalizeRequiredTitle(fase.titulo, `Fase ${fase.numero}`),
            descricao: normalizeOptionalText(fase.descricao),
            dataInicio: normalizeOptionalDate(fase.dataInicio),
            dataFim: normalizeOptionalDate(fase.dataFim),
          };

          if (fase.backendId) {
            await updatePhase(fase.backendId, phaseUpdatePayload);
          } else {
            await createPhase(phaseCreatePayload);
          }
        }
      }
    }
  };

  const handleSave = async () => {
    if (!canManageChildren) return;
    setIsSaving(true);
    setLoadError(null);
    try {
      await persistHierarchyChanges();
      await loadHierarchy();
      setEditingDate(null);
      setEditDateValue("");
      setIsEditing(false);
      flashSavedMessage();
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleMetaConcluida = async (metaId: string) => {
    if (!canManageChildren) {
      setLoadError("Perfil em modo leitura para metas, etapas e fases.");
      return;
    }
    if (isEditing) {
      setLoadError("Salve as alterações antes de concluir ou reabrir a meta.");
      return;
    }

    const currentMeta = metas.find((meta) => meta.id === metaId);
    if (!currentMeta) return;

    if (!currentMeta.backendId) {
      const today = toLocalDateOnly(new Date());
      const toggleInList = (list: Meta[]) =>
        list.map((meta) => {
          if (meta.id !== metaId) return meta;
          if (meta.concluida) {
            return {
              ...meta,
              concluida: false,
              dataConclusao: undefined,
            };
          }

          return {
            ...meta,
            concluida: true,
            dataConclusao: today,
            dataInicio: meta.dataInicio ?? today,
            dataFim: meta.dataFim ?? today,
          };
        });

      setMetas((prev) => toggleInList(prev));
      setEditMetas((prev) => toggleInList(prev));
      return;
    }

    try {
      if (currentMeta.concluida) {
        await reopenGoal(currentMeta.backendId);
      } else {
        await concludeGoal(currentMeta.backendId);
      }
      await loadHierarchy();
    } catch (error) {
      setLoadError(getErrorMessage(error));
    }
  };

  const toggleEtapaConcluida = async (metaId: string, etapaId: string) => {
    if (!canManageChildren) {
      setLoadError("Perfil em modo leitura para metas, etapas e fases.");
      return;
    }
    if (isEditing) {
      setLoadError("Salve as alterações antes de concluir ou reabrir a etapa.");
      return;
    }

    const currentMeta = metas.find((meta) => meta.id === metaId);
    const currentEtapa = currentMeta?.etapas.find((etapa) => etapa.id === etapaId);
    if (!currentEtapa) return;

    if (!currentEtapa.backendId) {
      const today = toLocalDateOnly(new Date());
      const toggle = (list: Meta[]) =>
        list.map((meta) =>
          meta.id !== metaId
            ? meta
            : {
                ...meta,
                etapas: meta.etapas.map((etapa) =>
                  etapa.id !== etapaId
                    ? etapa
                    : {
                        ...etapa,
                        concluida: !etapa.concluida,
                        dataConclusao: etapa.concluida ? undefined : today,
                        dataFim: etapa.dataFim ?? today,
                      }
                ),
              }
        );
      setMetas((prev) => toggle(prev));
      setEditMetas((prev) => toggle(prev));
      return;
    }

    try {
      if (currentEtapa.concluida) {
        await reopenStage(currentEtapa.backendId);
      } else {
        await concludeStage(currentEtapa.backendId);
      }
      await loadHierarchy();
    } catch (error) {
      setLoadError(getErrorMessage(error));
    }
  };

  const toggleFaseConcluida = async (
    metaId: string,
    etapaId: string,
    faseId: string
  ) => {
    if (!canManageChildren) {
      setLoadError("Perfil em modo leitura para metas, etapas e fases.");
      return;
    }
    if (isEditing) {
      setLoadError("Salve as alterações antes de concluir ou reabrir a fase.");
      return;
    }

    const currentMeta = metas.find((meta) => meta.id === metaId);
    const currentEtapa = currentMeta?.etapas.find((etapa) => etapa.id === etapaId);
    const currentFase = currentEtapa?.fases.find((fase) => fase.id === faseId);
    if (!currentFase) return;

    if (!currentFase.backendId) {
      const today = toLocalDateOnly(new Date());
      const toggle = (list: Meta[]) =>
        list.map((meta) =>
          meta.id !== metaId
            ? meta
            : {
                ...meta,
                etapas: meta.etapas.map((etapa) =>
                  etapa.id !== etapaId
                    ? etapa
                    : {
                        ...etapa,
                        fases: etapa.fases.map((fase) =>
                          fase.id !== faseId
                            ? fase
                            : {
                                ...fase,
                                concluida: !fase.concluida,
                                dataConclusao: fase.concluida ? undefined : today,
                                dataFim: fase.dataFim ?? today,
                              }
                        ),
                      }
                ),
              }
        );
      setMetas((prev) => toggle(prev));
      setEditMetas((prev) => toggle(prev));
      return;
    }

    try {
      if (currentFase.concluida) {
        await reopenPhase(currentFase.backendId);
      } else {
        await concludePhase(currentFase.backendId);
      }
      await loadHierarchy();
    } catch (error) {
      setLoadError(getErrorMessage(error));
    }
  };

  // Toggle expandir/colapsar
  const toggleMeta = (id: string) => {
    setExpandedMetas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleEtapa = (id: string) => {
    setExpandedEtapas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Funções de edição
  const openCreateMetaModal = () => {
    if (!canManageChildren) return;

    const nextNumero = metas.length + 1;

    setMetaModalError(null);
    setMetaModalDraft({
      titulo: `Meta ${nextNumero}`,
      descricao: "",
      dataInicio: "",
      dataFim: "",
      hasFinancialValue: false,
      financialAmountCents: 0,
    });
    setMetaModalState({
      mode: "create",
      numero: nextNumero,
    });
  };

  const openEditMetaModal = (meta: Meta) => {
    if (!canManageChildren) return;

    setMetaModalError(null);
    setMetaModalDraft({
      titulo: meta.titulo,
      descricao: meta.descricao ?? "",
      dataInicio: meta.dataInicio ?? "",
      dataFim: meta.dataFim ?? "",
      hasFinancialValue: Boolean(meta.hasFinancialValue),
      financialAmountCents: amountToCents(meta.financialAmount),
    });
    setMetaModalState({
      mode: "edit",
      metaId: meta.id,
      numero: meta.numero,
    });
  };

  const closeMetaModal = () => {
    setMetaModalState(null);
    setMetaModalError(null);
    setMetaModalDraft({
      titulo: "",
      descricao: "",
      dataInicio: "",
      dataFim: "",
      hasFinancialValue: false,
      financialAmountCents: 0,
    });
  };

  const updateMetaQuickField = (
    metaId: string,
    field: "titulo" | "descricao" | "dataInicio" | "dataFim",
    value: string
  ) => {
    setEditMetas((prev) =>
      prev.map((meta) =>
        meta.id === metaId
          ? {
              ...meta,
              [field]:
                field === "descricao"
                  ? value
                  : field === "dataInicio" || field === "dataFim"
                    ? value || undefined
                    : value,
            }
          : meta
      )
    );
  };

  const saveMetaModal = async () => {
    if (!metaModalState) return;
    setMetaModalError(null);

    if (metaModalDraft.hasFinancialValue && metaModalDraft.financialAmountCents <= 0) {
      setMetaModalError("Informe o valor financeiro da meta.");
      return;
    }

    const normalizedMeta: Pick<
      Meta,
      "titulo" | "descricao" | "dataInicio" | "dataFim" | "hasFinancialValue" | "financialAmount"
    > = {
      titulo: metaModalDraft.titulo.trim() || `Meta ${metaModalState.numero}`,
      descricao: normalizeOptionalText(metaModalDraft.descricao),
      dataInicio: normalizeOptionalDate(metaModalDraft.dataInicio),
      dataFim: normalizeOptionalDate(metaModalDraft.dataFim),
      hasFinancialValue: metaModalDraft.hasFinancialValue,
      financialAmount: metaModalDraft.hasFinancialValue
        ? centsToAmount(metaModalDraft.financialAmountCents)
        : undefined,
    };

    if (!Number.isFinite(projectId) || projectId <= 0) {
      setLoadError(
        metaModalState.mode === "create"
          ? "ID do contrato inválido para criar a meta."
          : "ID do contrato inválido para atualizar a meta."
      );
      return;
    }

    setIsSaving(true);
    setLoadError(null);
    try {
      if (metaModalState.mode === "create") {
        await createGoal({
          projectId,
          numero: metaModalState.numero,
          titulo: normalizedMeta.titulo,
          descricao: normalizedMeta.descricao,
          dataInicio: normalizedMeta.dataInicio,
          dataFim: normalizedMeta.dataFim,
          hasFinancialValue: normalizedMeta.hasFinancialValue,
          financialAmount: normalizedMeta.financialAmount,
        });
      } else {
        const currentMeta = metas.find((meta) => meta.id === metaModalState.metaId);
        if (!currentMeta?.backendId) {
          setLoadError("Não foi possível localizar a meta para atualizar.");
          return;
        }

        await updateGoal(currentMeta.backendId, {
          projectId,
          numero: currentMeta.numero,
          titulo: normalizedMeta.titulo,
          descricao: normalizedMeta.descricao,
          dataInicio: normalizedMeta.dataInicio,
          dataFim: normalizedMeta.dataFim,
          hasFinancialValue: normalizedMeta.hasFinancialValue,
          financialAmount: normalizedMeta.financialAmount,
        });
      }

      closeMetaModal();
      await loadHierarchy();
      flashSavedMessage();
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const etapaModalParentMeta = useMemo(() => {
    if (!etapaCreateModalState) return null;
    return metas.find((item) => item.id === etapaCreateModalState.metaId) ?? null;
  }, [metas, etapaCreateModalState]);

  const etapaModalFinancialContext = useMemo(
    () =>
      resolveEtapaFinancialContext(
        etapaModalParentMeta,
        etapaCreateModalState?.mode === "edit" ? etapaCreateModalState.etapaId : undefined
      ),
    [etapaModalParentMeta, etapaCreateModalState]
  );

  const faseModalParentMeta = useMemo(() => {
    if (!faseCreateModalState) return null;
    return metas.find((item) => item.id === faseCreateModalState.metaId) ?? null;
  }, [metas, faseCreateModalState]);

  const faseModalParentEtapa = useMemo(() => {
    if (!faseModalParentMeta || !faseCreateModalState) return null;
    return (
      faseModalParentMeta.etapas.find(
        (item) => item.id === faseCreateModalState.etapaId
      ) ?? null
    );
  }, [faseModalParentMeta, faseCreateModalState]);

  const openCreateEtapaModal = (meta: Meta) => {
    if (!canManageChildren) return;

    const sourceMeta = metas.find((item) => item.id === meta.id) ?? meta;
    const nextNumero = sourceMeta.etapas.length + 1;
    const etapaFinancialContext = resolveEtapaFinancialContext(sourceMeta);

    setEtapaModalError(null);
    setEtapaCreateDraft({
      titulo: `Etapa ${nextNumero}`,
      descricao: "",
      dataInicio: "",
      dataFim: "",
      hasFinancialValue: false,
      financialAmountCents: etapaFinancialContext.availableForEtapaCents,
    });
    setEtapaCreateModalState({
      mode: "create",
      metaId: sourceMeta.id,
      metaNumero: sourceMeta.numero,
      numero: nextNumero,
    });
    setExpandedMetas((prev) => new Set(prev).add(sourceMeta.id));
  };

  const openEditEtapaModal = (meta: Meta, etapa: Etapa) => {
    if (!canManageChildren) return;

    setEtapaModalError(null);
    setEtapaCreateDraft({
      titulo: etapa.titulo,
      descricao: etapa.descricao ?? "",
      dataInicio: etapa.dataInicio ?? "",
      dataFim: etapa.dataFim ?? "",
      hasFinancialValue: Boolean(etapa.hasFinancialValue),
      financialAmountCents: amountToCents(etapa.financialAmount),
    });
    setEtapaCreateModalState({
      mode: "edit",
      metaId: meta.id,
      metaNumero: meta.numero,
      numero: etapa.numero,
      etapaId: etapa.id,
    });
    setExpandedMetas((prev) => new Set(prev).add(meta.id));
  };

  const closeEtapaCreateModal = () => {
    setEtapaCreateModalState(null);
    setEtapaModalError(null);
    setEtapaCreateDraft({
      titulo: "",
      descricao: "",
      dataInicio: "",
      dataFim: "",
      hasFinancialValue: false,
      financialAmountCents: 0,
    });
  };

  const saveEtapaCreateModal = async () => {
    if (!etapaCreateModalState) return;

    const parentMeta = metas.find((item) => item.id === etapaCreateModalState.metaId);
    if (!parentMeta?.backendId) {
      setLoadError(
        etapaCreateModalState.mode === "create"
          ? "Não foi possível localizar a meta para criar a etapa."
          : "Não foi possível localizar a meta para atualizar a etapa."
      );
      return;
    }

    setEtapaModalError(null);

    if (etapaCreateDraft.hasFinancialValue) {
      if (!etapaModalFinancialContext?.goalHasFinancialValue) {
        setEtapaModalError(
          "Defina primeiro o valor financeiro da meta antes de informar valor na etapa."
        );
        return;
      }

      if (etapaCreateDraft.financialAmountCents <= 0) {
        setEtapaModalError("Informe o valor financeiro da etapa.");
        return;
      }

      if (etapaCreateDraft.financialAmountCents > etapaModalFinancialContext.availableForEtapaCents) {
        const suggestedCents = Math.max(etapaModalFinancialContext.availableForEtapaCents, 0);
        setEtapaCreateDraft((prev) => ({
          ...prev,
          financialAmountCents: suggestedCents,
        }));
        setEtapaModalError(
          suggestedCents > 0
            ? `O valor da etapa não pode superar o valor da meta. Preenchi ${formatCurrencyBRL(
                centsToAmount(suggestedCents)
              )}, que é o valor restante para completar a meta.`
            : "Esta meta já atingiu todo o valor financeiro previsto. Não há saldo disponível para esta etapa."
        );
        return;
      }
    }

    setIsSaving(true);
    setLoadError(null);
    try {
      if (etapaCreateModalState.mode === "create") {
        await createStage({
          goalId: parentMeta.backendId,
          numero: etapaCreateModalState.numero,
          titulo: etapaCreateDraft.titulo.trim() || `Etapa ${etapaCreateModalState.numero}`,
          descricao: normalizeOptionalText(etapaCreateDraft.descricao),
          dataInicio: normalizeOptionalDate(etapaCreateDraft.dataInicio),
          dataFim: normalizeOptionalDate(etapaCreateDraft.dataFim),
          hasFinancialValue: etapaCreateDraft.hasFinancialValue,
          financialAmount: etapaCreateDraft.hasFinancialValue
            ? centsToAmount(etapaCreateDraft.financialAmountCents)
            : undefined,
        });
      } else {
        const parentEtapa = parentMeta.etapas.find(
          (item) => item.id === etapaCreateModalState.etapaId
        );
        if (!parentEtapa?.backendId) {
          setLoadError("Não foi possível localizar a etapa para atualizar.");
          return;
        }

        await updateStage(parentEtapa.backendId, {
          goalId: parentMeta.backendId,
          numero: parentEtapa.numero,
          titulo: etapaCreateDraft.titulo.trim() || `Etapa ${parentEtapa.numero}`,
          descricao: normalizeOptionalText(etapaCreateDraft.descricao),
          dataInicio: normalizeOptionalDate(etapaCreateDraft.dataInicio),
          dataFim: normalizeOptionalDate(etapaCreateDraft.dataFim),
          hasFinancialValue: etapaCreateDraft.hasFinancialValue,
          financialAmount: etapaCreateDraft.hasFinancialValue
            ? centsToAmount(etapaCreateDraft.financialAmountCents)
            : undefined,
        });
      }

      closeEtapaCreateModal();
      await loadHierarchy();
      flashSavedMessage();
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const openCreateFaseModal = (meta: Meta, etapa: Etapa) => {
    if (!canManageChildren) return;

    const sourceMeta = metas.find((item) => item.id === meta.id) ?? meta;
    const sourceEtapa =
      sourceMeta.etapas.find((item) => item.id === etapa.id) ?? etapa;
    const nextNumero = sourceEtapa.fases.length + 1;

    setFaseCreateDraft({
      titulo: `Fase ${nextNumero}`,
      descricao: "",
      dataInicio: "",
      dataFim: "",
    });
    setFaseCreateModalState({
      mode: "create",
      metaId: sourceMeta.id,
      metaNumero: sourceMeta.numero,
      etapaId: sourceEtapa.id,
      etapaNumero: sourceEtapa.numero,
      numero: nextNumero,
    });
    setExpandedMetas((prev) => new Set(prev).add(sourceMeta.id));
    setExpandedEtapas((prev) => new Set(prev).add(sourceEtapa.id));
  };

  const openEditFaseModal = (meta: Meta, etapa: Etapa, fase: Fase) => {
    if (!canManageChildren) return;

    setFaseCreateDraft({
      titulo: fase.titulo,
      descricao: fase.descricao ?? "",
      dataInicio: fase.dataInicio ?? "",
      dataFim: fase.dataFim ?? "",
    });
    setFaseCreateModalState({
      mode: "edit",
      metaId: meta.id,
      metaNumero: meta.numero,
      etapaId: etapa.id,
      etapaNumero: etapa.numero,
      numero: fase.numero,
      faseId: fase.id,
    });
    setExpandedMetas((prev) => new Set(prev).add(meta.id));
    setExpandedEtapas((prev) => new Set(prev).add(etapa.id));
  };

  const closeFaseCreateModal = () => {
    setFaseCreateModalState(null);
    setFaseCreateDraft({
      titulo: "",
      descricao: "",
      dataInicio: "",
      dataFim: "",
    });
  };

  const saveFaseCreateModal = async () => {
    if (!faseCreateModalState) return;

    const parentMeta = metas.find((item) => item.id === faseCreateModalState.metaId);
    const parentEtapa = parentMeta?.etapas.find(
      (item) => item.id === faseCreateModalState.etapaId
    );
    if (!parentEtapa?.backendId) {
      setLoadError(
        faseCreateModalState.mode === "create"
          ? "Não foi possível localizar a etapa para criar a fase."
          : "Não foi possível localizar a etapa para atualizar a fase."
      );
      return;
    }

    setIsSaving(true);
    setLoadError(null);
    try {
      if (faseCreateModalState.mode === "create") {
        await createPhase({
          stageId: parentEtapa.backendId,
          numero: faseCreateModalState.numero,
          titulo: faseCreateDraft.titulo.trim() || `Fase ${faseCreateModalState.numero}`,
          descricao: normalizeOptionalText(faseCreateDraft.descricao),
          dataInicio: normalizeOptionalDate(faseCreateDraft.dataInicio),
          dataFim: normalizeOptionalDate(faseCreateDraft.dataFim),
        });
      } else {
        const currentFase = parentEtapa.fases.find(
          (item) => item.id === faseCreateModalState.faseId
        );
        if (!currentFase?.backendId) {
          setLoadError("Não foi possível localizar a fase para atualizar.");
          return;
        }

        await updatePhase(currentFase.backendId, {
          stageId: parentEtapa.backendId,
          numero: currentFase.numero,
          titulo: faseCreateDraft.titulo.trim() || `Fase ${currentFase.numero}`,
          descricao: normalizeOptionalText(faseCreateDraft.descricao),
          dataInicio: normalizeOptionalDate(faseCreateDraft.dataInicio),
          dataFim: normalizeOptionalDate(faseCreateDraft.dataFim),
        });
      }

      closeFaseCreateModal();
      await loadHierarchy();
      flashSavedMessage();
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const removeMeta = async (id: string) => {
    const meta = metas.find((item) => item.id === id) ?? editMetas.find((item) => item.id === id);
    if (!meta) return;

    if (meta.backendId) {
      try {
        await deleteGoal(meta.backendId);
        await loadHierarchy();
      } catch (error) {
        setLoadError(getErrorMessage(error));
      }
      return;
    }

    setEditMetas((prev) => prev.filter((m) => m.id !== id));
  };

  const openDeleteMetaModal = (meta: Meta) => {
    if (!canManageChildren) return;
    setMetaPendingDeletion(meta);
  };

  const closeDeleteMetaModal = () => {
    setMetaPendingDeletion(null);
  };

  const confirmMetaDeletion = async () => {
    if (!metaPendingDeletion) return;

    await removeMeta(metaPendingDeletion.id);
    setExpandedMetas((prev) => {
      const next = new Set(prev);
      next.delete(metaPendingDeletion.id);
      return next;
    });
    closeDeleteMetaModal();
  };

  const openDeleteEtapaModal = (meta: Meta, etapa: Etapa) => {
    if (!canManageChildren) return;
    setEtapaPendingDeletion({
      metaId: meta.id,
      metaNumero: meta.numero,
      etapa,
    });
  };

  const closeDeleteEtapaModal = () => {
    setEtapaPendingDeletion(null);
  };

  const confirmEtapaDeletion = async () => {
    if (!etapaPendingDeletion) return;

    await removeEtapa(etapaPendingDeletion.metaId, etapaPendingDeletion.etapa.id);
    setExpandedEtapas((prev) => {
      const next = new Set(prev);
      next.delete(etapaPendingDeletion.etapa.id);
      return next;
    });
    closeDeleteEtapaModal();
  };

  const openDeleteFaseModal = (meta: Meta, etapa: Etapa, fase: Fase) => {
    if (!canManageChildren) return;
    setFasePendingDeletion({
      metaId: meta.id,
      metaNumero: meta.numero,
      etapaId: etapa.id,
      etapaNumero: etapa.numero,
      fase,
    });
  };

  const closeDeleteFaseModal = () => {
    setFasePendingDeletion(null);
  };

  const confirmFaseDeletion = async () => {
    if (!fasePendingDeletion) return;

    await removeFase(
      fasePendingDeletion.metaId,
      fasePendingDeletion.etapaId,
      fasePendingDeletion.fase.id
    );
    closeDeleteFaseModal();
  };

  const removeEtapa = async (metaId: string, etapaId: string) => {
    const meta =
      metas.find((item) => item.id === metaId) ??
      editMetas.find((item) => item.id === metaId);
    const etapa = meta?.etapas.find((item) => item.id === etapaId);
    if (!etapa) return;

    if (etapa.backendId) {
      try {
        await deleteStage(etapa.backendId);
        await loadHierarchy();
      } catch (error) {
        setLoadError(getErrorMessage(error));
      }
      return;
    }

    setEditMetas((prev) =>
      prev.map((item) =>
        item.id !== metaId
          ? item
          : { ...item, etapas: item.etapas.filter((stage) => stage.id !== etapaId) }
      )
    );
  };

  const removeFase = async (metaId: string, etapaId: string, faseId: string) => {
    const meta =
      metas.find((item) => item.id === metaId) ??
      editMetas.find((item) => item.id === metaId);
    const etapa = meta?.etapas.find((item) => item.id === etapaId);
    const fase = etapa?.fases.find((item) => item.id === faseId);
    if (!fase) return;

    if (fase.backendId) {
      try {
        await deletePhase(fase.backendId);
        await loadHierarchy();
      } catch (error) {
        setLoadError(getErrorMessage(error));
      }
      return;
    }

    setEditMetas((prev) =>
      prev.map((item) => {
        if (item.id !== metaId) return item;
        return {
          ...item,
          etapas: item.etapas.map((stage) =>
            stage.id !== etapaId
              ? stage
              : { ...stage, fases: stage.fases.filter((phase) => phase.id !== faseId) }
          ),
        };
      })
    );
  };

  // Funções para editar datas
  const startEditDate = (type: "meta" | "etapa" | "fase", field: "dataInicio" | "dataFim", ids: string[], currentValue?: string) => {
    setEditingDate({ id: ids[ids.length - 1], type, field, ids });
    // Converter data ISO para formato do input (YYYY-MM-DD)
    if (currentValue) {
      setEditDateValue(currentValue);
    } else {
      setEditDateValue("");
    }
  };

  const saveEditDate = () => {
    if (!editingDate) return;

    const { type, field, ids } = editingDate;
    const newValue = editDateValue || undefined;

    if (type === "meta") {
      setEditMetas((prev) =>
        prev.map((m) => (m.id === ids[0] ? { ...m, [field]: newValue } : m))
      );
    } else if (type === "etapa") {
      setEditMetas((prev) =>
        prev.map((m) =>
          m.id === ids[0]
            ? {
                ...m,
                etapas: m.etapas.map((e) =>
                  e.id === ids[1] ? { ...e, [field]: newValue } : e
                ),
              }
            : m
        )
      );
    } else if (type === "fase") {
      setEditMetas((prev) =>
        prev.map((m) =>
          m.id === ids[0]
            ? {
                ...m,
                etapas: m.etapas.map((e) =>
                  e.id === ids[1]
                    ? {
                        ...e,
                        fases: e.fases.map((f) =>
                          f.id === ids[2] ? { ...f, [field]: newValue } : f
                        ),
                      }
                    : e
                ),
              }
            : m
        )
      );
    }

    setEditingDate(null);
    setEditDateValue("");
  };

  const cancelEditDate = () => {
    setEditingDate(null);
    setEditDateValue("");
  };

  // Modo de visualizacao (read-only)
  const currentMetas = metas;
  const metrics = useMemo(() => {
    const totalMetas = currentMetas.length;
    const totalEtapas = currentMetas.reduce(
      (acc, meta) => acc + meta.etapas.length,
      0
    );
    const totalFases = currentMetas.reduce(
      (acc, meta) =>
        acc +
        meta.etapas.reduce((innerAcc, etapa) => innerAcc + etapa.fases.length, 0),
      0
    );
    return { totalMetas, totalEtapas, totalFases };
  }, [currentMetas]);

  const metaModalDescription =
    metaModalState?.mode === "edit"
      ? "Atualize os dados principais da meta sem poluir a linha da estrutura."
      : "Cadastre uma nova meta e salve diretamente por este modal.";

  const etapaModalDescription =
    etapaCreateModalState?.mode === "edit"
      ? "Atualize os dados da etapa e salve diretamente por este modal."
      : "Cadastre uma etapa dentro da meta selecionada e salve diretamente por este modal.";

  const faseModalDescription =
    faseCreateModalState?.mode === "edit"
      ? "Atualize os dados da fase e salve diretamente por este modal."
      : "Cadastre uma fase dentro da etapa selecionada e salve diretamente por este modal.";
  const metaModalInitialDraft = useMemo<MetaModalDraft>(() => {
    if (metaModalState?.mode === "edit") {
      const meta = metas.find((item) => item.id === metaModalState.metaId);
      if (meta) {
        return {
          titulo: meta.titulo,
          descricao: meta.descricao ?? "",
          dataInicio: meta.dataInicio ?? "",
          dataFim: meta.dataFim ?? "",
          hasFinancialValue: Boolean(meta.hasFinancialValue),
          financialAmountCents: amountToCents(meta.financialAmount),
        };
      }
    }
    return {
      titulo: metaModalState ? `Meta ${metaModalState.numero}` : "",
      descricao: "",
      dataInicio: "",
      dataFim: "",
      hasFinancialValue: false,
      financialAmountCents: 0,
    };
  }, [metaModalState, metas]);
  const etapaModalInitialDraft = useMemo<EtapaModalDraft>(() => {
    if (etapaCreateModalState?.mode === "edit") {
      const meta = metas.find((item) => item.id === etapaCreateModalState.metaId);
      const etapa = meta?.etapas.find((item) => item.id === etapaCreateModalState.etapaId);
      if (etapa) {
        return {
          titulo: etapa.titulo,
          descricao: etapa.descricao ?? "",
          dataInicio: etapa.dataInicio ?? "",
          dataFim: etapa.dataFim ?? "",
          hasFinancialValue: Boolean(etapa.hasFinancialValue),
          financialAmountCents: amountToCents(etapa.financialAmount),
        };
      }
    }
    return {
      titulo: etapaCreateModalState ? `Etapa ${etapaCreateModalState.numero}` : "",
      descricao: "",
      dataInicio: "",
      dataFim: "",
      hasFinancialValue: false,
      financialAmountCents: etapaModalFinancialContext?.availableForEtapaCents ?? 0,
    };
  }, [etapaCreateModalState, etapaModalFinancialContext?.availableForEtapaCents, metas]);
  const faseModalInitialDraft = useMemo<StructureModalDraft>(() => {
    if (faseCreateModalState?.mode === "edit") {
      const meta = metas.find((item) => item.id === faseCreateModalState.metaId);
      const etapa = meta?.etapas.find((item) => item.id === faseCreateModalState.etapaId);
      const fase = etapa?.fases.find((item) => item.id === faseCreateModalState.faseId);
      if (fase) {
        return {
          titulo: fase.titulo,
          descricao: fase.descricao ?? "",
          dataInicio: fase.dataInicio ?? "",
          dataFim: fase.dataFim ?? "",
        };
      }
    }
    return {
      titulo: faseCreateModalState ? `Fase ${faseCreateModalState.numero}` : "",
      descricao: "",
      dataInicio: "",
      dataFim: "",
    };
  }, [faseCreateModalState, metas]);
  const isMetaModalDirty = Boolean(metaModalState) && !areMetaDraftsEqual(metaModalDraft, metaModalInitialDraft);
  const isEtapaModalDirty =
    Boolean(etapaCreateModalState) && !areEtapaDraftsEqual(etapaCreateDraft, etapaModalInitialDraft);
  const isFaseModalDirty =
    Boolean(faseCreateModalState) && !areStructureDraftsEqual(faseCreateDraft, faseModalInitialDraft);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Meta, Etapa e Fase
          </h2>
          <p className="text-sm text-slate-500">
            Estrutura estratégica e operacional do contrato {contratoId}!
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {savedMessage && (
            <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700">
              <CheckCircle className="h-4 w-4" />
              Salvo com sucesso
            </div>
          )}
          {canManageChildren && (
            <button
              onClick={openCreateMetaModal}
              className="inline-flex items-center gap-2 rounded-lg bg-[#004225] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-950/20 transition-all hover:-translate-y-0.5 hover:bg-[#003319] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <Plus className="h-4 w-4" />
              Nova Meta
            </button>
          )}
          {false && isEditing && (
            <>
              <button
                onClick={handleCancel}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-md bg-[#004225] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#003319] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Salvando..." : "Salvar"}
              </button>
            </>
          )}
        </div>
      </div>

      {!loadingAccess && !canManageChildren && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Perfil em modo leitura neste modulo. O estagiario pode consultar a estrutura, mas não pode criar, editar, concluir ou reabrir metas, etapas e fases.
        </div>
      )}

      {isLoadingData && (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          Carregando metas, etapas e fases...
        </div>
      )}

      {loadError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Metas</p>
          <p className="text-xl font-semibold text-slate-900">{metrics.totalMetas}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Etapas</p>
          <p className="text-xl font-semibold text-slate-900">{metrics.totalEtapas}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Fases</p>
          <p className="text-xl font-semibold text-slate-900">{metrics.totalFases}</p>
        </div>
      </div>

      {/* Lista de Metas */}
      {!isLoadingData && currentMetas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 bg-gray-100 rounded-full mb-4">
            <Crosshair className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Nenhuma meta cadastrada
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Use Nova Meta para comecar a estruturar o contrato.
          </p>
          {canManageChildren && (
            <button
              onClick={openCreateMetaModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Adicionar Meta
            </button>
          )}
        </div>
      ) : currentMetas.length > 0 ? (
        <div className="space-y-4">
          {currentMetas.map((meta) => {
            const metaIndicators = resolveMetaIndicators(meta);
            const metaEtapasCount = meta.etapas.length;
            const metaFasesCount = meta.etapas.reduce(
              (acc, etapa) => acc + etapa.fases.length,
              0
            );

            return (
            <div
              key={meta.id}
              className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm transition-all duration-200 hover:border-slate-400 hover:shadow-md"
            >
              {/* Header da Meta */}
              <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-slate-100 border-b border-slate-200">
                <button
                  onClick={() => toggleMeta(meta.id)}
                  aria-expanded={expandedMetas.has(meta.id)}
                  aria-label={`Alternar meta ${meta.numero}`}
                  className="rounded p-1 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  {expandedMetas.has(meta.id) ? (
                    <ChevronDown className="h-5 w-5 text-slate-700" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-slate-700" />
                  )}
                </button>
                <Crosshair className="h-5 w-5 text-slate-600" />
                <span className="text-sm font-bold text-slate-800">
                  Meta {meta.numero}:
                </span>
                <span className="flex-1 text-sm font-medium text-gray-900">
                  {meta.titulo}
                </span>
                <div className="flex items-center gap-2">
                  <StatusChip status={metaIndicators.status} />
                  <button
                    onClick={() => {
                      void toggleMetaConcluida(meta.id);
                    }}
                    disabled={isEditing || !canManageChildren}
                    title={
                      !canManageChildren
                        ? "Perfil em modo leitura."
                        : isEditing
                          ? "Salve as alterações antes de concluir/reabrir."
                          : undefined
                    }
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 ${
                      meta.concluida
                        ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    {meta.concluida ? "Reabrir Meta" : "Concluir Meta"}
                  </button>
                  <span className="hidden text-[11px] text-slate-600 md:inline">
                    {metaEtapasCount} etapas
                  </span>
                  <span className="hidden text-[11px] text-slate-600 md:inline">
                    {metaFasesCount} fases
                  </span>
                </div>
                {false ? (
                  <div className="flex items-center gap-2">
                    {editingDate?.id === meta.id && editingDate?.field === "dataInicio" ? (
                      <div className="flex items-center gap-1">
                        <DatePicker
                          value={editDateValue}
                          onChange={setEditDateValue}
                          className="h-8 rounded border-[#004225] px-2 py-1 text-xs"
                        />
                        <button
                          onClick={saveEditDate}
                          className="p-0.5 text-green-600 hover:bg-green-100 rounded"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          onClick={cancelEditDate}
                          className="p-0.5 text-red-600 hover:bg-red-100 rounded"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditDate("meta", "dataInicio", [meta.id], meta.dataInicio)}
                        className="text-xs text-gray-500 hover:text-gray-700 hover:bg-slate-200 px-2 py-1 rounded"
                        title="Editar data de início"
                      >
                        {meta.dataInicio ? formatDate(meta.dataInicio) : "Sem data"}
                      </button>
                    )}
                    <span className="text-xs text-gray-400">-</span>
                    {editingDate?.id === meta.id && editingDate?.field === "dataFim" ? (
                      <div className="flex items-center gap-1">
                        <DatePicker
                          value={editDateValue}
                          onChange={setEditDateValue}
                          className="h-8 rounded border-[#004225] px-2 py-1 text-xs"
                        />
                        <button
                          onClick={saveEditDate}
                          className="p-0.5 text-green-600 hover:bg-green-100 rounded"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          onClick={cancelEditDate}
                          className="p-0.5 text-red-600 hover:bg-red-100 rounded"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditDate("meta", "dataFim", [meta.id], meta.dataFim)}
                        className="text-xs text-gray-500 hover:text-gray-700 hover:bg-slate-200 px-2 py-1 rounded"
                        title="Editar data de fim"
                      >
                        {meta.dataFim ? formatDate(meta.dataFim) : "Sem data"}
                      </button>
                    )}
                  </div>
                ) : (
                  meta.dataInicio && meta.dataFim && (
                    <span className="text-xs text-gray-500">
                      {formatDate(meta.dataInicio)} - {formatDate(meta.dataFim)}
                    </span>
                  )
                )}
                {canManageChildren && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditMetaModal(meta)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                      title="Editar meta"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Editar
                    </button>
                    {canManageChildren && (
                      <button
                        onClick={() => openDeleteMetaModal(meta)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="Excluir meta"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="border-b border-slate-200 bg-white px-4 py-2">
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="h-3.5 w-3.5 text-slate-500" />
                    {formatDate(meta.dataInicio)} até {formatDate(meta.dataFim)}
                  </span>
                  {meta.hasFinancialValue && typeof meta.financialAmount === "number" && (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      Valor financeiro: {formatCurrencyBRL(meta.financialAmount)}
                    </span>
                  )}
                  {meta.concluida && meta.dataConclusao && (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      Concluída em {formatDate(meta.dataConclusao)}
                    </span>
                  )}
                </div>
                <ProgressBar
                  value={metaIndicators.progress}
                  status={metaIndicators.status}
                />
              </div>

              {/* Conteúdo da Meta (Etapas) */}
              {expandedMetas.has(meta.id) && (
                <div className="p-4 space-y-3">
                  {false && (
                    <div className="rounded-lg border border-slate-200 bg-slate-100 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                          Edição rápida da meta
                        </p>
                        <span className="text-[11px] text-slate-600">
                          Campos principais
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-1 text-xs text-slate-600">
                          <span className="font-medium text-slate-700">Título</span>
                          <input
                            type="text"
                            value={meta.titulo}
                            onChange={(event) =>
                              updateMetaQuickField(meta.id, "titulo", event.target.value)
                            }
                            className="h-9 rounded-md border border-[#004225] bg-white px-2.5 text-sm text-slate-900 outline-none transition focus:border-[#004225] focus:ring-2 focus:ring-[#004225]/20"
                          />
                        </label>

                        <label className="flex flex-col gap-1 text-xs text-slate-600">
                          <span className="font-medium text-slate-700">Descrição</span>
                          <input
                            type="text"
                            value={meta.descricao ?? ""}
                            onChange={(event) =>
                              updateMetaQuickField(meta.id, "descricao", event.target.value)
                            }
                            placeholder="Descreva o objetivo da meta"
                            className="h-9 rounded-md border border-[#004225] bg-white px-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#004225] focus:ring-2 focus:ring-[#004225]/20"
                          />
                        </label>

                        <label className="flex flex-col gap-1 text-xs text-slate-600">
                          <span className="font-medium text-slate-700">Data de início</span>
                          <DatePicker
                            value={meta.dataInicio ?? ""}
                            onChange={(value) =>
                              updateMetaQuickField(meta.id, "dataInicio", value)
                            }
                            className="h-9 rounded-md border-[#004225] text-sm"
                          />
                        </label>

                        <label className="flex flex-col gap-1 text-xs text-slate-600">
                          <span className="font-medium text-slate-700">Data de fim</span>
                          <DatePicker
                            value={meta.dataFim ?? ""}
                            onChange={(value) =>
                              updateMetaQuickField(meta.id, "dataFim", value)
                            }
                            className="h-9 rounded-md border-[#004225] text-sm"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {meta.etapas.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 text-sm">
                      Nenhuma etapa cadastrada.
                      {canManageChildren && (
                        <button
                          onClick={() => openCreateEtapaModal(meta)}
                          className="ml-2 text-[#004225] hover:underline font-medium"
                        >
                          Adicionar etapa
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {meta.etapas.map((etapa) => {
                        const etapaIndicators = resolveEtapaIndicators(etapa);
                        return (
                        <div
                          key={etapa.id}
                          className="ml-2 rounded-lg border border-slate-300 bg-blue-50/40 px-3 py-2"
                        >
                          {/* Header da Etapa */}
                          <div className="flex flex-wrap items-center gap-2 py-2">
                            <button
                              onClick={() => toggleEtapa(etapa.id)}
                              aria-expanded={expandedEtapas.has(etapa.id)}
                              aria-label={`Alternar etapa ${etapa.numero}`}
                              className="rounded p-1 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                            >
                              {expandedEtapas.has(etapa.id) ? (
                                <ChevronDown className="h-4 w-4 text-blue-600" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-blue-600" />
                              )}
                            </button>
                            <Milestone className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-700">
                              Etapa {etapa.numero}:
                            </span>
                            <span className="flex-1 text-sm text-gray-800">
                              {etapa.titulo}
                            </span>
                            <StatusChip status={etapaIndicators.status} />
                            <button
                              onClick={() => {
                                void toggleEtapaConcluida(meta.id, etapa.id);
                              }}
                              disabled={isEditing || !canManageChildren}
                              title={
                                !canManageChildren
                                  ? "Perfil em modo leitura."
                                  : isEditing
                                    ? "Salve as alterações antes de concluir/reabrir."
                                    : undefined
                              }
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 ${
                                etapa.concluida
                                  ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              {etapa.concluida ? "Reabrir Etapa" : "Concluir Etapa"}
                            </button>
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                {editingDate?.id === etapa.id && editingDate?.field === "dataInicio" ? (
                                  <div className="flex items-center gap-1">
                                    <DatePicker
                                      value={editDateValue}
                                      onChange={setEditDateValue}
                                      className="h-8 rounded border-[#004225] px-2 py-0.5 text-xs"
                                    />
                                    <button
                                      onClick={saveEditDate}
                                      className="p-0.5 text-green-600 hover:bg-green-100 rounded"
                                    >
                                      <Check className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={cancelEditDate}
                                      className="p-0.5 text-red-600 hover:bg-red-100 rounded"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => startEditDate("etapa", "dataInicio", [meta.id, etapa.id], etapa.dataInicio)}
                                    className="text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 px-2 py-0.5 rounded"
                                    title="Editar data de início"
                                  >
                                    {etapa.dataInicio ? formatDate(etapa.dataInicio) : "Sem data"}
                                  </button>
                                )}
                                <span className="text-xs text-gray-300">-</span>
                                {editingDate?.id === etapa.id && editingDate?.field === "dataFim" ? (
                                  <div className="flex items-center gap-1">
                                    <DatePicker
                                      value={editDateValue}
                                      onChange={setEditDateValue}
                                      className="h-8 rounded border-[#004225] px-2 py-0.5 text-xs"
                                    />
                                    <button
                                      onClick={saveEditDate}
                                      className="p-0.5 text-green-600 hover:bg-green-100 rounded"
                                    >
                                      <Check className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={cancelEditDate}
                                      className="p-0.5 text-red-600 hover:bg-red-100 rounded"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => startEditDate("etapa", "dataFim", [meta.id, etapa.id], etapa.dataFim)}
                                    className="text-xs text-gray-400 hover:text-gray-600 hover:bg-blue-50 px-2 py-0.5 rounded"
                                    title="Editar data de fim"
                                  >
                                    {etapa.dataFim ? formatDate(etapa.dataFim) : "Sem data"}
                                  </button>
                                )}
                              </div>
                            ) : (
                              etapa.dataInicio && etapa.dataFim && (
                                <span className="text-xs text-gray-400">
                                  {formatDate(etapa.dataInicio)} - {formatDate(etapa.dataFim)}
                                </span>
                              )
                            )}
                            {canManageChildren && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => openEditEtapaModal(meta, etapa)}
                                  className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-white px-2 py-1 text-[11px] font-medium text-blue-700 transition-colors hover:bg-blue-50"
                                  title="Editar etapa"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                  Editar
                                </button>
                                <button
                                  onClick={() => openDeleteEtapaModal(meta, etapa)}
                                  className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Excluir etapa"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                            <span className="inline-flex items-center gap-1">
                              <CalendarClock className="h-3.5 w-3.5 text-slate-500" />
                              {formatDate(etapa.dataInicio)} até {formatDate(etapa.dataFim)}
                            </span>
                            {etapa.hasFinancialValue && typeof etapa.financialAmount === "number" && (
                              <span className="rounded-full border border-blue-200 bg-white px-2 py-0.5 text-[11px] font-medium text-blue-700">
                                Valor financeiro: {formatCurrencyBRL(etapa.financialAmount)}
                              </span>
                            )}
                            {etapa.concluida && etapa.dataConclusao && (
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                Concluída em {formatDate(etapa.dataConclusao)}
                              </span>
                            )}
                          </div>
                          <ProgressBar
                            value={etapaIndicators.progress}
                            status={etapaIndicators.status}
                          />

                          {/* Fases da Etapa */}
                          {expandedEtapas.has(etapa.id) && (
                            <div className="ml-6 mt-2 space-y-2">
                              {etapa.fases.length === 0 ? (
                                <div className="text-sm text-gray-400 py-2">
                                  Nenhuma fase.
                                  {canManageChildren && (
                                    <button
                                      onClick={() => openCreateFaseModal(meta, etapa)}
                                      className="ml-2 text-[#004225] hover:underline font-medium"
                                    >
                                      Adicionar fase
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <>
                                  {etapa.fases.map((fase) => {
                                    const faseIndicators = resolveFaseIndicators(fase);
                                    return (
                                    <div
                                      key={fase.id}
                                      className="flex flex-wrap items-center gap-2 py-1.5 px-3 bg-gray-50 rounded-lg border border-slate-300"
                                    >
                                      <Flag className="h-3.5 w-3.5 text-gray-400" />
                                      <span className="text-xs font-medium text-gray-600">
                                        Fase {fase.numero}:
                                      </span>
                                      <span className="flex-1 text-xs text-gray-700">
                                        {fase.titulo}
                                      </span>
                                      <StatusChip status={faseIndicators.status} />
                                      <button
                                        onClick={() => {
                                          void toggleFaseConcluida(meta.id, etapa.id, fase.id);
                                        }}
                                        disabled={isEditing || !canManageChildren}
                                        title={
                                          !canManageChildren
                                            ? "Perfil em modo leitura."
                                            : isEditing
                                              ? "Salve as alterações antes de concluir/reabrir."
                                              : undefined
                                        }
                                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 ${
                                          fase.concluida
                                            ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                        }`}
                                      >
                                        <CheckCircle className="h-3 w-3" />
                                        {fase.concluida ? "Reabrir Fase" : "Concluir Fase"}
                                      </button>
                                      {isEditing ? (
                                        <div className="flex items-center gap-2">
                                          {editingDate?.id === fase.id && editingDate?.field === "dataInicio" ? (
                                            <div className="flex items-center gap-1">
                                              <DatePicker
                                                value={editDateValue}
                                                onChange={setEditDateValue}
                                                className="h-8 rounded border-[#004225] px-1.5 py-0.5 text-xs"
                                              />
                                              <button
                                                onClick={saveEditDate}
                                                className="p-0.5 text-green-600 hover:bg-green-100 rounded"
                                              >
                                                <Check className="h-2.5 w-2.5" />
                                              </button>
                                              <button
                                                onClick={cancelEditDate}
                                                className="p-0.5 text-red-600 hover:bg-red-100 rounded"
                                              >
                                                <X className="h-2.5 w-2.5" />
                                              </button>
                                            </div>
                                          ) : (
                                            <button
                                              onClick={() => startEditDate("fase", "dataInicio", [meta.id, etapa.id, fase.id], fase.dataInicio)}
                                              className="text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 px-1.5 py-0.5 rounded"
                                              title="Editar data de início"
                                            >
                                              {fase.dataInicio ? formatDate(fase.dataInicio) : "Sem data"}
                                            </button>
                                          )}
                                          <span className="text-xs text-gray-300">-</span>
                                          {editingDate?.id === fase.id && editingDate?.field === "dataFim" ? (
                                            <div className="flex items-center gap-1">
                                              <DatePicker
                                                value={editDateValue}
                                                onChange={setEditDateValue}
                                                className="h-8 rounded border-[#004225] px-1.5 py-0.5 text-xs"
                                              />
                                              <button
                                                onClick={saveEditDate}
                                                className="p-0.5 text-green-600 hover:bg-green-100 rounded"
                                              >
                                                <Check className="h-2.5 w-2.5" />
                                              </button>
                                              <button
                                                onClick={cancelEditDate}
                                                className="p-0.5 text-red-600 hover:bg-red-100 rounded"
                                              >
                                                <X className="h-2.5 w-2.5" />
                                              </button>
                                            </div>
                                          ) : (
                                            <button
                                              onClick={() => startEditDate("fase", "dataFim", [meta.id, etapa.id, fase.id], fase.dataFim)}
                                              className="text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 px-1.5 py-0.5 rounded"
                                              title="Editar data de fim"
                                            >
                                              {fase.dataFim ? formatDate(fase.dataFim) : "Sem data"}
                                            </button>
                                          )}
                                        </div>
                                      ) : (
                                        fase.dataInicio && fase.dataFim && (
                                          <span className="text-xs text-gray-400">
                                            {formatDate(fase.dataInicio)} - {formatDate(fase.dataFim)}
                                          </span>
                                        )
                                      )}
                                      {fase.concluida && fase.dataConclusao && (
                                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                                          Concluída em {formatDate(fase.dataConclusao)}
                                        </span>
                                      )}
                                      {canManageChildren && (
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() => openEditFaseModal(meta, etapa, fase)}
                                            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 transition-colors hover:bg-slate-100"
                                            title="Editar fase"
                                          >
                                            <Edit2 className="h-3 w-3" />
                                            Editar
                                          </button>
                                          <button
                                            onClick={() => openDeleteFaseModal(meta, etapa, fase)}
                                            className="p-0.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                            title="Excluir fase"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                  })}
                                </>
                              )}
                              {canManageChildren && (
                                <button
                                  onClick={() => openCreateFaseModal(meta, etapa)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-[#004225] hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  <Plus className="h-3 w-3" />
                                  Adicionar Fase
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                      })}
                    </>
                  )}
                  {canManageChildren && (
                    <button
                      onClick={() => openCreateEtapaModal(meta)}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-black hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Etapa
                    </button>
                  )}
                </div>
              )}
            </div>
          );
          })}
        </div>
      ) : null}

      <AppModalShell
        isOpen={Boolean(metaModalState)}
        title={metaModalState?.mode === "edit" ? "Editar meta" : "Nova meta"}
        description={metaModalDescription}
        icon={
          metaModalState?.mode === "edit" ? (
            <Edit2 className="h-5 w-5" />
          ) : (
            <Plus className="h-5 w-5" />
          )
        }
        tone={metaModalState?.mode === "edit" ? "info" : "brand"}
        onClose={closeMetaModal}
        maxWidthClassName="max-w-2xl"
        isDirty={isMetaModalDirty}
        footer={({ requestClose }) => (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={requestClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="meta-modal-form"
              className="inline-flex items-center gap-2 rounded-xl bg-[#004225] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#003319]"
            >
              <Save className="h-4 w-4" />
              {metaModalState?.mode === "edit" ? "Salvar alterações" : "Criar meta"}
            </button>
          </div>
        )}
      >
        {metaModalState && (
          <form
            id="meta-modal-form"
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              saveMetaModal();
            }}
          >
            {/* <div
              className={`rounded-2xl border px-4 py-3 ${
                metaModalState.mode === "edit"
                  ? "border-blue-200 bg-blue-50"
                  : "border-emerald-200 bg-emerald-50"
              }`}
            >
              <p
                className={`text-xs font-medium uppercase tracking-wide ${
                  metaModalState.mode === "edit" ? "text-blue-700" : "text-emerald-700"
                }`}
              >
                Meta
              </p>
              <p
                className={`mt-1 font-medium ${
                  metaModalState.mode === "edit" ? "text-blue-950" : "text-emerald-950"
                }`}
              >
                Meta {metaModalState.numero}
              </p>
              <p
                className={`mt-1 text-sm ${
                  metaModalState.mode === "edit" ? "text-blue-800" : "text-emerald-800"
                }`}
              >
                O preenchimento fica concentrado aqui para deixar a lista principal mais limpa e rápida de usar.
              </p>
            </div> */}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Título
                </label>
                <input
                  type="text"
                  value={metaModalDraft.titulo}
                  onChange={(event) =>
                    setMetaModalDraft((prev) => ({
                      ...prev,
                      titulo: event.target.value,
                    }))
                  }
                  placeholder={`Meta ${metaModalState.numero}`}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#004225] focus:ring-2 focus:ring-[#004225]/15"
                  autoFocus
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Descrição
                </label>
                <textarea
                  value={metaModalDraft.descricao}
                  onChange={(event) =>
                    setMetaModalDraft((prev) => ({
                      ...prev,
                      descricao: event.target.value,
                    }))
                  }
                  placeholder="Descreva o objetivo e o contexto da meta."
                  rows={4}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#004225] focus:ring-2 focus:ring-[#004225]/15"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Data de início
                </label>
                <DatePicker
                  value={metaModalDraft.dataInicio}
                  onChange={(value) =>
                    setMetaModalDraft((prev) => ({
                      ...prev,
                      dataInicio: value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Data de fim
                </label>
                <DatePicker
                  value={metaModalDraft.dataFim}
                  onChange={(value) =>
                    setMetaModalDraft((prev) => ({
                      ...prev,
                      dataFim: value,
                    }))
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={metaModalDraft.hasFinancialValue}
                    onChange={(event) => {
                      setMetaModalError(null);
                      setMetaModalDraft((prev) => ({
                        ...prev,
                        hasFinancialValue: event.target.checked,
                      }));
                    }}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#004225] focus:ring-[#004225]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-900">
                      Tem valor financeiro atrelado a meta?
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Marque esta opção para registrar um valor financeiro específico para a meta.
                    </span>
                  </span>
                </label>
              </div>
              {metaModalDraft.hasFinancialValue && (
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Valor da meta
                  </label>
                  <MoneyInput
                    valueCents={metaModalDraft.financialAmountCents}
                    onValueChange={(nextCents) => {
                      setMetaModalError(null);
                      setMetaModalDraft((prev) => ({
                        ...prev,
                        financialAmountCents: nextCents,
                      }));
                    }}
                    placeholder="R$ 0,00"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#004225] focus:ring-2 focus:ring-[#004225]/15"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Valor informado: {formatCurrencyBRL(centsToAmount(metaModalDraft.financialAmountCents))}
                  </p>
                </div>
              )}
            </div>
            {metaModalError && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {metaModalError}
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Ao confirmar este modal, a meta será salva imediatamente.
            </div>
          </form>
        )}
      </AppModalShell>

      <AppModalShell
        isOpen={Boolean(etapaCreateModalState)}
        title={etapaCreateModalState?.mode === "edit" ? "Editar etapa" : "Nova etapa"}
        description={etapaModalDescription}
        icon={<Milestone className="h-5 w-5" />}
        tone="info"
        onClose={closeEtapaCreateModal}
        maxWidthClassName="max-w-2xl"
        isDirty={isEtapaModalDirty}
        footer={({ requestClose }) => (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={requestClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="etapa-create-modal-form"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              {etapaCreateModalState?.mode === "edit" ? "Salvar etapa" : "Criar etapa"}
            </button>
          </div>
        )}
      >
        {etapaCreateModalState && (
          <form
            id="etapa-create-modal-form"
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              saveEtapaCreateModal();
            }}
          >
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
                Meta vinculada
              </p>
              <p className="mt-1 font-medium text-blue-950">
                Meta {etapaCreateModalState.metaNumero}
                {etapaModalParentMeta?.titulo ? ` - ${etapaModalParentMeta.titulo}` : ""}
              </p>
              <p className="mt-1 text-sm text-blue-800">
                {etapaCreateModalState?.mode === "edit"
                  ? "As alterações desta etapa serão salvas diretamente."
                  : "A nova etapa será criada dentro desta meta."}
              </p>
            </div>

            {/* {etapaModalFinancialContext?.goalHasFinancialValue ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                  Distribuição financeira da meta
                </p>
                <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-emerald-900 md:grid-cols-3">
                  <p>
                    Valor da meta:{" "}
                    <span className="font-semibold">
                      {formatCurrencyBRL(centsToAmount(etapaModalFinancialContext.goalAmountCents))}
                    </span>
                  </p>
                  <p>
                    Outras etapas:{" "}
                    <span className="font-semibold">
                      {formatCurrencyBRL(
                        centsToAmount(etapaModalFinancialContext.allocatedByOtherEtapasCents)
                      )}
                    </span>
                  </p>
                  <p>
                    Disponível para esta etapa:{" "}
                    <span className="font-semibold">
                      {formatCurrencyBRL(
                        centsToAmount(etapaModalFinancialContext.availableForEtapaCents)
                      )}
                    </span>
                  </p>
                </div>
                <p className="mt-2 text-xs text-emerald-700">
                  O total das etapas não pode ultrapassar o valor financeiro definido na meta.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Defina primeiro o valor financeiro da meta para distribuir valores entre as etapas.
              </div>
            )} */}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Título
                </label>
                <input
                  type="text"
                  value={etapaCreateDraft.titulo}
                  onChange={(event) =>
                    setEtapaCreateDraft((prev) => ({
                      ...prev,
                      titulo: event.target.value,
                    }))
                  }
                  placeholder={`Etapa ${etapaCreateModalState.numero}`}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                  autoFocus
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Descrição
                </label>
                <textarea
                  value={etapaCreateDraft.descricao}
                  onChange={(event) =>
                    setEtapaCreateDraft((prev) => ({
                      ...prev,
                      descricao: event.target.value,
                    }))
                  }
                  placeholder="Descreva o objetivo e o escopo desta etapa."
                  rows={4}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Data de início
                </label>
                <DatePicker
                  value={etapaCreateDraft.dataInicio}
                  onChange={(value) =>
                    setEtapaCreateDraft((prev) => ({
                      ...prev,
                      dataInicio: value,
                    }))
                  }
                  className="focus-within:border-blue-500 focus-within:ring-blue-500/15"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Data de fim
                </label>
                <DatePicker
                  value={etapaCreateDraft.dataFim}
                  onChange={(value) =>
                    setEtapaCreateDraft((prev) => ({
                      ...prev,
                      dataFim: value,
                    }))
                  }
                  className="focus-within:border-blue-500 focus-within:ring-blue-500/15"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={etapaCreateDraft.hasFinancialValue}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setEtapaModalError(null);

                      if (checked && !etapaModalFinancialContext?.goalHasFinancialValue) {
                        setEtapaModalError(
                          "Defina primeiro o valor financeiro da meta antes de informar valor na etapa."
                        );
                        return;
                      }

                      if (
                        checked &&
                        etapaModalFinancialContext &&
                        etapaModalFinancialContext.availableForEtapaCents <= 0
                      ) {
                        setEtapaModalError(
                          "Esta meta já atingiu todo o valor financeiro previsto. Não há saldo disponível para esta etapa."
                        );
                        return;
                      }

                      setEtapaCreateDraft((prev) => ({
                        ...prev,
                        hasFinancialValue: checked,
                        financialAmountCents: checked
                          ? prev.financialAmountCents > 0
                            ? Math.min(
                                prev.financialAmountCents,
                                etapaModalFinancialContext?.availableForEtapaCents ?? prev.financialAmountCents
                              )
                            : etapaModalFinancialContext?.availableForEtapaCents ?? 0
                          : 0,
                      }));
                    }}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-900">
                      Tem valor financeiro atrelado à etapa?
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Use esta opção para distribuir parte do valor financeiro da meta nesta etapa.
                    </span>
                  </span>
                </label>
              </div>

              {etapaCreateDraft.hasFinancialValue && (
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Valor da etapa
                  </label>
                  <MoneyInput
                    valueCents={etapaCreateDraft.financialAmountCents}
                    onValueChange={(nextCents) => {
                      const availableCents = etapaModalFinancialContext?.availableForEtapaCents ?? nextCents;
                      if (nextCents > availableCents) {
                        const adjustedCents = Math.max(availableCents, 0);
                        setEtapaCreateDraft((prev) => ({
                          ...prev,
                          financialAmountCents: adjustedCents,
                        }));
                        setEtapaModalError(
                          adjustedCents > 0
                            ? `O valor da etapa não pode superar o valor da meta. Preenchi ${formatCurrencyBRL(
                                centsToAmount(adjustedCents)
                              )}, que é o valor restante para completar a meta.`
                            : "Esta meta já atingiu todo o valor financeiro previsto. Não há saldo disponível para esta etapa."
                        );
                        return;
                      }

                      setEtapaModalError(null);
                      setEtapaCreateDraft((prev) => ({
                        ...prev,
                        financialAmountCents: nextCents,
                      }));
                    }}
                    placeholder="R$ 0,00"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                  />
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>
                      Valor informado:{" "}
                      {formatCurrencyBRL(centsToAmount(etapaCreateDraft.financialAmountCents))}
                    </span>
                    {etapaModalFinancialContext && (
                      <span>
                        Saldo restante da meta após esta etapa:{" "}
                        {formatCurrencyBRL(
                          centsToAmount(
                            Math.max(
                              etapaModalFinancialContext.availableForEtapaCents -
                                etapaCreateDraft.financialAmountCents,
                              0
                            )
                          )
                        )}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {etapaModalError && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {etapaModalError}
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Ao confirmar este modal, a etapa será salva imediatamente.
            </div>
          </form>
        )}
      </AppModalShell>

      <AppModalShell
        isOpen={Boolean(faseCreateModalState)}
        title={faseCreateModalState?.mode === "edit" ? "Editar fase" : "Nova fase"}
        description={faseModalDescription}
        icon={<Flag className="h-5 w-5" />}
        tone="neutral"
        onClose={closeFaseCreateModal}
        maxWidthClassName="max-w-2xl"
        isDirty={isFaseModalDirty}
        footer={({ requestClose }) => (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={requestClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="fase-create-modal-form"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-900"
            >
              <Save className="h-4 w-4" />
              {faseCreateModalState?.mode === "edit" ? "Salvar fase" : "Criar fase"}
            </button>
          </div>
        )}
      >
        {faseCreateModalState && (
          <form
            id="fase-create-modal-form"
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              saveFaseCreateModal();
            }}
          >
            <div className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
                Estrutura vinculada
              </p>
              <p className="mt-1 font-medium text-slate-900">
                Meta {faseCreateModalState.metaNumero}
                {faseModalParentMeta?.titulo ? ` - ${faseModalParentMeta.titulo}` : ""}
                {" • "}
                Etapa {faseCreateModalState.etapaNumero}
                {faseModalParentEtapa?.titulo ? ` - ${faseModalParentEtapa.titulo}` : ""}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {faseCreateModalState?.mode === "edit"
                  ? "As alterações desta fase serão salvas diretamente."
                  : "A nova fase será criada dentro desta etapa."}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Título
                </label>
                <input
                  type="text"
                  value={faseCreateDraft.titulo}
                  onChange={(event) =>
                    setFaseCreateDraft((prev) => ({
                      ...prev,
                      titulo: event.target.value,
                    }))
                  }
                  placeholder={`Fase ${faseCreateModalState.numero}`}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/15"
                  autoFocus
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Descrição
                </label>
                <textarea
                  value={faseCreateDraft.descricao}
                  onChange={(event) =>
                    setFaseCreateDraft((prev) => ({
                      ...prev,
                      descricao: event.target.value,
                    }))
                  }
                  placeholder="Descreva a entrega ou o objetivo desta fase."
                  rows={4}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/15"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Data de início
                </label>
                <DatePicker
                  value={faseCreateDraft.dataInicio}
                  onChange={(value) =>
                    setFaseCreateDraft((prev) => ({
                      ...prev,
                      dataInicio: value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Data de fim
                </label>
                <DatePicker
                  value={faseCreateDraft.dataFim}
                  onChange={(value) =>
                    setFaseCreateDraft((prev) => ({
                      ...prev,
                      dataFim: value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Ao confirmar este modal, a fase será salva imediatamente.
            </div>
          </form>
        )}
      </AppModalShell>

      <AppModalShell
        isOpen={Boolean(metaPendingDeletion)}
        title="Excluir meta"
        description="Confirme a exclusão da meta antes de continuar."
        icon={<Trash2 className="h-5 w-5" />}
        tone="danger"
        onClose={closeDeleteMetaModal}
        maxWidthClassName="max-w-lg"
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeDeleteMetaModal}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                void confirmMetaDeletion();
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Excluir meta
            </button>
          </div>
        }
      >
        {metaPendingDeletion && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-800">
                Tem certeza de que deseja excluir esta meta?
              </p>
              <p className="mt-1 text-sm text-red-700">
                Esta ação remove a meta e toda a estrutura de etapas e fases vinculadas.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Meta selecionada
              </p>
              <p className="mt-1 font-medium text-slate-900">
                Meta {metaPendingDeletion.numero}: {metaPendingDeletion.titulo}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {metaPendingDeletion.etapas.length} etapa(s) vinculada(s)
              </p>
            </div>
          </div>
        )}
      </AppModalShell>

      <AppModalShell
        isOpen={Boolean(etapaPendingDeletion)}
        title="Excluir etapa"
        description="Confirme a exclusÃ£o da etapa antes de continuar."
        icon={<Trash2 className="h-5 w-5" />}
        tone="danger"
        onClose={closeDeleteEtapaModal}
        maxWidthClassName="max-w-lg"
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeDeleteEtapaModal}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                void confirmEtapaDeletion();
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Excluir etapa
            </button>
          </div>
        }
      >
        {etapaPendingDeletion && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-800">
                Tem certeza de que deseja excluir esta etapa?
              </p>
              <p className="mt-1 text-sm text-red-700">
                Esta aÃ§Ã£o remove a etapa e todas as fases vinculadas.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Etapa selecionada
              </p>
              <p className="mt-1 font-medium text-slate-900">
                Meta {etapaPendingDeletion.metaNumero} - Etapa {etapaPendingDeletion.etapa.numero}:{" "}
                {etapaPendingDeletion.etapa.titulo}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {etapaPendingDeletion.etapa.fases.length} fase(s) vinculada(s)
              </p>
            </div>
          </div>
        )}
      </AppModalShell>

      <AppModalShell
        isOpen={Boolean(fasePendingDeletion)}
        title="Excluir fase"
        description="Confirme a exclusÃ£o da fase antes de continuar."
        icon={<Trash2 className="h-5 w-5" />}
        tone="danger"
        onClose={closeDeleteFaseModal}
        maxWidthClassName="max-w-lg"
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeDeleteFaseModal}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                void confirmFaseDeletion();
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Excluir fase
            </button>
          </div>
        }
      >
        {fasePendingDeletion && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-800">
                Tem certeza de que deseja excluir esta fase?
              </p>
              <p className="mt-1 text-sm text-red-700">
                Esta aÃ§Ã£o remove a fase da etapa e nÃ£o pode ser desfeita.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Fase selecionada
              </p>
              <p className="mt-1 font-medium text-slate-900">
                Meta {fasePendingDeletion.metaNumero} - Etapa {fasePendingDeletion.etapaNumero} -{" "}
                Fase {fasePendingDeletion.fase.numero}: {fasePendingDeletion.fase.titulo}
              </p>
            </div>
          </div>
        )}
      </AppModalShell>
    </div>
  );
}
