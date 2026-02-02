"use client";

import { Users, Plus, Download, LayoutGrid, List, Building, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// =============================================================================
// HEADER DO MÓDULO DE PARCEIROS
// =============================================================================

type ViewMode = "grid" | "table";

interface ParceirosHeaderProps {
  totalParceiros: number;
  totalIfes: number;
  totalFundacoes: number;
  totalAtivos: number;
  totalFiltrados: number;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  onNovoParceiro?: () => void;
}

export function ParceirosHeader({
  totalParceiros,
  totalIfes,
  totalFundacoes,
  totalAtivos,
  totalFiltrados,
  viewMode = "grid",
  onViewModeChange,
  onNovoParceiro,
}: ParceirosHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Título e descrição */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#004225]/10 rounded-lg">
              <Users className="h-6 w-6 text-[#004225]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Parceiros</h1>
          </div>
          <p className="text-sm text-gray-600 ml-[52px]">
            Gerencie IFES e Fundações parceiras da empresa
          </p>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-3 ml-[52px] sm:ml-0">
          {/* Toggle de Visualização */}
          {onViewModeChange && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onViewModeChange("grid")}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  viewMode === "grid"
                    ? "bg-white text-[#004225] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
                title="Visualização em grid"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => onViewModeChange("table")}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  viewMode === "table"
                    ? "bg-white text-[#004225] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
                title="Visualização em tabela"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            disabled
            className="gap-2"
            title="Exportar (em breve)"
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-[#004225] hover:bg-[#003319]"
            onClick={onNovoParceiro}
          >
            <Plus className="h-4 w-4" />
            Novo Parceiro
          </Button>
        </div>
      </div>

      {/* Contadores */}
      <div className="flex flex-wrap items-center gap-6 ml-[52px]">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Total:</span>
          <span className="text-sm font-semibold text-gray-900">
            {totalParceiros}
          </span>
        </div>
        <div className="h-4 w-px bg-gray-300" />
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-emerald-600" />
          <span className="text-sm text-gray-500">IFES:</span>
          <span className="text-sm font-semibold text-emerald-700">
            {totalIfes}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-gray-500">Fundações:</span>
          <span className="text-sm font-semibold text-blue-700">
            {totalFundacoes}
          </span>
        </div>
        <div className="h-4 w-px bg-gray-300" />
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm text-gray-500">Ativos:</span>
          <span className="text-sm font-semibold text-green-700">
            {totalAtivos}
          </span>
        </div>
        {totalFiltrados !== totalParceiros && (
          <>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Exibindo:</span>
              <span className="text-sm font-semibold text-[#004225]">
                {totalFiltrados} de {totalParceiros}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
