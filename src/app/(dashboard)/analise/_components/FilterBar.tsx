"use client";

import { useState } from "react";
import { Filter, X, ChevronDown } from "lucide-react";

export interface FilterState {
  periodo: string;
  status: string;
  area: string;
  parceiro: string;
  cliente: string;
  uf: string;
  coordenador: string;
  tipo: string;
}

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  statusOptions?: FilterOption[];
  areaOptions?: FilterOption[];
  parceiroOptions?: FilterOption[];
  clienteOptions?: FilterOption[];
  ufOptions?: FilterOption[];
  coordenadorOptions?: FilterOption[];
}

const periodoOptions: FilterOption[] = [
  { value: "all", label: "Todo período" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
  { value: "6m", label: "Últimos 6 meses" },
  { value: "1y", label: "Último ano" },
  { value: "ytd", label: "Ano atual" },
];

const tipoOptions: FilterOption[] = [
  { value: "all", label: "Todos" },
  { value: "projeto", label: "Projeto" },
  { value: "produto", label: "Produto" },
];

export function FilterBar({
  filters,
  onFilterChange,
  statusOptions = [
    { value: "all", label: "Todos" },
    { value: "0", label: "Pré-projeto" },
    { value: "4", label: "Planejamento" },
    { value: "1", label: "Execução" },
    { value: "2", label: "Finalizado" },
    { value: "3", label: "Suspenso" },
  ],
  areaOptions = [{ value: "all", label: "Todas áreas" }],
  parceiroOptions = [{ value: "all", label: "Todos parceiros" }],
  clienteOptions = [{ value: "all", label: "Todos clientes" }],
  ufOptions = [{ value: "all", label: "Todos estados" }],
  coordenadorOptions = [{ value: "all", label: "Todos coordenadores" }],
}: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof FilterState, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      periodo: "all",
      status: "all",
      area: "all",
      parceiro: "all",
      cliente: "all",
      uf: "all",
      coordenador: "all",
      tipo: "all",
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "all");

  return (
    <div className="bg-white rounded-lg border border-gray-200 px-3 py-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-700 hover:text-gray-900"
        >
          <Filter className="h-3.5 w-3.5" />
          Filtros
          <ChevronDown
            className={`h-3 w-3 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Filtros principais sempre visíveis */}
        <div className="flex items-center gap-2 ml-2">
          <FilterSelect
            value={filters.periodo}
            options={periodoOptions}
            onChange={(v) => updateFilter("periodo", v)}
          />
          <FilterSelect
            value={filters.status}
            options={statusOptions}
            onChange={(v) => updateFilter("status", v)}
          />
          <FilterSelect
            value={filters.tipo}
            options={tipoOptions}
            onChange={(v) => updateFilter("tipo", v)}
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            <X className="h-3 w-3" />
            Limpar
          </button>
        )}
      </div>

      {/* Filtros expandidos */}
      {isExpanded && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
          <FilterSelect
            value={filters.area}
            options={areaOptions}
            onChange={(v) => updateFilter("area", v)}
            placeholder="Área"
          />
          <FilterSelect
            value={filters.parceiro}
            options={parceiroOptions}
            onChange={(v) => updateFilter("parceiro", v)}
            placeholder="Parceiro"
          />
          <FilterSelect
            value={filters.cliente}
            options={clienteOptions}
            onChange={(v) => updateFilter("cliente", v)}
            placeholder="Cliente"
          />
          <FilterSelect
            value={filters.uf}
            options={ufOptions}
            onChange={(v) => updateFilter("uf", v)}
            placeholder="UF"
          />
          <FilterSelect
            value={filters.coordenador}
            options={coordenadorOptions}
            onChange={(v) => updateFilter("coordenador", v)}
            placeholder="Coordenador"
          />
        </div>
      )}
    </div>
  );
}

// Componente de select individual
function FilterSelect({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#004225] focus:border-[#004225]"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// Estado inicial dos filtros
export const defaultFilters: FilterState = {
  periodo: "all",
  status: "all",
  area: "all",
  parceiro: "all",
  cliente: "all",
  uf: "all",
  coordenador: "all",
  tipo: "all",
};
