"use client";

import { Building2, Plus, Download, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// =============================================================================
// HEADER DO MÓDULO DE FORNECEDORES
// =============================================================================

type ViewMode = "table" | "grid";

interface FornecedoresHeaderProps {
  totalFornecedores: number;
  totalAtivos: number;
  totalInativos: number;
  totalFiltrados: number;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  onNovoFornecedor?: () => void;
}

export function FornecedoresHeader({
  totalFornecedores,
  totalAtivos,
  totalInativos,
  totalFiltrados,
  viewMode = "table",
  onViewModeChange,
  onNovoFornecedor,
}: FornecedoresHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Título e descrição */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1F4E79]/10 rounded-lg">
              <Building2 className="h-6 w-6 text-[#1F4E79]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Fornecedores</h1>
          </div>
          <p className="text-sm text-gray-600 ml-[52px]">
            Listagem global de fornecedores cadastrados no sistema
          </p>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-3 ml-[52px] sm:ml-0">
          {/* Toggle de Visualização */}
          {onViewModeChange && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onViewModeChange("table")}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  viewMode === "table"
                    ? "bg-white text-[#1F4E79] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
                title="Visualização em tabela"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => onViewModeChange("grid")}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  viewMode === "grid"
                    ? "bg-white text-[#1F4E79] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
                title="Visualização em grid"
              >
                <LayoutGrid className="h-4 w-4" />
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
            className="gap-2 bg-[#1F4E79] hover:bg-[#153653]"
            onClick={onNovoFornecedor}
          >
            <Plus className="h-4 w-4" />
            Novo Fornecedor
          </Button>
        </div>
      </div>

      {/* Contadores */}
      <div className="flex flex-wrap items-center gap-6 ml-[52px]">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Total:</span>
          <span className="text-sm font-semibold text-gray-900">
            {totalFornecedores}
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
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-red-500" />
          <span className="text-sm text-gray-500">Inativos:</span>
          <span className="text-sm font-semibold text-red-700">
            {totalInativos}
          </span>
        </div>
        {totalFiltrados !== totalFornecedores && (
          <>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Exibindo:</span>
              <span className="text-sm font-semibold text-[#1F4E79]">
                {totalFiltrados} de {totalFornecedores}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
