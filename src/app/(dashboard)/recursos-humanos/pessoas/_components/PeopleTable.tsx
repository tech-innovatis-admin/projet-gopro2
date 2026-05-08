"use client";

import { useMemo, useState } from "react";
import { Search, Users, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dropdown } from "@/components/ui/dropdown";
import { type PersonFilters, type PersonWithProjects } from "../types";

interface PeopleTableProps {
  people: PersonWithProjects[];
  isLoading?: boolean;
  selectedPersonId?: string;
  onPersonSelect: (person: PersonWithProjects) => void;
}

export function PeopleTable({
  people,
  isLoading = false,
  selectedPersonId,
  onPersonSelect,
}: PeopleTableProps) {
  const [filters, setFilters] = useState<PersonFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const uniqueStates = useMemo(() => {
    return Array.from(
      new Set(
        people
          .map((person) => person.state)
          .filter((state): state is string => Boolean(state))
      )
    ).sort();
  }, [people]);

  const citiesForState = useMemo(() => {
    const source = filters.state
      ? people.filter((person) => person.state === filters.state)
      : people;

    return Array.from(
      new Set(
        source
          .map((person) => person.city)
          .filter((city): city is string => Boolean(city))
      )
    ).sort();
  }, [filters.state, people]);

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
        const searchable = [person.fullName, person.email ?? "", person.cpf ?? ""]
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(searchLower)) return false;
      }

      if (filters.projectName) {
        const projectLower = filters.projectName.toLowerCase();
        if (!person.projects.some((project) => project.projectName.toLowerCase().includes(projectLower))) {
          return false;
        }
      }

      return true;
    });
  }, [people, filters]);

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((chunk) => chunk[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 max-h-[600px] flex flex-col">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Pessoas Cadastradas</h3>
          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Filtros
          </button>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou CPF..."
            value={filters.search || ""}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-transparent"
          />
        </div>

        {showFilters && (
          <div className="p-3 bg-gray-50 rounded-lg mb-3 grid grid-cols-2 md:grid-cols-3 gap-3">
            <Dropdown
              options={uniqueStates.map((state) => ({ value: state, label: state }))}
              value={filters.state}
              onChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  state: value || undefined,
                  city: undefined,
                }))
              }
              placeholder="Todos os estados"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
            />

            <Dropdown
              options={citiesForState.map((city) => ({ value: city, label: city }))}
              value={filters.city}
              onChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  city: value || undefined,
                }))
              }
              placeholder="Todas as cidades"
              disabled={citiesForState.length === 0}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
            />

            <Dropdown
              options={[
                { value: "true", label: "Com projeto ativo" },
                { value: "false", label: "Sem projeto ativo" },
              ]}
              value={
                filters.hasActiveProject === undefined
                  ? undefined
                  : filters.hasActiveProject
                  ? "true"
                  : "false"
              }
              onChange={(value) => {
                setFilters((prev) => ({
                  ...prev,
                  hasActiveProject:
                    value === "" ? undefined : value === "true",
                }));
              }}
              placeholder="Todos"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
            />

            <input
              type="text"
              placeholder="Buscar por nome do projeto..."
              value={filters.projectName || ""}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  projectName: event.target.value,
                }))
              }
              className="col-span-2 md:col-span-3 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#004225]" />
            <p className="text-sm mt-3">Carregando pessoas...</p>
          </div>
        ) : filteredPeople.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Users className="h-12 w-12 mb-4 text-gray-300" />
            <p className="text-sm">Nenhuma pessoa encontrada</p>
          </div>
        ) : (
          filteredPeople.map((person) => (
            <button
              key={person.id}
              type="button"
              onClick={() => onPersonSelect(person)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-150 text-left",
                selectedPersonId === person.id
                  ? "border-[#004225] bg-[#004225]/5"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#004225]/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-[#004225]">
                  {getInitials(person.fullName)}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{person.fullName}</p>
                <p className="text-xs text-gray-500 truncate">{person.email || "Sem email"}</p>
              </div>

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

      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          {filteredPeople.length} de {people.length} pessoas
        </p>
      </div>
    </div>
  );
}
