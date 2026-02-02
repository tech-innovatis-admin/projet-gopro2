"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, Filter, ChevronDown, Users, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { type PersonWithProjects, type PersonFilters, PROJECT_PERSON_STATUS_CONFIG } from "../types";
import { getUniqueStates, getCitiesByState, getAllCities } from "../data";

// =============================================================================
// TABELA DE PESSOAS
// =============================================================================

interface PeopleTableProps {
  people: PersonWithProjects[];
  selectedPersonId?: string;
  onPersonSelect: (person: PersonWithProjects) => void;
}

export function PeopleTable({
  people,
  selectedPersonId,
  onPersonSelect,
}: PeopleTableProps) {
  const [filters, setFilters] = useState<PersonFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  // Lista de estados únicos
  const uniqueStates = useMemo(() => getUniqueStates(), []);

  // Lista de cidades baseada no estado selecionado (ou todas se nenhum estado)
  const citiesForState = useMemo(() => {
    return filters.state ? getCitiesByState(filters.state) : getAllCities();
  }, [filters.state]);

  // Filtra pessoas
  const filteredPeople = useMemo(() => {
    return people.filter((person) => {
      if (filters.state && person.state !== filters.state) return false;
      if (filters.city && person.city !== filters.city) return false;
      if (filters.hasActiveProject !== undefined) {
        if (filters.hasActiveProject && person.activeProjectsCount === 0) return false;
        if (!filters.hasActiveProject && person.activeProjectsCount > 0) return false;
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (
          !person.fullName.toLowerCase().includes(searchLower) &&
          !person.email?.toLowerCase().includes(searchLower) &&
          !person.cpf?.includes(searchLower)
        ) {
          return false;
        }
      }
      if (filters.projectName) {
        const projectLower = filters.projectName.toLowerCase();
        if (!person.projects.some(p => p.projectName.toLowerCase().includes(projectLower))) return false;
      }
      return true;
    });
  }, [people, filters]);

  // Função para obter iniciais do nome
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Fecha dropdowns quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [openDropdown]);

  // Toggle dropdown
  const toggleDropdown = (dropdownName: string) => {
    setOpenDropdown((prev) => (prev === dropdownName ? null : dropdownName));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 max-h-[600px] flex flex-col">
      {/* Cabeçalho com filtros */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Pessoas Cadastradas</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </button>
        </div>

        {/* Barra de busca */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou CPF..."
            value={filters.search || ""}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-transparent"
          />
        </div>

        {/* Painel de filtros */}
        {showFilters && (
          <div ref={filtersRef} className="p-3 bg-gray-50 rounded-lg mb-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {/* Filtro por estado */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("state")}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 border border-gray-300 bg-white hover:bg-gray-50 text-left",
                  filters.state ? "text-gray-900" : "text-gray-500"
                )}
              >
                <span>{filters.state || "Todos os estados"}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200 flex-shrink-0",
                    openDropdown === "state" ? "rotate-180" : ""
                  )}
                />
              </button>
              {openDropdown === "state" && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-zinc-200 rounded-lg shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto">
                  <button
                    onClick={() => {
                      setFilters({ ...filters, state: undefined, city: undefined });
                      setOpenDropdown(null);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors duration-150 text-left",
                      !filters.state ? "bg-zinc-50 font-medium" : ""
                    )}
                  >
                    <span>Todos os estados</span>
                  </button>
                  {uniqueStates.map((state) => (
                    <button
                      key={state}
                      onClick={() => {
                        setFilters({ ...filters, state, city: undefined });
                        setOpenDropdown(null);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors duration-150 text-left",
                        filters.state === state ? "bg-zinc-50 font-medium" : ""
                      )}
                    >
                      <span>{state}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filtro por cidade */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("city")}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 border border-gray-300 bg-white hover:bg-gray-50 text-left",
                  filters.city ? "text-gray-900" : "text-gray-500"
                )}
              >
                <span>{filters.city || "Todas as cidades"}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200 flex-shrink-0",
                    openDropdown === "city" ? "rotate-180" : ""
                  )}
                />
              </button>
              {openDropdown === "city" && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-zinc-200 rounded-lg shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto">
                  <button
                    onClick={() => {
                      setFilters({ ...filters, city: undefined });
                      setOpenDropdown(null);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors duration-150 text-left",
                      !filters.city ? "bg-zinc-50 font-medium" : ""
                    )}
                  >
                    <span>Todas as cidades</span>
                  </button>
                  {citiesForState.map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        setFilters({ ...filters, city });
                        setOpenDropdown(null);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors duration-150 text-left",
                        filters.city === city ? "bg-zinc-50 font-medium" : ""
                      )}
                    >
                      <span>{city}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filtro por projetos ativos */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("activeProject")}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 border border-gray-300 bg-white hover:bg-gray-50 text-left",
                  filters.hasActiveProject !== undefined ? "text-gray-900" : "text-gray-500"
                )}
              >
                <span>
                  {filters.hasActiveProject === undefined
                    ? "Todos"
                    : filters.hasActiveProject
                    ? "Com projeto ativo"
                    : "Sem projeto ativo"}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200 flex-shrink-0",
                    openDropdown === "activeProject" ? "rotate-180" : ""
                  )}
                />
              </button>
              {openDropdown === "activeProject" && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-zinc-200 rounded-lg shadow-lg z-50 overflow-hidden">
                  <button
                    onClick={() => {
                      setFilters({ ...filters, hasActiveProject: undefined });
                      setOpenDropdown(null);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors duration-150 text-left",
                      filters.hasActiveProject === undefined ? "bg-zinc-50 font-medium" : ""
                    )}
                  >
                    <span>Todos</span>
                  </button>
                  <button
                    onClick={() => {
                      setFilters({ ...filters, hasActiveProject: true });
                      setOpenDropdown(null);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors duration-150 text-left",
                      filters.hasActiveProject === true ? "bg-zinc-50 font-medium" : ""
                    )}
                  >
                    <span>Com projeto ativo</span>
                  </button>
                  <button
                    onClick={() => {
                      setFilters({ ...filters, hasActiveProject: false });
                      setOpenDropdown(null);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors duration-150 text-left",
                      filters.hasActiveProject === false ? "bg-zinc-50 font-medium" : ""
                    )}
                  >
                    <span>Sem projeto ativo</span>
                  </button>
                </div>
              )}
            </div>

            {/* Filtro por nome do projeto */}
            <div className="mt-3 md:mt-0 col-span-2">
              <input
                type="text"
                placeholder="Buscar por nome do projeto..."
                value={filters.projectName || ""}
                onChange={(e) => setFilters({ ...filters, projectName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-transparent bg-white hover:bg-gray-50 transition-colors text-left"
              />
            </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
        {filteredPeople.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Users className="h-12 w-12 mb-4 text-gray-300" />
            <p className="text-sm">Nenhuma pessoa encontrada</p>
          </div>
        ) : (
          filteredPeople.map((person) => (
            <button
              key={person.id}
              onClick={() => onPersonSelect(person)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-150 text-left",
                selectedPersonId === person.id
                  ? "border-[#004225] bg-[#004225]/5"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              {/* Avatar */}
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#004225]/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-[#004225]">
                  {getInitials(person.fullName)}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {person.fullName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {person.email || "Sem email"}
                </p>
              </div>

              {/* Projetos ativos */}
              <div className="flex-shrink-0 flex items-center gap-1">
                <FolderOpen className="h-3.5 w-3.5 text-gray-400" />
                <span
                  className={cn(
                    "text-xs font-medium",
                    person.activeProjectsCount > 0 ? "text-green-600" : "text-gray-400"
                  )}
                >
                  {person.activeProjectsCount}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer com contagem */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          {filteredPeople.length} de {people.length} pessoas
        </p>
      </div>
    </div>
  );
}
