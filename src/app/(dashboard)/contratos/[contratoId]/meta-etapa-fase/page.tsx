"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Edit,
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
  HttpError,
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
  if (error instanceof HttpError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Nao foi possivel carregar metas, etapas e fases.";
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
    label: "Concluido",
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editingDate, setEditingDate] = useState<{ id: string; type: "meta" | "etapa" | "fase"; field: "dataInicio" | "dataFim"; ids: string[] } | null>(null);
  const [editDateValue, setEditDateValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadHierarchy = useCallback(async () => {
    if (!Number.isFinite(projectId) || projectId <= 0) {
      setLoadError("ID do contrato invalido para carregar metas.");
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
          concluida: Boolean(goal.dataConclusao),
          dataConclusao: toDateOnly(goal.dataConclusao),
          etapas: nextEtapas,
        };
      });

      setMetas(nextMetas);
      setEditMetas(JSON.parse(JSON.stringify(nextMetas)));
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

  const handleEdit = () => {
    setEditMetas(JSON.parse(JSON.stringify(metas)));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditMetas(JSON.parse(JSON.stringify(metas)));
    setEditingId(null);
    setEditValue("");
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

  const persistHierarchyChanges = async () => {
    if (!Number.isFinite(projectId) || projectId <= 0) {
      throw new Error("ID do contrato invalido para salvar metas.");
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
      };

      const goalUpdatePayload: GoalUpdateDTO = {
        projectId,
        numero: meta.numero,
        titulo: normalizeRequiredTitle(meta.titulo, `Meta ${meta.numero}`),
        descricao: normalizeOptionalText(meta.descricao),
        dataInicio: normalizeOptionalDate(meta.dataInicio),
        dataFim: normalizeOptionalDate(meta.dataFim),
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
        };

        const stageUpdatePayload: StageUpdateDTO = {
          goalId,
          numero: etapa.numero,
          titulo: normalizeRequiredTitle(etapa.titulo, `Etapa ${etapa.numero}`),
          descricao: normalizeOptionalText(etapa.descricao),
          dataInicio: normalizeOptionalDate(etapa.dataInicio),
          dataFim: normalizeOptionalDate(etapa.dataFim),
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
    setIsSaving(true);
    setLoadError(null);
    try {
      await persistHierarchyChanges();
      await loadHierarchy();
      setEditingId(null);
      setEditValue("");
      setEditingDate(null);
      setEditDateValue("");
      setIsEditing(false);
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const updateMetaQuickField = (
    metaId: string,
    field: "titulo" | "descricao" | "dataInicio" | "dataFim",
    value: string
  ) => {
    setEditMetas((prev) =>
      prev.map((meta) =>
        meta.id !== metaId
          ? meta
          : field === "titulo"
            ? {
                ...meta,
                titulo: value.trim() === "" ? meta.titulo : value,
              }
            : {
                ...meta,
                [field]: value.trim() === "" ? undefined : value,
              }
      )
    );
  };

  const toggleMetaConcluida = async (metaId: string) => {
    if (isEditing) {
      setLoadError("Salve as alteracoes antes de concluir ou reabrir a meta.");
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
    if (isEditing) {
      setLoadError("Salve as alteracoes antes de concluir ou reabrir a etapa.");
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
    if (isEditing) {
      setLoadError("Salve as alteracoes antes de concluir ou reabrir a fase.");
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
  const addMeta = () => {
    const novoNumero = editMetas.length + 1;
    const novaMeta: Meta = {
      id: `meta-${Date.now()}`,
      numero: novoNumero,
      titulo: `Meta ${novoNumero}`,
      etapas: [],
    };
    setEditMetas([...editMetas, novaMeta]);
    setExpandedMetas((prev) => new Set(prev).add(novaMeta.id));
    setEditingId(novaMeta.id);
    setEditValue(novaMeta.titulo);
  };

  const addEtapa = (metaId: string) => {
    setEditMetas((prev) =>
      prev.map((meta) => {
        if (meta.id !== metaId) return meta;
        const novoNumero = meta.etapas.length + 1;
        const novaEtapa: Etapa = {
          id: `etapa-${Date.now()}`,
          numero: novoNumero,
          titulo: `Etapa ${novoNumero}`,
          fases: [],
        };
        return { ...meta, etapas: [...meta.etapas, novaEtapa] };
      })
    );
  };

  const addFase = (metaId: string, etapaId: string) => {
    setEditMetas((prev) =>
      prev.map((meta) => {
        if (meta.id !== metaId) return meta;
        return {
          ...meta,
          etapas: meta.etapas.map((etapa) => {
            if (etapa.id !== etapaId) return etapa;
            const novoNumero = etapa.fases.length + 1;
            const novaFase: Fase = {
              id: `fase-${Date.now()}`,
              numero: novoNumero,
              titulo: `Fase ${novoNumero}`,
            };
            return { ...etapa, fases: [...etapa.fases, novaFase] };
          }),
        };
      })
    );
  };

  const removeMeta = async (id: string) => {
    const meta = editMetas.find((item) => item.id === id);
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

  const removeEtapa = async (metaId: string, etapaId: string) => {
    const meta = editMetas.find((item) => item.id === metaId);
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
    const meta = editMetas.find((item) => item.id === metaId);
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

  const startEdit = (id: string, value: string) => {
    setEditingId(id);
    setEditValue(value);
  };

  const saveEditItem = (type: "meta" | "etapa" | "fase", ids: string[]) => {
    if (type === "meta") {
      setEditMetas((prev) =>
        prev.map((m) => (m.id === ids[0] ? { ...m, titulo: editValue } : m))
      );
    } else if (type === "etapa") {
      setEditMetas((prev) =>
        prev.map((m) =>
          m.id === ids[0]
            ? {
                ...m,
                etapas: m.etapas.map((e) =>
                  e.id === ids[1] ? { ...e, titulo: editValue } : e
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
                          f.id === ids[2] ? { ...f, titulo: editValue } : f
                        ),
                      }
                    : e
                ),
              }
            : m
        )
      );
    }
    setEditingId(null);
    setEditValue("");
  };

  const cancelEditItem = () => {
    setEditingId(null);
    setEditValue("");
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
  const currentMetas = isEditing ? editMetas : metas;
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Meta, Etapa e Fase
          </h2>
          <p className="text-sm text-slate-500">
            Estrutura estrategica e operacional do contrato {contratoId}!
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {savedMessage && (
            <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700">
              <CheckCircle className="h-4 w-4" />
              Salvo com sucesso
            </div>
          )}
          <button
            onClick={() => {
              if (!isEditing) {
                handleEdit();
              }
              addMeta();
            }}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-xs font-medium text-[#004225] transition-colors hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <Plus className="h-4 w-4" />
            Nova Meta
          </button>
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="inline-flex items-center gap-2 rounded-md bg-[#004225] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#003319] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <Edit className="h-4 w-4" />
              Editar
            </button>
          ) : (
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
            {isEditing
              ? "Adicione metas para estruturar o contrato."
              : "Clique em Editar para adicionar metas."}
          </p>
          {isEditing && (
            <button
              onClick={addMeta}
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
                {isEditing && editingId === meta.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 rounded border border-[#004225] bg-white px-2 py-1 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004225]/20"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEditItem("meta", [meta.id]);
                        if (e.key === "Escape") cancelEditItem();
                      }}
                    />
                    <button
                      onClick={() => saveEditItem("meta", [meta.id])}
                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={cancelEditItem}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium text-gray-900">
                      {meta.titulo}
                    </span>
                    {isEditing && (
                      <button
                        onClick={() => startEdit(meta.id, meta.titulo)}
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-slate-200 rounded transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                  </>
                )}
                <div className="flex items-center gap-2">
                  <StatusChip status={metaIndicators.status} />
                  <button
                    onClick={() => {
                      void toggleMetaConcluida(meta.id);
                    }}
                    disabled={isEditing}
                    title={isEditing ? "Salve as alteracoes antes de concluir/reabrir." : undefined}
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
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    {editingDate?.id === meta.id && editingDate?.field === "dataInicio" ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="date"
                          value={editDateValue}
                          onChange={(e) => setEditDateValue(e.target.value)}
                          className="rounded border border-[#004225] bg-white px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004225]/20"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEditDate();
                            if (e.key === "Escape") cancelEditDate();
                          }}
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
                        <input
                          type="date"
                          value={editDateValue}
                          onChange={(e) => setEditDateValue(e.target.value)}
                          className="rounded border border-[#004225] bg-white px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004225]/20"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEditDate();
                            if (e.key === "Escape") cancelEditDate();
                          }}
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
                {isEditing && (
                  <button
                    onClick={() => {
                      void removeMeta(meta.id);
                    }}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    title="Excluir meta"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="border-b border-slate-200 bg-white px-4 py-2">
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="h-3.5 w-3.5 text-slate-500" />
                    {formatDate(meta.dataInicio)} ate {formatDate(meta.dataFim)}
                  </span>
                  {meta.concluida && meta.dataConclusao && (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      Concluida em {formatDate(meta.dataConclusao)}
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
                  {isEditing && (
                    <div className="rounded-lg border border-slate-200 bg-slate-100 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                          Edicao rapida da meta
                        </p>
                        <span className="text-[11px] text-slate-600">
                          Campos principais
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-1 text-xs text-slate-600">
                          <span className="font-medium text-slate-700">Titulo</span>
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
                          <span className="font-medium text-slate-700">Descricao</span>
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
                          <span className="font-medium text-slate-700">Data de inicio</span>
                          <input
                            type="date"
                            value={meta.dataInicio ?? ""}
                            onChange={(event) =>
                              updateMetaQuickField(meta.id, "dataInicio", event.target.value)
                            }
                            className="h-9 rounded-md border border-[#004225] bg-white px-2.5 text-sm text-slate-900 outline-none transition focus:border-[#004225] focus:ring-2 focus:ring-[#004225]/20"
                          />
                        </label>

                        <label className="flex flex-col gap-1 text-xs text-slate-600">
                          <span className="font-medium text-slate-700">Data de fim</span>
                          <input
                            type="date"
                            value={meta.dataFim ?? ""}
                            onChange={(event) =>
                              updateMetaQuickField(meta.id, "dataFim", event.target.value)
                            }
                            className="h-9 rounded-md border border-[#004225] bg-white px-2.5 text-sm text-slate-900 outline-none transition focus:border-[#004225] focus:ring-2 focus:ring-[#004225]/20"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {meta.etapas.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 text-sm">
                      Nenhuma etapa cadastrada.
                      {isEditing && (
                        <button
                          onClick={() => addEtapa(meta.id)}
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
                            {isEditing && editingId === etapa.id ? (
                              <div className="flex-1 flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="flex-1 px-2 py-1 text-sm border border-[#004225] rounded focus:outline-none focus:ring-2 focus:ring-[#004225]/20"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      saveEditItem("etapa", [meta.id, etapa.id]);
                                    if (e.key === "Escape") cancelEditItem();
                                  }}
                                />
                                <button
                                  onClick={() =>
                                    saveEditItem("etapa", [meta.id, etapa.id])
                                  }
                                  className="p-1 text-green-600 hover:bg-green-100 rounded"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={cancelEditItem}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="flex-1 text-sm text-gray-800">
                                  {etapa.titulo}
                                </span>
                                {isEditing && (
                                  <button
                                    onClick={() => startEdit(etapa.id, etapa.titulo)}
                                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </>
                            )}
                            <StatusChip status={etapaIndicators.status} />
                            <button
                              onClick={() => {
                                void toggleEtapaConcluida(meta.id, etapa.id);
                              }}
                              disabled={isEditing}
                              title={isEditing ? "Salve as alteracoes antes de concluir/reabrir." : undefined}
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
                                    <input
                                      type="date"
                                      value={editDateValue}
                                      onChange={(e) => setEditDateValue(e.target.value)}
                                      className="px-2 py-0.5 text-xs border border-[#004225] rounded focus:outline-none focus:ring-2 focus:ring-[#004225]/20"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") saveEditDate();
                                        if (e.key === "Escape") cancelEditDate();
                                      }}
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
                                    <input
                                      type="date"
                                      value={editDateValue}
                                      onChange={(e) => setEditDateValue(e.target.value)}
                                      className="px-2 py-0.5 text-xs border border-[#004225] rounded focus:outline-none focus:ring-2 focus:ring-[#004225]/20"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") saveEditDate();
                                        if (e.key === "Escape") cancelEditDate();
                                      }}
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
                            {isEditing && (
                              <button
                                onClick={() => {
                                  void removeEtapa(meta.id, etapa.id);
                                }}
                                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Excluir etapa"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                            <span className="inline-flex items-center gap-1">
                              <CalendarClock className="h-3.5 w-3.5 text-slate-500" />
                              {formatDate(etapa.dataInicio)} ate {formatDate(etapa.dataFim)}
                            </span>
                            {etapa.concluida && etapa.dataConclusao && (
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                Concluida em {formatDate(etapa.dataConclusao)}
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
                                  {isEditing && (
                                    <button
                                      onClick={() => addFase(meta.id, etapa.id)}
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
                                      {isEditing && editingId === fase.id ? (
                                        <div className="flex-1 flex items-center gap-2">
                                          <input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) =>
                                              setEditValue(e.target.value)
                                            }
                                            className="flex-1 px-2 py-0.5 text-xs border border-[#004225] rounded focus:outline-none focus:ring-2 focus:ring-[#004225]/20"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter")
                                                saveEditItem("fase", [
                                                  meta.id,
                                                  etapa.id,
                                                  fase.id,
                                                ]);
                                              if (e.key === "Escape") cancelEditItem();
                                            }}
                                          />
                                          <button
                                            onClick={() =>
                                              saveEditItem("fase", [
                                                meta.id,
                                                etapa.id,
                                                fase.id,
                                              ])
                                            }
                                            className="p-0.5 text-green-600 hover:bg-green-100 rounded"
                                          >
                                            <Check className="h-3 w-3" />
                                          </button>
                                          <button
                                            onClick={cancelEditItem}
                                            className="p-0.5 text-red-600 hover:bg-red-100 rounded"
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        </div>
                                      ) : (
                                        <>
                                          <span className="flex-1 text-xs text-gray-700">
                                            {fase.titulo}
                                          </span>
                                          {isEditing && (
                                            <button
                                              onClick={() =>
                                                startEdit(fase.id, fase.titulo)
                                              }
                                              className="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                                            >
                                              <Edit2 className="h-3 w-3" />
                                            </button>
                                          )}
                                        </>
                                      )}
                                      <StatusChip status={faseIndicators.status} />
                                      <button
                                        onClick={() => {
                                          void toggleFaseConcluida(meta.id, etapa.id, fase.id);
                                        }}
                                        disabled={isEditing}
                                        title={isEditing ? "Salve as alteracoes antes de concluir/reabrir." : undefined}
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
                                              <input
                                                type="date"
                                                value={editDateValue}
                                                onChange={(e) => setEditDateValue(e.target.value)}
                                                className="px-1.5 py-0.5 text-xs border border-[#004225] rounded focus:outline-none focus:ring-2 focus:ring-[#004225]/20"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter") saveEditDate();
                                                  if (e.key === "Escape") cancelEditDate();
                                                }}
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
                                              <input
                                                type="date"
                                                value={editDateValue}
                                                onChange={(e) => setEditDateValue(e.target.value)}
                                                className="px-1.5 py-0.5 text-xs border border-[#004225] rounded focus:outline-none focus:ring-2 focus:ring-[#004225]/20"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter") saveEditDate();
                                                  if (e.key === "Escape") cancelEditDate();
                                                }}
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
                                          Concluida em {formatDate(fase.dataConclusao)}
                                        </span>
                                      )}
                                      {isEditing && (
                                        <button
                                          onClick={() =>
                                            void removeFase(meta.id, etapa.id, fase.id)
                                          }
                                          className="p-0.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                          title="Excluir fase"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      )}
                                    </div>
                                  );
                                  })}
                                </>
                              )}
                              {isEditing && (
                                <button
                                  onClick={() => addFase(meta.id, etapa.id)}
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
                  {isEditing && (
                    <button
                      onClick={() => addEtapa(meta.id)}
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
    </div>
  );
}
