"use client";

import { Search, X, ChevronDown, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
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
          <div className="relative">
            <select
              value={filters.tipo}
              onChange={(e) => handleChange("tipo", e.target.value as ParceiroTipo | "")}
              className={cn(
                "appearance-none pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors cursor-pointer min-w-[140px]",
                filters.tipo && "border-[#004225] bg-[#004225]/5"
              )}
            >
              <option value="">Todos os tipos</option>
              <option value="IFES">{TIPO_SHORT_LABELS.IFES}</option>
              <option value="FUNDACAO">{TIPO_SHORT_LABELS.FUNDACAO}</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* UF */}
          <div className="relative">
            <select
              value={filters.uf}
              onChange={(e) => handleChange("uf", e.target.value)}
              className={cn(
                "appearance-none pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors cursor-pointer min-w-[100px]",
                filters.uf && "border-[#004225] bg-[#004225]/5"
              )}
            >
              <option value="">Todos UF</option>
              {UF_LIST.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Status */}
          <div className="relative">
            <select
              value={filters.status}
              onChange={(e) => handleChange("status", e.target.value as ParceiroStatus | "")}
              className={cn(
                "appearance-none pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors cursor-pointer min-w-[120px]",
                filters.status && "border-[#004225] bg-[#004225]/5"
              )}
            >
              <option value="">Todos status</option>
              <option value="ATIVO">Ativo</option>
              <option value="INATIVO">Inativo</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Ordenação */}
          <div className="relative">
            <select
              value={`${filters.sortBy}-${filters.sortDir}`}
              onChange={(e) => {
                const [sortBy, sortDir] = e.target.value.split("-") as [
                  ParceirosFiltersState["sortBy"],
                  ParceirosFiltersState["sortDir"]
                ];
                onFiltersChange({ ...filters, sortBy, sortDir, page: 1 });
              }}
              className="appearance-none pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors cursor-pointer min-w-[160px]"
            >
              <option value="nome-asc">Nome (A-Z)</option>
              <option value="nome-desc">Nome (Z-A)</option>
              <option value="uf-asc">UF (A-Z)</option>
              <option value="tipo-asc">Tipo (A-Z)</option>
              <option value="contratosAtivos-desc">Mais contratos</option>
              <option value="contratosAtivos-asc">Menos contratos</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
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
