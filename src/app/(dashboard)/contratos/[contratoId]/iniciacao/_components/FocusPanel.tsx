"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Check,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  X,
} from "lucide-react";
import {
  type InitiationActivity,
  type InitiationActivityType,
  formatDateTime,
  getActivityTypeLabel,
} from "../../../funil/types";
import { DateTimePicker } from "./DateTimePicker";

// =============================================================================
// FOCUS PANEL - Painel de Foco estilo Pipedrive
// Mostra a próxima atividade em destaque
// =============================================================================

type FocusPanelProps = {
  activities: InitiationActivity[];
  onToggleActivityStatus: (activityId: string) => void;
  onEditActivity: (activityId: string, updatedData: Partial<InitiationActivity>) => void;
  onDeleteActivity: (activityId: string) => void;
  // onCreateActivity removido
};

export function FocusPanel({
  activities,
  onToggleActivityStatus,
  onEditActivity,
  onDeleteActivity,
}: FocusPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Encontrar a próxima atividade pendente (mais próxima da data de vencimento)
  const nextActivity = activities
    .filter(a => a.status === "PLANNED")
    .sort((a, b) => {
      if (!a.dueAt && !b.dueAt) return 0;
      if (!a.dueAt) return 1;
      if (!b.dueAt) return -1;
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    })[0] || null;

  const isPastDue = nextActivity?.dueAt && new Date(nextActivity.dueAt) < new Date();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-gray-900 hover:text-gray-700 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <h3 className="font-semibold">Foco</h3>
          </button>
          
          {/* Placeholder para toggle "Expandir todos os itens" */}
          <div className="text-xs text-gray-400">
            {/* Toggle futuro */}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      {isExpanded && (
        <div className="p-4">
          {nextActivity ? (
            <FocusActivityCard
              activity={nextActivity}
              isPastDue={!!isPastDue}
              onToggleStatus={() => onToggleActivityStatus(nextActivity.id)}
              onEdit={(updatedData) => onEditActivity(nextActivity.id, updatedData)}
              onDelete={() => onDeleteActivity(nextActivity.id)}
            />
          ) : (
            <EmptyFocusState />
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// FOCUS ACTIVITY CARD - Card da atividade em foco (mais destacado)
// =============================================================================

type FocusActivityCardProps = {
  activity: InitiationActivity;
  isPastDue: boolean;
  onToggleStatus: () => void;
  onEdit: (updatedData: Partial<InitiationActivity>) => void;
  onDelete: () => void;
};

function FocusActivityCard({ activity, isPastDue, onToggleStatus, onEdit, onDelete }: FocusActivityCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditingModal, setIsEditingModal] = useState(false);
  const [editData, setEditData] = useState({
    title: activity.title,
    type: activity.type as InitiationActivityType,
    dueAt: activity.dueAt || "",
    description: activity.description || "",
  });

  const isDone = activity.status === "DONE";

  const handleSaveEdit = () => {
    onEdit({
      title: editData.title || activity.title,
      type: editData.type,
      dueAt: editData.dueAt || null,
      description: editData.description || undefined,
    });
    setIsEditingModal(false);
    setShowMenu(false);
  };

  const handleDeleteConfirm = () => {
    if (window.confirm("Tem certeza que deseja excluir esta atividade?")) {
      onDelete();
      setShowMenu(false);
    }
  };

  return (
    <>
      <div className="flex gap-3 relative">
        {/* Bolinha clicável */}
        <button
          onClick={onToggleStatus}
          className="flex-shrink-0 w-6 h-6 mt-0.5 rounded-full border-2 flex items-center justify-center transition-all hover:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225] focus:ring-offset-1"
          style={{
            backgroundColor: isDone ? "#16a34a" : "white",
            borderColor: isDone ? "#16a34a" : isPastDue ? "#ef4444" : "#d1d5db",
            cursor: "pointer",
          }}
          title={isDone ? "Desmarcar como concluída" : "Marcar como concluída"}
        >
          {isDone && <Check className="h-3.5 w-3.5 text-white" />}
        </button>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          {/* Título */}
          <div className="flex items-baseline gap-2">
            <span className={`font-medium text-gray-900 ${isDone ? "line-through text-gray-500" : ""}`}>
              {activity.title}
            </span>
          </div>

          {/* Meta: data, responsável, tipo */}
          <div className="text-sm text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
            {activity.dueAt && (
              <span className={isPastDue ? "text-red-500 font-medium" : ""}>
                {formatDateTime(activity.dueAt)}
              </span>
            )}
            <span className="text-gray-300">•</span>
            <span>{activity.ownerName}</span>
            <span className="text-gray-300">•</span>
            <span className="text-xs uppercase tracking-wide text-gray-400">
              {getActivityTypeLabel(activity.type)}
            </span>
            {isPastDue && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-red-500 font-medium text-xs">Atrasada</span>
              </>
            )}
          </div>

          {/* Descrição com fundo suave */}
          {activity.description && (
            <div className="mt-2 px-3 py-2 bg-yellow-50 rounded-lg border-l-2 border-yellow-300">
              <p className="text-sm text-gray-700">{activity.description}</p>
            </div>
          )}
        </div>

        {/* Menu de ações */}
        <div className="absolute right-0 top-0">
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-400 hover:text-gray-600"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <button
                  onClick={() => setIsEditingModal(true)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Editar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Edição */}
      {isEditingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Editar Atividade</h3>
              <button
                onClick={() => setIsEditingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-4 py-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Título</label>
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Tipo</label>
                <select
                  value={editData.type}
                  onChange={(e) => setEditData(prev => ({ ...prev, type: e.target.value as InitiationActivityType }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                >
                  <option value="INTERNAL_TASK">Tarefa Interna</option>
                  <option value="MEETING">Reunião</option>
                  <option value="CALL">Ligação</option>
                  <option value="EMAIL">E-mail</option>
                  <option value="DOCUMENT">Documento</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Data e Hora</label>
                <DateTimePicker
                  value={editData.dueAt}
                  onChange={(value) => setEditData(prev => ({ ...prev, dueAt: value }))}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Descrição</label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] resize-none"
                  placeholder="Descrição opcional..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200">
              <button
                onClick={() => setIsEditingModal(false)}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1.5 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319]"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// =============================================================================
// EMPTY FOCUS STATE - Estado vazio quando não há atividades pendentes
// =============================================================================

type EmptyFocusStateProps = {
  // onCreateActivity removido
};

function EmptyFocusState({ onCreateActivity }: EmptyFocusStateProps) {
  return (
    <div className="text-center py-4">
      <p className="text-gray-500 text-sm mb-3">
        Nenhuma atividade pendente.
      </p>
    </div>
  );
}
