"use client";

import { useState } from "react";
import {
  type InitiationActivity,
  type InitiationActivityType,
  type StageHistoryEntry,
  type TimelineEvent,
  formatDateTime,
  getActivityTypeLabel,
  getActivityTypeIconComponent,
} from "../../../funil/types";
import {
  Plus,
  Check,
  Calendar,
  User,
  Clock,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { DateTimePicker } from "./DateTimePicker";

// =============================================================================
// UNIFIED ACTIVITY TIMELINE - Timeline unificada estilo Pipedrive
// Combina formulário de criação de atividades + histórico completo
// =============================================================================

type TimelineFilter = "all" | "activities" | "stage_changes";

type UnifiedActivityTimelineProps = {
  activities: InitiationActivity[];
  stageHistory: StageHistoryEntry[];
  onCompleteActivity: (activityId: string) => void;
  onCreateActivity: (activity: Partial<InitiationActivity>) => void;
};

export function UnifiedActivityTimeline({
  activities,
  stageHistory,
  onCompleteActivity,
  onCreateActivity,
}: UnifiedActivityTimelineProps) {
  const [showNewActivityForm, setShowNewActivityForm] = useState(false);
  const [filter, setFilter] = useState<TimelineFilter>("all");
  const [newActivity, setNewActivity] = useState({
    title: "",
    type: "INTERNAL_TASK" as InitiationActivityType,
    dueAt: "",
    description: "",
  });

  // Construir eventos unificados
  const timelineEvents = buildTimelineEvents(activities, stageHistory);

  // Filtrar eventos baseado no filtro
  const filteredEvents = timelineEvents.filter(event => {
    if (filter === "all") return true;
    if (filter === "activities") return event.type === "activity";
    if (filter === "stage_changes") return event.type === "stage_change";
    return true;
  });

  // Contadores
  const totalActivities = activities.length;
  const totalStageChanges = stageHistory.length;
  const totalEvents = timelineEvents.length;

  const handleSubmitNewActivity = () => {
    if (!newActivity.title.trim()) return;
    
    onCreateActivity({
      title: newActivity.title,
      type: newActivity.type,
      dueAt: newActivity.dueAt || null,
      description: newActivity.description || undefined,
    });

    // Reset form
    setNewActivity({
      title: "",
      type: "INTERNAL_TASK",
      dueAt: "",
      description: "",
    });
    setShowNewActivityForm(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header com botão Nova Atividade */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Histórico e Atividades</h3>
          <button
            onClick={() => setShowNewActivityForm(!showNewActivityForm)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nova Atividade
          </button>
        </div>

        {/* Tabs de Filtro estilo Pipedrive */}
        <div className="flex gap-2">
          <FilterTab
            label="Todos"
            count={totalEvents}
            isActive={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <FilterTab
            label="Atividades"
            count={totalActivities}
            isActive={filter === "activities"}
            onClick={() => setFilter("activities")}
          />
          <FilterTab
            label="Mudanças de Etapa"
            count={totalStageChanges}
            isActive={filter === "stage_changes"}
            onClick={() => setFilter("stage_changes")}
          />
        </div>
      </div>

      {/* Formulário de Nova Atividade */}
      {showNewActivityForm && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Título da atividade *"
                value={newActivity.title}
                onChange={(e) => setNewActivity(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <select
                value={newActivity.type}
                onChange={(e) => setNewActivity(prev => ({ ...prev, type: e.target.value as InitiationActivityType }))}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
              >
                <option value="INTERNAL_TASK">Tarefa Interna</option>
                <option value="MEETING">Reunião</option>
                <option value="CALL">Ligação</option>
                <option value="EMAIL">E-mail</option>
                <option value="DOCUMENT">Documento</option>
              </select>

              <DateTimePicker
                value={newActivity.dueAt}
                onChange={(value) => setNewActivity(prev => ({ ...prev, dueAt: value }))}
              />
            </div>

            <textarea
              placeholder="Descrição (opcional)"
              value={newActivity.description}
              onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] resize-none"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewActivityForm(false)}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitNewActivity}
                disabled={!newActivity.title.trim()}
                className="px-3 py-1.5 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Criar Atividade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline unificada - minimalista */}
      <div className="p-0">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 px-4 text-gray-500">
            <p className="text-sm">Nenhum evento registrado ainda</p>
            <p className="text-xs text-gray-400 mt-1">
              {filter === "activities" 
                ? "Crie uma nova atividade para começar" 
                : filter === "stage_changes"
                  ? "Movimentações de etapa aparecerão aqui"
                  : "Atividades e movimentações aparecerão aqui"}
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Linha vertical - discreta */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

            {/* Eventos */}
            <div className="divide-y divide-gray-100">
              {filteredEvents.map((event) => (
                <TimelineEventItem
                  key={event.id}
                  event={event}
                  onCompleteActivity={onCompleteActivity}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// FILTER TAB - Tab de filtro estilo Pipedrive
// =============================================================================

type FilterTabProps = {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
};

function FilterTab({ label, count, isActive, onClick }: FilterTabProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
        isActive 
          ? "bg-[#004225] text-white" 
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {label}
      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
        isActive ? "bg-white/20" : "bg-gray-200"
      }`}>
        {count}
      </span>
    </button>
  );
}

// =============================================================================
// TIMELINE EVENT ITEM - Renderiza um evento individual
// =============================================================================

type TimelineEventItemProps = {
  event: TimelineEvent;
  onCompleteActivity: (activityId: string) => void;
};

function TimelineEventItem({ event, onCompleteActivity }: TimelineEventItemProps) {
  if (event.type === "stage_change" && event.stageChange) {
    return <StageChangeCard stageChange={event.stageChange} />;
  }

  if (event.type === "activity" && event.activity) {
    return <ActivityCard activity={event.activity} onComplete={() => onCompleteActivity(event.activity!.id)} />;
  }

  return null;
}

// =============================================================================
// STAGE CHANGE CARD - Card minimalista de mudança de etapa (estilo Pipedrive)
// =============================================================================

type StageChangeCardProps = {
  stageChange: StageHistoryEntry;
};

function StageChangeCard({ stageChange }: StageChangeCardProps) {
  const isInitialEntry = !stageChange.fromStageId;

  return (
    <div className="relative pl-10 py-2.5 border-b border-gray-100 hover:bg-gray-50 transition-colors">
      {/* Círculo na linha do tempo - marcador não-clicável */}
      <div className="absolute left-1 w-6 h-6 rounded-full bg-gray-300 border border-white shadow-sm flex items-center justify-center flex-shrink-0">
        <ArrowRight className="h-3 w-3 text-white" />
      </div>

      {/* Conteúdo: duas linhas simples */}
      <div className="pr-2">
        {/* Primeira linha: O que aconteceu */}
        <div className="text-sm text-gray-900">
          {isInitialEntry ? (
            <span>
              Contrato criado em <span className="font-medium">{stageChange.toStageName}</span>
            </span>
          ) : (
            <span>
              Etapa: <span className="font-medium">{stageChange.fromStageName}</span> →{" "}
              <span className="font-medium">{stageChange.toStageName}</span>
            </span>
          )}
        </div>

        {/* Segunda linha: Metadados em cinza claro */}
        <div className="text-xs text-gray-500 mt-1">
          {formatDateTime(stageChange.movedAt)} – {stageChange.movedByUserName}
          {stageChange.daysInPreviousStage !== null && stageChange.daysInPreviousStage > 0 && (
            <> – {stageChange.daysInPreviousStage} dias na etapa anterior</>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// ACTIVITY CARD - Card minimalista de atividade (estilo Pipedrive)
// =============================================================================

type ActivityCardProps = {
  activity: InitiationActivity;
  onComplete: () => void;
};

function ActivityCard({ activity, onComplete }: ActivityCardProps) {
  const isDone = activity.status === "DONE";
  const isCanceled = activity.status === "CANCELED";
  const isPending = activity.status === "PLANNED";
  const isPastDue = activity.dueAt && !isDone && new Date(activity.dueAt) < new Date();

  // Cores baseado no status
  const getBgStyles = () => {
    if (isDone) return "bg-green-50/50";
    if (isCanceled) return "bg-gray-50";
    if (isPastDue) return "bg-red-50/40"; // Vencida
    return "bg-blue-50/40"; // Em aberto
  };

  // Handler para toggle de conclusão
  const handleToggleStatus = () => {
    onComplete();
  };

  return (
    <div className="relative pl-10">
      {/* Bolinha clicável - controle principal de conclusão */}
      <button
        onClick={handleToggleStatus}
        disabled={isCanceled}
        className="absolute left-0 w-6 h-6 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center flex-shrink-0 transition-all hover:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225] focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: isDone ? "#16a34a" : "white",
          borderColor: isDone ? "#16a34a" : isPending && !isPastDue ? "#d1d5db" : isPastDue ? "#ef4444" : "#9ca3af",
          cursor: isCanceled ? "not-allowed" : "pointer",
        }}
        title={isDone ? "Desmarcar como concluída" : "Marcar como concluída"}
        aria-label={isDone ? "Desmarcar como concluída" : "Marcar como concluída"}
      >
        {isDone && <Check className="h-3.5 w-3.5 text-white" />}
      </button>

      {/* Conteúdo: layout simples e compacto */}
      <div className={`py-2.5 border-b border-gray-100 hover:bg-gray-50 transition-colors ${getBgStyles()}`}>
        <div className="pr-2">
          {/* Primeira linha: Título + tipo pequeno */}
          <div className="flex items-baseline gap-2">
            <span className={`text-sm font-medium text-gray-900 ${isDone ? "line-through text-gray-500" : ""}`}>
              {activity.title}
            </span>
            <span className="text-xs text-gray-400 uppercase tracking-wide">
              {getActivityTypeLabel(activity.type)}
            </span>
          </div>

          {/* Descrição se houver (linha menor) */}
          {activity.description && (
            <p className={`text-xs text-gray-600 mt-0.5 ${isDone ? "text-gray-400" : ""}`}>
              {activity.description}
            </p>
          )}

          {/* Segunda linha: Metadados em cinza claro */}
          <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
            {activity.dueAt && (
              <>
                {isDone && activity.completedAt
                  ? `Concluída ${formatDateTime(activity.completedAt)}`
                  : `Vence ${formatDateTime(activity.dueAt)}`}
                <span className="text-gray-300">•</span>
              </>
            )}
            <span>{activity.ownerName}</span>
            {isPastDue && !isDone && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-red-500 font-medium">Atrasada</span>
              </>
            )}
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
