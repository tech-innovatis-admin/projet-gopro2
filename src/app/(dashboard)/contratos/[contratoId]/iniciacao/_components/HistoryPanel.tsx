"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Check,
  ArrowRight,
  Plus,
} from "lucide-react";
import {
  type InitiationActivity,
  type InitiationActivityType,
  type StageHistoryEntry,
  type TimelineEvent,
  formatDateTime,
  getActivityTypeLabel,
} from "../../../funil/types";
import { DateTimePicker } from "./DateTimePicker";

// =============================================================================
// HISTORY PANEL - Painel de Histórico estilo Pipedrive
// Timeline unificada com tabs de filtro
// =============================================================================

type TimelineFilter = "all" | "activities" | "stage_changes";

type HistoryPanelProps = {
  activities: InitiationActivity[];
  stageHistory: StageHistoryEntry[];
  onToggleActivityStatus: (activityId: string) => void;
  onCreateActivity: (activity: Partial<InitiationActivity>) => void;
};

export function HistoryPanel({
  activities,
  stageHistory,
  onToggleActivityStatus,
  onCreateActivity,
}: HistoryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [filter, setFilter] = useState<TimelineFilter>("all");
  const [showNewActivityForm, setShowNewActivityForm] = useState(false);
  const [newActivity, setNewActivity] = useState({
    title: "",
    type: "INTERNAL_TASK" as InitiationActivityType,
    dueAt: "",
    description: "",
  });

  // Construir eventos unificados
  const timelineEvents = buildTimelineEvents(activities, stageHistory);

  // Filtrar eventos
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

    setNewActivity({
      title: "",
      type: "INTERNAL_TASK",
      dueAt: "",
      description: "",
    });
    setShowNewActivityForm(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-gray-900 hover:text-gray-700 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <h3 className="font-semibold">Histórico</h3>
          </button>
          
          <button
            onClick={() => setShowNewActivityForm(!showNewActivityForm)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nova Atividade
          </button>
        </div>

        {/* Tabs de Filtro */}
        {isExpanded && (
          <div className="flex gap-1.5 flex-wrap">
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
        )}
      </div>

      {/* Formulário de Nova Atividade */}
      {showNewActivityForm && isExpanded && (
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Título da atividade *"
              value={newActivity.title}
              onChange={(e) => setNewActivity(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
            />
            
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

      {/* Timeline com scroll */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto max-h-[500px]">
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
              {/* Linha vertical */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

              {/* Eventos */}
              <div>
                {filteredEvents.map((event) => (
                  <TimelineEventItem
                    key={event.id}
                    event={event}
                    onToggleActivityStatus={onToggleActivityStatus}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// FILTER TAB
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
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
        isActive 
          ? "bg-[#004225] text-white" 
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {label}
      <span className={`text-[10px] px-1 py-0.5 rounded ${
        isActive ? "bg-white/20" : "bg-gray-200"
      }`}>
        {count}
      </span>
    </button>
  );
}

// =============================================================================
// TIMELINE EVENT ITEM
// =============================================================================

type TimelineEventItemProps = {
  event: TimelineEvent;
  onToggleActivityStatus: (activityId: string) => void;
};

function TimelineEventItem({ event, onToggleActivityStatus }: TimelineEventItemProps) {
  if (event.type === "stage_change" && event.stageChange) {
    return <StageChangeItem stageChange={event.stageChange} />;
  }

  if (event.type === "activity" && event.activity) {
    return (
      <ActivityItem
        activity={event.activity}
        onToggleStatus={() => onToggleActivityStatus(event.activity!.id)}
      />
    );
  }

  return null;
}

// =============================================================================
// STAGE CHANGE ITEM - Linha de log simples
// =============================================================================

type StageChangeItemProps = {
  stageChange: StageHistoryEntry;
};

function StageChangeItem({ stageChange }: StageChangeItemProps) {
  const isInitialEntry = !stageChange.fromStageId;

  return (
    <div className="relative pl-10 py-2 hover:bg-gray-50 transition-colors border-b border-gray-100">
      {/* Marcador na timeline */}
      <div className="absolute left-3 w-5 h-5 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
        <ArrowRight className="h-2.5 w-2.5 text-gray-500" />
      </div>

      {/* Conteúdo */}
      <div className="pr-3">
        <div className="text-sm text-gray-800">
          {isInitialEntry ? (
            <span>
              Contrato criado em <span className="font-medium">{stageChange.toStageName}</span>
            </span>
          ) : (
            <span>
              Etapa: <span className="font-medium">{stageChange.fromStageName}</span>{" "}
              <span className="text-gray-400">→</span>{" "}
              <span className="font-medium">{stageChange.toStageName}</span>
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
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
// ACTIVITY ITEM - Item de atividade minimalista
// =============================================================================

type ActivityItemProps = {
  activity: InitiationActivity;
  onToggleStatus: () => void;
};

function ActivityItem({ activity, onToggleStatus }: ActivityItemProps) {
  const isDone = activity.status === "DONE";
  const isCanceled = activity.status === "CANCELED";
  const isPastDue = activity.dueAt && !isDone && new Date(activity.dueAt) < new Date();

  const getBgClass = () => {
    if (isDone) return "bg-green-50/30";
    if (isCanceled) return "bg-gray-50";
    if (isPastDue) return "bg-red-50/30";
    return "bg-blue-50/30";
  };

  return (
    <div className={`relative pl-10 py-2 hover:bg-gray-50 transition-colors border-b border-gray-100 ${getBgClass()}`}>
      {/* Bolinha clicável */}
      <button
        onClick={onToggleStatus}
        disabled={isCanceled}
        className="absolute left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all hover:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225] focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: isDone ? "#16a34a" : "white",
          borderColor: isDone ? "#16a34a" : isPastDue ? "#ef4444" : "#d1d5db",
        }}
        title={isDone ? "Desmarcar" : "Marcar como concluída"}
      >
        {isDone && <Check className="h-3 w-3 text-white" />}
      </button>

      {/* Conteúdo - Somente leitura (histórico) */}
      <div className="pr-3">
        {/* Título + tipo */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className={`text-sm font-medium text-gray-900 ${isDone ? "line-through text-gray-500" : ""}`}>
            {activity.title}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">
            {getActivityTypeLabel(activity.type)}
          </span>
        </div>

        {/* Meta */}
        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
          {activity.dueAt && (
            <span className={isPastDue ? "text-red-500 font-medium" : ""}>
              {isDone && activity.completedAt
                ? `Concluída ${formatDateTime(activity.completedAt)}`
                : formatDateTime(activity.dueAt)}
            </span>
          )}
          <span className="text-gray-300">•</span>
          <span>{activity.ownerName}</span>
          {isPastDue && !isDone && (
            <>
              <span className="text-gray-300">•</span>
              <span className="text-red-500 font-medium">Atrasada</span>
            </>
          )}
        </div>

        {/* Descrição */}
        {activity.description && (
          <div className="mt-1.5 px-2.5 py-1.5 bg-yellow-50/70 rounded border-l-2 border-yellow-300">
            <p className={`text-xs text-gray-600 ${isDone ? "text-gray-400" : ""}`}>
              {activity.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// FUNÇÃO AUXILIAR - Construir eventos de timeline
// =============================================================================

function buildTimelineEvents(
  activities: InitiationActivity[],
  stageHistory: StageHistoryEntry[]
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  activities.forEach((activity) => {
    const eventDate = activity.completedAt || activity.createdAt;
    events.push({
      id: `activity_${activity.id}`,
      type: "activity",
      date: eventDate,
      activity,
    });
  });

  stageHistory.forEach((entry) => {
    events.push({
      id: `stage_${entry.id}`,
      type: "stage_change",
      date: entry.movedAt,
      stageChange: entry,
    });
  });

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return events;
}
