"use client";

import { useState } from "react";
import {
  type InitiationActivity,
  type InitiationActivityType,
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
  X,
  ChevronDown,
} from "lucide-react";
import { DateTimePicker } from "./DateTimePicker";

// =============================================================================
// INITIATION ACTIVITIES - Lista de atividades de iniciação
// =============================================================================

type ActivityFilter = "all" | "pending" | "done";

type InitiationActivitiesProps = {
  activities: InitiationActivity[];
  filter: ActivityFilter;
  onFilterChange: (filter: ActivityFilter) => void;
  onCompleteActivity: (activityId: string) => void;
  onCreateActivity: (activity: Partial<InitiationActivity>) => void;
  totalPending: number;
  totalDone: number;
};

export function InitiationActivities({
  activities,
  filter,
  onFilterChange,
  onCompleteActivity,
  onCreateActivity,
  totalPending,
  totalDone,
}: InitiationActivitiesProps) {
  const [showNewActivityForm, setShowNewActivityForm] = useState(false);
  const [newActivity, setNewActivity] = useState({
    title: "",
    type: "INTERNAL_TASK" as InitiationActivityType,
    dueAt: "",
    description: "",
  });

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
      {/* Header com Tabs */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Atividades de Iniciação</h3>
          <button
            onClick={() => setShowNewActivityForm(!showNewActivityForm)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nova Atividade
          </button>
        </div>

        {/* Tabs de Filtro */}
        <div className="flex gap-2">
          <FilterTab
            label="Todas"
            count={totalPending + totalDone}
            isActive={filter === "all"}
            onClick={() => onFilterChange("all")}
          />
          <FilterTab
            label="Pendentes"
            count={totalPending}
            isActive={filter === "pending"}
            onClick={() => onFilterChange("pending")}
            variant="warning"
          />
          <FilterTab
            label="Concluídas"
            count={totalDone}
            isActive={filter === "done"}
            onClick={() => onFilterChange("done")}
            variant="success"
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

      {/* Lista de Atividades */}
      <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
        {activities.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-sm">Nenhuma atividade encontrada</p>
            <p className="text-xs text-gray-400 mt-1">
              {filter === "pending" 
                ? "Todas as atividades foram concluídas!" 
                : filter === "done"
                  ? "Nenhuma atividade foi concluída ainda"
                  : "Crie uma nova atividade para começar"}
            </p>
          </div>
        ) : (
          activities.map((activity) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              onComplete={() => onCompleteActivity(activity.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// =============================================================================
// FILTER TAB - Tab de filtro
// =============================================================================

type FilterTabProps = {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  variant?: "default" | "warning" | "success";
};

function FilterTab({ label, count, isActive, onClick, variant = "default" }: FilterTabProps) {
  const getVariantStyles = () => {
    if (!isActive) return "bg-gray-100 text-gray-600 hover:bg-gray-200";
    
    switch (variant) {
      case "warning":
        return "bg-yellow-100 text-yellow-700";
      case "success":
        return "bg-green-100 text-green-700";
      default:
        return "bg-[#004225] text-white";
    }
  };

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${getVariantStyles()}`}
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
// ACTIVITY ITEM - Item de atividade individual
// =============================================================================

type ActivityItemProps = {
  activity: InitiationActivity;
  onComplete: () => void;
};

function ActivityItem({ activity, onComplete }: ActivityItemProps) {
  const isDone = activity.status === "DONE";
  const isCanceled = activity.status === "CANCELED";
  const isPastDue = activity.dueAt && !isDone && new Date(activity.dueAt) < new Date();

  return (
    <div className={`p-4 hover:bg-gray-50 transition-colors ${isDone ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        {/* Checkbox/Status */}
        <button
          onClick={onComplete}
          disabled={isDone || isCanceled}
          className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            isDone
              ? "bg-green-500 border-green-500 text-white cursor-default"
              : isCanceled
                ? "bg-gray-300 border-gray-300 text-white cursor-default"
                : "border-gray-300 hover:border-[#004225] hover:bg-[#004225]/5 cursor-pointer"
          }`}
        >
          {(isDone || isCanceled) && <Check className="h-3 w-3" />}
        </button>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getActivityTypeIconComponent(activity.type)}
            <span className="text-xs text-gray-500 font-medium">
              {getActivityTypeLabel(activity.type)}
            </span>
            {isPastDue && (
              <span className="text-xs text-red-600 font-medium">
                Atrasada
              </span>
            )}
          </div>

          <p className={`font-medium text-gray-900 ${isDone ? "line-through" : ""}`}>
            {activity.title}
          </p>

          {activity.description && (
            <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
          )}

          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
            {activity.dueAt && (
              <div className={`flex items-center gap-1 ${isPastDue ? "text-red-500" : ""}`}>
                <Calendar className="h-3 w-3" />
                <span>{formatDateTime(activity.dueAt)}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{activity.ownerName}</span>
            </div>
            {isDone && activity.completedAt && (
              <div className="flex items-center gap-1 text-green-600">
                <Check className="h-3 w-3" />
                <span>Concluída em {formatDateTime(activity.completedAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
