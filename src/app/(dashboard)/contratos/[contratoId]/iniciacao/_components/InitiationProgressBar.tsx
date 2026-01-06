"use client";

import { type InitiationStage, type StageHistoryEntry } from "../../../funil/types";
import { CheckCircle, Circle, Clock } from "lucide-react";

// =============================================================================
// INITIATION PROGRESS BAR - Barra de progresso dos estágios
// =============================================================================

type InitiationProgressBarProps = {
  stages: InitiationStage[];
  currentStageId: string;
  stageHistory: StageHistoryEntry[];
  onStageChange?: (stageId: string) => void;
};

export function InitiationProgressBar({
  stages,
  currentStageId,
  stageHistory,
  onStageChange,
}: InitiationProgressBarProps) {
  // Ordena estágios
  const sortedStages = [...stages].filter(s => s.isActive).sort((a, b) => a.order - b.order);
  
  // Encontra o índice do estágio atual
  const currentIndex = sortedStages.findIndex(s => s.id === currentStageId);

  // Calcula dias passados em cada estágio (do histórico)
  const getDaysInStage = (stageId: string): number | null => {
    const historyEntry = stageHistory.find(h => h.stageId === stageId);
    return historyEntry?.daysInStage ?? null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-6">Progresso da Iniciação</h3>
      
      {/* Barra de Progresso */}
      <div className="relative">
        {/* Linha de Conexão */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
        <div 
          className="absolute top-5 left-0 h-0.5 bg-[#004225] transition-all duration-500"
          style={{ 
            width: `${currentIndex >= 0 ? ((currentIndex) / (sortedStages.length - 1)) * 100 : 0}%` 
          }}
        />

        {/* Estágios */}
        <div className="relative flex justify-between">
          {sortedStages.map((stage, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isPending = index > currentIndex;
            const daysInStage = getDaysInStage(stage.id);

            return (
              <div
                key={stage.id}
                className="flex flex-col items-center cursor-pointer group"
                style={{ width: `${100 / sortedStages.length}%` }}
                onClick={() => onStageChange?.(stage.id)}
              >
                {/* Ícone do Estágio */}
                <div
                  className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                    isCompleted
                      ? "bg-[#004225] border-[#004225] text-white group-hover:ring-4 group-hover:ring-[#004225]/30"
                      : isCurrent
                        ? "bg-white border-[#004225] text-[#004225] ring-4 ring-[#004225]/20"
                        : "bg-white border-gray-300 text-gray-400 group-hover:border-[#004225]/50 group-hover:text-[#004225]/50"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : isCurrent ? (
                    <div className="w-3 h-3 bg-[#004225] rounded-full animate-pulse" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </div>

                {/* Nome do Estágio */}
                <div className="mt-3 text-center">
                  <p
                    className={`text-xs font-medium transition-colors ${
                      isCompleted || isCurrent
                        ? "text-gray-900"
                        : "text-gray-400 group-hover:text-[#004225]"
                    }`}
                  >
                    {stage.name}
                  </p>
                  
                  {/* Dias no Estágio */}
                  {(isCompleted || isCurrent) && (
                    <div className="flex items-center justify-center gap-1 mt-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>
                        {daysInStage !== null ? `${daysInStage}d` : "..."}
                      </span>
                    </div>
                  )}

                  {/* Badge de Estágio Final */}
                  {stage.isFinal && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded-full">
                      Final
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
