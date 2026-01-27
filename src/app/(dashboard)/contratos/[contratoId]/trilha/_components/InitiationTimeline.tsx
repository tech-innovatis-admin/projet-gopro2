"use client";

import {
  type InitiationActivity,
  type StageHistoryEntry,
  type TimelineEvent,
  formatDateTime,
  getActivityTypeLabel,
  getActivityTypeIconComponent,
} from "../../../funil/types";
import {
  ArrowRight,
  Check,
  Clock,
  User,
  Calendar,
} from "lucide-react";

// =============================================================================
// INITIATION TIMELINE - Linha do tempo unificada (atividades + mudanças de etapa)
// =============================================================================

type InitiationTimelineProps = {
  activities: InitiationActivity[];
  stageHistory: StageHistoryEntry[];
};

export function InitiationTimeline({
  activities,
  stageHistory,
}: InitiationTimelineProps) {
  // Construir eventos unificados
  const timelineEvents = buildTimelineEvents(activities, stageHistory);

  if (timelineEvents.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
        <p className="text-sm">Nenhum evento registrado ainda</p>
        <p className="text-xs text-gray-400 mt-1">
          Movimentações de etapa e atividades aparecerão aqui
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Linha do Tempo</h3>
        <p className="text-xs text-gray-500 mt-1">
          Histórico de atividades e movimentações de etapa
        </p>
      </div>

      <div className="p-4">
        <div className="relative">
          {/* Linha vertical */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

          {/* Eventos */}
          <div className="space-y-4">
            {timelineEvents.map((event, index) => (
              <TimelineEventItem
                key={event.id}
                event={event}
                isFirst={index === 0}
                isLast={index === timelineEvents.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// TIMELINE EVENT ITEM - Renderiza um evento individual
// =============================================================================

type TimelineEventItemProps = {
  event: TimelineEvent;
  isFirst: boolean;
  isLast: boolean;
};

function TimelineEventItem({ event, isFirst, isLast }: TimelineEventItemProps) {
  if (event.type === "stage_change" && event.stageChange) {
    return <StageChangeCard stageChange={event.stageChange} isFirst={isFirst} />;
  }

  if (event.type === "activity" && event.activity) {
    return <ActivityCard activity={event.activity} />;
  }

  return null;
}

// =============================================================================
// STAGE CHANGE CARD - Card de mudança de etapa (estilo Pipedrive)
// =============================================================================

type StageChangeCardProps = {
  stageChange: StageHistoryEntry;
  isFirst: boolean;
};

function StageChangeCard({ stageChange, isFirst }: StageChangeCardProps) {
  const isInitialEntry = !stageChange.fromStageId;

  return (
    <div className="relative pl-10">
      {/* Círculo na linha do tempo */}
      <div className="absolute left-2 w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-sm flex items-center justify-center">
        <ArrowRight className="h-3 w-3 text-white" />
      </div>

      {/* Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        {/* Header com ícone e título */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
            Mudança de Etapa
          </span>
        </div>

        {/* Conteúdo principal */}
        <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
          {isInitialEntry ? (
            <>
              <span className="text-gray-500">Contrato criado em</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">
                {stageChange.toStageName}
              </span>
            </>
          ) : (
            <>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                {stageChange.fromStageName}
              </span>
              <ArrowRight className="h-4 w-4 text-blue-500" />
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">
                {stageChange.toStageName}
              </span>
            </>
          )}
        </div>

        {/* Dias na etapa anterior */}
        {stageChange.daysInPreviousStage !== null && stageChange.daysInPreviousStage > 0 && (
          <div className="flex items-center gap-1 mt-2 text-xs text-blue-600">
            <Clock className="h-3 w-3" />
            <span>{stageChange.daysInPreviousStage} dias na etapa anterior</span>
          </div>
        )}

        {/* Footer: Data e usuário */}
        <div className="flex items-center gap-4 mt-3 pt-2 border-t border-blue-200 text-xs text-blue-600">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDateTime(stageChange.movedAt)}</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{stageChange.movedByUserName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// ACTIVITY CARD - Card de atividade (estilo Pipedrive)
// =============================================================================

type ActivityCardProps = {
  activity: InitiationActivity;
};

function ActivityCard({ activity }: ActivityCardProps) {
  const isDone = activity.status === "DONE";
  const isCanceled = activity.status === "CANCELED";
  const isPending = activity.status === "PLANNED";

  // Determinar cor baseado no status
  const getCardStyles = () => {
    if (isDone) return "bg-green-50 border-green-200";
    if (isCanceled) return "bg-gray-50 border-gray-200 opacity-60";
    return "bg-yellow-50 border-yellow-200";
  };

  const getBadgeStyles = () => {
    if (isDone) return "text-green-700 bg-green-100";
    if (isCanceled) return "text-gray-700 bg-gray-100";
    return "text-yellow-700 bg-yellow-100";
  };

  const getCircleStyles = () => {
    if (isDone) return "bg-green-500";
    if (isCanceled) return "bg-gray-400";
    return "bg-yellow-500";
  };

  return (
    <div className="relative pl-10">
      {/* Círculo na linha do tempo */}
      <div className={`absolute left-2 w-5 h-5 rounded-full ${getCircleStyles()} border-2 border-white shadow-sm flex items-center justify-center`}>
        {isDone ? (
          <Check className="h-3 w-3 text-white" />
        ) : (
          <span className="w-2 h-2 bg-white rounded-full" />
        )}
      </div>

      {/* Card */}
      <div className={`border rounded-lg p-3 ${getCardStyles()}`}>
        {/* Header com tipo */}
        <div className="flex items-center gap-2 mb-2">
          {getActivityTypeIconComponent(activity.type)}
          <span className={`text-xs font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${getBadgeStyles()}`}>
            {getActivityTypeLabel(activity.type)}
          </span>
          {isDone && (
            <span className="text-xs text-green-600 font-medium">✓ Concluída</span>
          )}
          {isPending && activity.dueAt && new Date(activity.dueAt) < new Date() && (
            <span className="text-xs text-red-600 font-medium">Atrasada</span>
          )}
        </div>

        {/* Título */}
        <p className={`font-medium text-gray-900 ${isDone ? "line-through" : ""}`}>
          {activity.title}
        </p>

        {/* Descrição */}
        {activity.description && (
          <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
        )}

        {/* Footer: Data e responsável */}
        <div className="flex items-center gap-4 mt-3 pt-2 border-t border-gray-200/50 text-xs text-gray-500">
          {activity.dueAt && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                {isDone && activity.completedAt
                  ? `Concluída em ${formatDateTime(activity.completedAt)}`
                  : `Vence em ${formatDateTime(activity.dueAt)}`}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{activity.ownerName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// FUNÇÃO AUXILIAR - Construir eventos de timeline ordenados
// =============================================================================

function buildTimelineEvents(
  activities: InitiationActivity[],
  stageHistory: StageHistoryEntry[]
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Adicionar atividades
  activities.forEach((activity) => {
    // Usar completedAt se disponível, senão createdAt
    const eventDate = activity.completedAt || activity.createdAt;
    events.push({
      id: `activity_${activity.id}`,
      type: "activity",
      date: eventDate,
      activity,
    });
  });

  // Adicionar mudanças de etapa
  stageHistory.forEach((entry) => {
    events.push({
      id: `stage_${entry.id}`,
      type: "stage_change",
      date: entry.movedAt,
      stageChange: entry,
    });
  });

  // Ordenar por data (mais recente primeiro)
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return events;
}
