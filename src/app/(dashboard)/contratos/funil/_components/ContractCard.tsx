"use client";

import Link from "next/link";
import { type PipelineContract, formatCurrency } from "../types";
import { 
  AlertTriangle, 
  Clock, 
  User, 
  Building2, 
  GripVertical,
  Play,
  ExternalLink,
} from "lucide-react";

// =============================================================================
// CONTRACT CARD - Card de contrato no Kanban
// =============================================================================

type ContractCardProps = {
  contract: PipelineContract;
  isFinalStage: boolean;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onStartProject: () => void;
};

export function ContractCard({
  contract,
  isFinalStage,
  isDragging,
  onDragStart,
  onDragEnd,
  onStartProject,
}: ContractCardProps) {
  const hasWarnings = contract.warnings.length > 0;
  const isSlaExpired = contract.warnings.some(w => w.toLowerCase().includes("sla expirado"));
  const noActivities = contract.warnings.some(w => w.toLowerCase().includes("sem atividades"));

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`rounded-lg cursor-grab active:cursor-grabbing transition-all duration-200 liquid-glass-card ${
        isDragging 
          ? "opacity-50 rotate-2 scale-105" 
          : "opacity-100"
      } ${
        isSlaExpired 
          ? "border-l-4 border-l-red-500" 
          : hasWarnings 
            ? "border-l-4 border-l-yellow-500" 
            : ""
      }`}
    >
      {/* Handle de Drag */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-1">
        <GripVertical className="h-4 w-4 text-gray-300" />
        <span className="text-xs text-gray-400 font-mono">{contract.code}</span>
      </div>

      {/* Conteúdo Principal */}
      <div className="px-3 pb-3">
        {/* Título */}
        <Link 
          href={`/contratos/${contract.id}/iniciacao`}
          className="block group"
          onClick={(e) => e.stopPropagation()}
        >
          <h4 className="font-medium text-gray-900 text-sm mb-2 group-hover:text-[#004225] transition-colors line-clamp-2">
            {contract.title}
          </h4>
        </Link>

        {/* Parceiro */}
        {contract.partnerName && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <Building2 className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{contract.partnerName}</span>
          </div>
        )}

        {/* Valor e Tipo */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-900">
            {formatCurrency(contract.totalValue)}
          </span>
        </div>

        {/* Coordenador */}
        {contract.coordinatorName && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <User className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{contract.coordinatorName}</span>
          </div>
        )}

        {/* Dias no Estágio */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
          <Clock className="h-3 w-3" />
          <span>{contract.daysInStage} dias neste estágio</span>
        </div>

        {/* Warnings */}
        {hasWarnings && (
          <div className="space-y-1 mb-2">
            {contract.warnings.map((warning, idx) => (
              <div 
                key={idx}
                className={`flex items-center gap-1.5 text-xs ${
                  warning.toLowerCase().includes("expirado") 
                    ? "text-red-600" 
                    : "text-yellow-600"
                }`}
              >
                <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <Link
            href={`/contratos/${contract.id}/iniciacao`}
            className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
            Ver detalhes
          </Link>
          
          {isFinalStage && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartProject();
              }}
              className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-white bg-[#004225] rounded hover:bg-[#003319] transition-colors"
            >
              <Play className="h-3 w-3" />
              Iniciar Projeto
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
