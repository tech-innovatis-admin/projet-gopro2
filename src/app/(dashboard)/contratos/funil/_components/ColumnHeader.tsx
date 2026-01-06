"use client";

import { type InitiationStage, formatCurrency } from "../types";
import { FileText, DollarSign } from "lucide-react";

// =============================================================================
// COLUMN HEADER - Cabeçalho de cada coluna do Kanban
// =============================================================================

type ColumnHeaderProps = {
  stage: InitiationStage;
  contractCount: number;
  totalValue: number;
};

export function ColumnHeader({ stage, contractCount, totalValue }: ColumnHeaderProps) {
  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center justify-center mb-2">
        <h3 className="font-semibold text-gray-900 text-sm text-center">
          {stage.name}
        </h3>
      </div>
      
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <span>{formatCurrency(totalValue)}</span>
        <span>-</span>
        <span>
          {contractCount} {contractCount === 1 ? "contrato" : "contratos"}
        </span>
      </div>

      {stage.slaDays && (
        <div className="mt-2 text-xs text-gray-400">
          SLA: {stage.slaDays} dias
        </div>
      )}
    </div>
  );
}
