"use client";

import { Search, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dropdown } from "@/components/ui/dropdown";
import {
  type ParceirosFiltersState,
  type ParceiroTipo,
  type ParceiroStatus,
  UF_LIST,
  TIPO_SHORT_LABELS,
} from "../types";

// =============================================================================
// FILTROS DO MÓDULO DE PARCEIROS
// =============================================================================

interface ParceirosFiltersProps {
  filters: ParceirosFiltersState;
  onFiltersChange: (filters: ParceirosFiltersState) => void;
}

export function ParceirosFilters({
  filters,
  onFiltersChange,
}: ParceirosFiltersProps) {
  // Handler para mudança de campo
  const handleChange = <K extends keyof ParceirosFiltersState>(
    field: K,
    value: ParceirosFiltersState[K]
  ) => {
    onFiltersChange({
      ...filters,
      [field]: value,
      page: 1, // Reset para primeira página ao filtrar
    });
  };

  // Limpar todos os filtros
  const clearFilters = () => {
    onFiltersChange({
      q: "",
      tipo: "",
      uf: "",
      status: "",
      sortBy: "nome",
      sortDir: "asc",
      page: 1,
      pageSize: filters.pageSize,
    });
  };

  // Verificar se há filtros ativos
  const hasActiveFilters =
    filters.q || filters.tipo || filters.uf || filters.status;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Busca */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, sigla ou CNPJ..."
            value={filters.q}
            onChange={(e) => handleChange("q", e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors"
          />
          {filters.q && (
            <button
              onClick={() => handleChange("q", "")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Filtros em linha */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tipo */}
          <div className="min-w-[140px]">
            <Dropdown
              options={[
                { value: "IFES", label: TIPO_SHORT_LABELS.IFES },
                { value: "FUNDACAO", label: TIPO_SHORT_LABELS.FUNDACAO },
              ]}
              value={filters.tipo}
              onChange={(value) => handleChange("tipo", (value ?? "") as ParceiroTipo | "")}
              placeholder="Todos os tipos"
              className={cn(
                "h-[42px] rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm transition-colors",
                filters.tipo && "border-[#004225] bg-[#004225]/5"
              )}
            />
          </div>

          {/* UF */}
          <div className="min-w-[100px]">
            <Dropdown
              options={UF_LIST.map((uf) => ({ value: uf, label: uf }))}
              value={filters.uf}
              onChange={(value) => handleChange("uf", value ?? "")}
              placeholder="Todos UF"
              className={cn(
                "h-[42px] rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm transition-colors",
                filters.uf && "border-[#004225] bg-[#004225]/5"
              )}
            />
          </div>

          {/* Status */}
          <div className="min-w-[120px]">
            <Dropdown
              options={[
                { value: "ATIVO", label: "Ativo" },
                { value: "INATIVO", label: "Inativo" },
              ]}
              value={filters.status}
              onChange={(value) => handleChange("status", (value ?? "") as ParceiroStatus | "")}
              placeholder="Todos status"
              className={cn(
                "h-[42px] rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm transition-colors",
                filters.status && "border-[#004225] bg-[#004225]/5"
              )}
            />
          </div>

          {/* Ordenação */}
          <div className="min-w-[160px]">
            <Dropdown
              options={[
                { value: "nome-asc", label: "Nome (A-Z)" },
                { value: "nome-desc", label: "Nome (Z-A)" },
                { value: "uf-asc", label: "UF (A-Z)" },
                { value: "tipo-asc", label: "Tipo (A-Z)" },
                { value: "contratosAtivos-desc", label: "Mais contratos" },
                { value: "contratosAtivos-asc", label: "Menos contratos" },
              ]}
              value={`${filters.sortBy}-${filters.sortDir}`}
              onChange={(value) => {
                const selectedValue = value ?? "nome-asc";
                const [sortBy, sortDir] = selectedValue.split("-") as [
                  ParceirosFiltersState["sortBy"],
                  ParceirosFiltersState["sortDir"]
                ];
                onFiltersChange({ ...filters, sortBy, sortDir, page: 1 });
              }}
              className="h-[42px] rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm transition-colors"
            />
          </div>

          {/* Limpar filtros */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Filter className="h-4 w-4" />
              Limpar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
