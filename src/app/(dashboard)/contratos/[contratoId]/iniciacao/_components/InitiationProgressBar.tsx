"use client";

import { type InitiationStage, type StageHistoryEntry } from "../../../funil/types";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";

// =============================================================================
// INITIATION PROGRESS BAR - Barra de progresso dos estágios (estilo Pipedrive)
// =============================================================================

type InitiationProgressBarProps = {
  stages: InitiationStage[];
  currentStageId: string;
  stageHistory: StageHistoryEntry[];
  onStageChange?: (stageId: string) => void;
  isLoading?: boolean;
};

export function InitiationProgressBar({
  stages,
  currentStageId,
  stageHistory,
  onStageChange,
  isLoading = false,
}: InitiationProgressBarProps) {
  // Ordena estágios
  const sortedStages = useMemo(() => {
    return [...stages].filter(s => s.isActive).sort((a, b) => a.order - b.order);
  }, [stages]);
  
  // Encontra o índice do estágio atual
  const currentIndex = sortedStages.findIndex(s => s.id === currentStageId);
  
  // Encontra o estágio atual
  const currentStage = sortedStages[currentIndex];

  // Calcula dias passados em cada estágio
  const getDaysInStage = (stageId: string, index: number): number | null => {
    const isCurrent = index === currentIndex;
    
    if (isCurrent) {
      // Para a etapa atual, calcula desde quando entrou nela
      // Procura a última entrada no histórico onde entrou nesta etapa (toStageId === stageId)
      const entryWhenEntered = stageHistory
        .filter(h => h.toStageId === stageId)
        .sort((a, b) => new Date(b.movedAt).getTime() - new Date(a.movedAt).getTime())[0];
      
      if (entryWhenEntered?.movedAt) {
        const enteredAt = new Date(entryWhenEntered.movedAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - enteredAt.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      
      return null;
    }
    
    // Para etapas concluídas, busca no histórico quando saiu desta etapa
    // Busca a entrada mais recente onde saiu desta etapa
    const historyEntries = stageHistory
      .filter(h => h.fromStageId === stageId)
      .sort((a, b) => new Date(b.movedAt).getTime() - new Date(a.movedAt).getTime());
    
    return historyEntries[0]?.daysInPreviousStage ?? null;
  };

  // Formata o texto de dias para exibição na barra (compacto)
  const formatDaysCompact = (days: number | null): string => {
    if (days === null) return "...";
    return `${days} dias`;
  };

  // Formata o texto de dias para exibição completa (tooltip e rótulo)
  const formatDaysFull = (days: number | null): string => {
    if (days === null) return "...";
    return `${days} ${days === 1 ? "dia" : "dias"}`;
  };

  // Gera tooltip para cada etapa
  const getTooltip = (stage: InitiationStage, index: number): string => {
    const isCompleted = index < currentIndex;
    const isCurrent = index === currentIndex;
    const days = getDaysInStage(stage.id, index);
    
    if (isCurrent) {
      return `${stage.name.toUpperCase()}\nEstá aqui há ${formatDaysFull(days)}`;
    }
    
    if (isCompleted) {
      return `${stage.name.toUpperCase()}\nFicou ${formatDaysFull(days)} nesta etapa`;
    }
    
    return `${stage.name.toUpperCase()}\nEtapa ainda não iniciada`;
  };

  // Handler para clique na etapa
  const handleStageClick = (stageId: string) => {
    // Permite clicar em qualquer etapa (incluindo voltar para etapas anteriores)
    if (stageId !== currentStageId) {
      onStageChange?.(stageId);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900">Fluxo de Preparação</h3>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Atualizando...</span>
          </div>
        )}
      </div>
      
      {/* Barra de Progresso Segmentada */}
      <div className="flex h-9 overflow-hidden rounded-full border border-gray-200">
        {sortedStages.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const days = getDaysInStage(stage.id, index);
          
          const baseColor = isCompleted || isCurrent 
            ? "bg-[#004225]" 
            : "bg-gray-200";
          const textColor = isCompleted || isCurrent 
            ? "text-white" 
            : "text-gray-700";
          
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => handleStageClick(stage.id)}
              className={`flex-1 flex items-center justify-center text-xs font-medium transition-colors ${
                baseColor
              } ${textColor} ${
                index !== sortedStages.length - 1 ? "border-r border-white/80" : ""
              } cursor-pointer hover:opacity-90`}
              title={getTooltip(stage, index)}
            >
              {formatDaysCompact(days)}
            </button>
          );
        })}
      </div>

      {/* Rótulo da Etapa Atual */}
      {currentStage && (
        <div className="mt-2 text-xs text-gray-600">
          Etapa atual: <span className="font-medium">{currentStage.name}</span> –{" "}
          {formatDaysFull(getDaysInStage(currentStage.id, currentIndex))} no estágio
        </div>
      )}
    </div>
  );
}
