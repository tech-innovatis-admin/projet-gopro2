"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, X, ChevronDown, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type FornecedoresFiltersState,
  type FornecedorStatus,
  UF_LIST,
  STATUS_CONFIG,
  INITIAL_FILTERS_STATE,
} from "../types";
import { getMunicipiosByUF, getAllMunicipios } from "../mockData";

interface FornecedoresFiltersProps {
  filters: FornecedoresFiltersState;
  onFiltersChange: (filters: FornecedoresFiltersState) => void;
}

export function FornecedoresFilters({
  filters,
  onFiltersChange,
}: FornecedoresFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.q);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.q) {
        onFiltersChange({ ...filters, q: searchValue, page: 1 });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, filters, onFiltersChange]);

  const municipiosDisponiveis = useMemo(() => {
    return filters.uf ? getMunicipiosByUF(filters.uf) : getAllMunicipios();
  }, [filters.uf]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.uf) count++;
    if (filters.municipio) count++;
    if (filters.status) count++;
    return count;
  }, [filters]);

  const handleClearFilters = useCallback(() => {
    setSearchValue("");
    onFiltersChange({ ...INITIAL_FILTERS_STATE });
  }, [onFiltersChange]);

  const handleUFChange = useCallback(
    (uf: string | null) => {
      onFiltersChange({
        ...filters,
        uf,
        municipio: null,
        page: 1,
      });
      setOpenDropdown(null);
    },
    [filters, onFiltersChange]
  );

  const handleMunicipioChange = useCallback(
    (municipio: string | null) => {
      onFiltersChange({ ...filters, municipio, page: 1 });
      setOpenDropdown(null);
    },
    [filters, onFiltersChange]
  );

  const handleStatusChange = useCallback(
    (status: FornecedorStatus | null) => {
      onFiltersChange({ ...filters, status, page: 1 });
      setOpenDropdown(null);
    },
    [filters, onFiltersChange]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-dropdown]")) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openDropdown]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome do fornecedor..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent text-sm"
          />
          {searchValue && (
            <button
              onClick={() => setSearchValue("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-all",
            showAdvancedFilters
              ? "bg-[#1F4E79] text-white border-[#1F4E79]"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          )}
        >
          <Filter className="h-4 w-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <span
              className={cn(
                "inline-flex items-center justify-center h-5 w-5 text-xs font-bold rounded-full",
                showAdvancedFilters
                  ? "bg-white text-[#1F4E79]"
                  : "bg-[#1F4E79] text-white"
              )}
            >
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {showAdvancedFilters && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative" data-dropdown>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Estado (UF)
              </label>
              <button
                onClick={() => setOpenDropdown(openDropdown === "uf" ? null : "uf")}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all border border-gray-300 bg-white hover:bg-gray-50 text-left",
                  filters.uf ? "text-gray-900" : "text-gray-500"
                )}
              >
                <span>{filters.uf || "Todos"}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    openDropdown === "uf" ? "rotate-180" : ""
                  )}
                />
              </button>
              {openDropdown === "uf" && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => handleUFChange(null)}
                    className={cn(
                      "w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50",
                      !filters.uf ? "bg-gray-50 font-medium" : ""
                    )}
                  >
                    Todos
                  </button>
                  {UF_LIST.map((uf) => (
                    <button
                      key={uf}
                      onClick={() => handleUFChange(uf)}
                      className={cn(
                        "w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50",
                        filters.uf === uf ? "bg-gray-50 font-medium" : ""
                      )}
                    >
                      {uf}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative" data-dropdown>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Município
              </label>
              <button
                onClick={() =>
                  setOpenDropdown(openDropdown === "municipio" ? null : "municipio")
                }
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all border border-gray-300 bg-white hover:bg-gray-50 text-left",
                  filters.municipio ? "text-gray-900" : "text-gray-500"
                )}
              >
                <span className="truncate">{filters.municipio || "Todos"}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform flex-shrink-0",
                    openDropdown === "municipio" ? "rotate-180" : ""
                  )}
                />
              </button>
              {openDropdown === "municipio" && municipiosDisponiveis.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => handleMunicipioChange(null)}
                    className={cn(
                      "w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50",
                      !filters.municipio ? "bg-gray-50 font-medium" : ""
                    )}
                  >
                    Todos
                  </button>
                  {municipiosDisponiveis.map((mun) => (
                    <button
                      key={mun}
                      onClick={() => handleMunicipioChange(mun)}
                      className={cn(
                        "w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50",
                        filters.municipio === mun ? "bg-gray-50 font-medium" : ""
                      )}
                    >
                      {mun}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative" data-dropdown>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Status
              </label>
              <button
                onClick={() =>
                  setOpenDropdown(openDropdown === "status" ? null : "status")
                }
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all border border-gray-300 bg-white hover:bg-gray-50 text-left",
                  filters.status ? "text-gray-900" : "text-gray-500"
                )}
              >
                <span>
                  {filters.status ? STATUS_CONFIG[filters.status].label : "Todos"}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    openDropdown === "status" ? "rotate-180" : ""
                  )}
                />
              </button>
              {openDropdown === "status" && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <button
                    onClick={() => handleStatusChange(null)}
                    className={cn(
                      "w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50",
                      !filters.status ? "bg-gray-50 font-medium" : ""
                    )}
                  >
                    Todos
                  </button>
                  {(Object.keys(STATUS_CONFIG) as FornecedorStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(st)}
                      className={cn(
                        "w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 flex items-center gap-2",
                        filters.status === st ? "bg-gray-50 font-medium" : ""
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex h-2 w-2 rounded-full",
                          st === "ATIVO" ? "bg-green-500" : "bg-red-500"
                        )}
                      />
                      {STATUS_CONFIG[st].label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200">
              <span className="text-xs text-gray-500">Filtros ativos:</span>

              {filters.uf && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-[#1F4E79]/10 text-[#1F4E79] rounded-full">
                  UF: {filters.uf}
                  <button
                    onClick={() => handleUFChange(null)}
                    className="hover:bg-[#1F4E79]/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {filters.municipio && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-[#1F4E79]/10 text-[#1F4E79] rounded-full">
                  {filters.municipio}
                  <button
                    onClick={() => handleMunicipioChange(null)}
                    className="hover:bg-[#1F4E79]/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {filters.status && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-[#1F4E79]/10 text-[#1F4E79] rounded-full">
                  {STATUS_CONFIG[filters.status].label}
                  <button
                    onClick={() => handleStatusChange(null)}
                    className="hover:bg-[#1F4E79]/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              <button
                onClick={handleClearFilters}
                className="ml-auto text-xs font-medium text-red-600 hover:text-red-700 hover:underline"
              >
                Limpar todos
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

