"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { 
  type PipelineColumn, 
  type PipelineContract, 
  formatCurrency 
} from "../types";
import { ContractCard, ColumnHeader } from ".";

// =============================================================================
// PIPELINE BOARD - Kanban com Drag & Drop nativo
// =============================================================================

type PipelineBoardProps = {
  columns: PipelineColumn[];
  onMoveContract: (contractId: string, fromStageId: string, toStageId: string) => void;
  onStartProject: (contractId: string) => void;
};

export function PipelineBoard({ columns, onMoveContract, onStartProject }: PipelineBoardProps) {
  // Estado para controlar drag & drop
  const [draggedContract, setDraggedContract] = useState<PipelineContract | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);

  // Handlers de Drag & Drop
  const handleDragStart = useCallback((e: React.DragEvent, contract: PipelineContract) => {
    setDraggedContract(contract);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", contract.id);
    
    // Adiciona um pequeno delay para permitir que o browser capture o elemento
    requestAnimationFrame(() => {
      if (e.target instanceof HTMLElement) {
        e.target.style.opacity = "0.5";
      }
    });
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setDraggedContract(null);
    setDragOverStageId(null);
    
    if (e.target instanceof HTMLElement) {
      e.target.style.opacity = "1";
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStageId(stageId);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Só limpa se realmente saiu da coluna
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget?.closest('[data-stage-column]')) {
      setDragOverStageId(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toStageId: string) => {
    e.preventDefault();
    
    if (!draggedContract) return;
    
    const fromStageId = draggedContract.stageId;
    
    // Não faz nada se soltar na mesma coluna
    if (fromStageId === toStageId) {
      setDraggedContract(null);
      setDragOverStageId(null);
      return;
    }

    onMoveContract(draggedContract.id, fromStageId, toStageId);
    setDraggedContract(null);
    setDragOverStageId(null);
  }, [draggedContract, onMoveContract]);

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {columns.map((column) => (
          <div
            key={column.stage.id}
            data-stage-column
            className={`flex-shrink-0 w-80 bg-gray-50 rounded-xl border transition-all duration-200 ${
              dragOverStageId === column.stage.id
                ? "border-[#004225] border-2 bg-green-50/50 shadow-lg"
                : "border-gray-200"
            }`}
            onDragOver={(e) => handleDragOver(e, column.stage.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.stage.id)}
          >
            {/* Header da Coluna */}
            <ColumnHeader
              stage={column.stage}
              contractCount={column.contracts.length}
              totalValue={column.totalValue}
            />

            {/* Lista de Cards */}
            <div className="p-3 space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto custom-scrollbar">
              {column.contracts.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  {dragOverStageId === column.stage.id ? (
                    <span className="text-[#004225] font-medium">Solte aqui</span>
                  ) : (
                    <span>Nenhum contrato</span>
                  )}
                </div>
              ) : (
                column.contracts.map((contract) => (
                  <ContractCard
                    key={contract.id}
                    contract={contract}
                    isFinalStage={column.stage.isFinal}
                    isDragging={draggedContract?.id === contract.id}
                    onDragStart={(e: React.DragEvent) => handleDragStart(e, contract)}
                    onDragEnd={handleDragEnd}
                    onStartProject={() => onStartProject(contract.id)}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
