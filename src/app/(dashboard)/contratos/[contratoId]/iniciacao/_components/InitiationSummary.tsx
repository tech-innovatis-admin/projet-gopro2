"use client";

import { 
  type PipelineContract, 
  type InitiationStage, 
  formatCurrency 
} from "../../../funil/types";
import { 
  Building2, 
  User, 
  DollarSign, 
  Calendar,
  Briefcase,
  Package,
  Clock,
  Flag,
} from "lucide-react";

// =============================================================================
// INITIATION SUMMARY - Resumo do contrato na aba de iniciação
// =============================================================================

type InitiationSummaryProps = {
  contract: PipelineContract;
  currentStage?: InitiationStage;
};

export function InitiationSummary({ contract, currentStage }: InitiationSummaryProps) {
  const isProject = contract.type === "PROJETO";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Informações do Contrato</h3>
      
      <div className="space-y-4">
        {/* Código e Título */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Contrato</p>
          <p className="font-medium text-gray-900">{contract.code}</p>
          <p className="text-sm text-gray-600 mt-1">{contract.title}</p>
        </div>

        {/* Tipo */}
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isProject ? "bg-emerald-50" : "bg-blue-50"}`}>
            {isProject ? (
              <Briefcase className={`h-4 w-4 ${isProject ? "text-emerald-600" : "text-blue-600"}`} />
            ) : (
              <Package className="h-4 w-4 text-blue-600" />
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Tipo</p>
            <p className="text-sm font-medium text-gray-900">
              {isProject ? "Projeto" : "Produto"}
            </p>
          </div>
        </div>

        {/* Valor */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-50">
            <DollarSign className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Valor Total</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatCurrency(contract.totalValue)}
            </p>
          </div>
        </div>

        {/* Parceiro */}
        {contract.partnerName && (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-50">
              <Building2 className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Parceiro</p>
              <p className="text-sm font-medium text-gray-900">{contract.partnerName}</p>
            </div>
          </div>
        )}

        {/* Coordenador */}
        {contract.coordinatorName && (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-50">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Coordenador</p>
              <p className="text-sm font-medium text-gray-900">{contract.coordinatorName}</p>
            </div>
          </div>
        )}

        {/* Estágio Atual */}
        {currentStage && (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#004225]/10">
              <Flag className="h-4 w-4 text-[#004225]" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Estágio Atual</p>
              <p className="text-sm font-medium text-[#004225]">{currentStage.name}</p>
            </div>
          </div>
        )}

        {/* Tempo no Estágio */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-50">
            <Clock className="h-4 w-4 text-yellow-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Tempo no Estágio</p>
            <p className="text-sm font-medium text-gray-900">
              {contract.daysInStage} {contract.daysInStage === 1 ? "dia" : "dias"}
            </p>
            {currentStage?.slaDays && contract.daysInStage > currentStage.slaDays && (
              <p className="text-xs text-red-600 mt-0.5">
                ⚠️ SLA excedido ({currentStage.slaDays} dias)
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
