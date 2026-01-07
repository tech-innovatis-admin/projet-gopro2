"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { type TeamUser, type UserFilters, type PermissionLevel, type Role } from "../types";
import { PERMISSION_LEVELS, ROLE_LABELS, MODULE_LABELS } from "../mockData";
import { ChevronDown, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";

// =============================================================================
// TABELA DE USUÁRIOS - Painel central
// =============================================================================

type UsersTableProps = {
  users: TeamUser[];
  selectedUserId?: string;
  onUserSelect: (user: TeamUser) => void;
  onPermissionLevelChange?: (userId: string, newLevel: PermissionLevel) => void;
  onStatusToggle?: (userId: string, newStatus: "ATIVO" | "INATIVO") => void;
};

export function UsersTable({
  users,
  selectedUserId,
  onUserSelect,
  onPermissionLevelChange,
  onStatusToggle,
}: UsersTableProps) {
  const [filters, setFilters] = useState<UserFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  // Filtra usuários
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (filters.role && user.role !== filters.role) return false;
      if (filters.permissionLevel && user.permissionLevel !== filters.permissionLevel)
        return false;
      if (filters.status && user.status !== filters.status) return false;
      if (filters.team && user.team !== filters.team) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (
          !user.name.toLowerCase().includes(searchLower) &&
          !user.email.toLowerCase().includes(searchLower) &&
          !ROLE_LABELS[user.role]?.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [users, filters]);

  // Função para obter iniciais do nome
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Formata data de último acesso
  const formatLastAccess = (dateString?: string): string => {
    if (!dateString) return "Nunca";
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
    return date.toLocaleDateString("pt-BR");
  };

  // Obtém configuração do nível
  const getLevelConfig = (level: PermissionLevel) => {
    return PERMISSION_LEVELS.find((l) => l.level === level) || PERMISSION_LEVELS[0];
  };

  // Lista de funções únicas para filtro
  const uniqueRoles = useMemo(() => {
    return Array.from(new Set(users.map((u) => u.role))).sort();
  }, [users]);

  // Opções de nível de permissão para o dropdown
  const permissionLevelOptions: DropdownOption[] = useMemo(() => {
    return PERMISSION_LEVELS.map((level) => ({
      value: level.level,
      label: level.name,
    }));
  }, []);

  // Fecha dropdowns quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openDropdown]);

  // Toggle dropdown
  const toggleDropdown = (dropdownName: string) => {
    setOpenDropdown(prev => prev === dropdownName ? null : dropdownName);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-full flex flex-col">
      {/* Cabeçalho com filtros */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Usuários e Permissões</h3>
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
            placeholder="Buscar por nome, email ou função..."
            value={filters.search || ""}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-transparent"
          />
        </div>

        {/* Painel de filtros */}
        {showFilters && (
          <div ref={filtersRef} className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg mb-3">
            {/* Filtro por função */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("role")}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 border border-gray-300 bg-white hover:bg-gray-50 text-left",
                  filters.role ? "text-gray-900" : "text-gray-500"
                )}
              >
                <span>{filters.role ? ROLE_LABELS[filters.role] : "Todas as funções"}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200 flex-shrink-0",
                    openDropdown === "role" ? "rotate-180" : ""
                  )}
                />
              </button>
              {openDropdown === "role" && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-zinc-200 rounded-lg shadow-lg z-50 overflow-hidden transition-all duration-300 ease-out">
                  <button
                    onClick={() => {
                      setFilters({ ...filters, role: undefined });
                      setOpenDropdown(null);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors duration-150 text-left",
                      !filters.role ? "bg-zinc-50 font-medium" : ""
                    )}
                  >
                    <span>Todas as funções</span>
                  </button>
                  {uniqueRoles.map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        setFilters({ ...filters, role });
                        setOpenDropdown(null);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors duration-150 text-left",
                        filters.role === role ? "bg-zinc-50 font-medium" : ""
                      )}
                    >
                      <span>{ROLE_LABELS[role]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filtro por nível */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("level")}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 border border-gray-300 bg-white hover:bg-gray-50 text-left",
                  filters.permissionLevel ? "text-gray-900" : "text-gray-500"
                )}
              >
                <span>
                  {filters.permissionLevel
                    ? PERMISSION_LEVELS.find((l) => l.level === filters.permissionLevel)?.name || "Todos os níveis"
                    : "Todos os níveis"}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200 flex-shrink-0",
                    openDropdown === "level" ? "rotate-180" : ""
                  )}
                />
              </button>
              {openDropdown === "level" && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-zinc-200 rounded-lg shadow-lg z-50 overflow-hidden transition-all duration-300 ease-out">
                  <button
                    onClick={() => {
                      setFilters({ ...filters, permissionLevel: undefined });
                      setOpenDropdown(null);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors duration-150 text-left",
                      !filters.permissionLevel ? "bg-zinc-50 font-medium" : ""
                    )}
                  >
                    <span>Todos os níveis</span>
                  </button>
                  {PERMISSION_LEVELS.map((level) => (
                    <button
                      key={level.level}
                      onClick={() => {
                        setFilters({ ...filters, permissionLevel: level.level });
                        setOpenDropdown(null);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors duration-150 text-left",
                        filters.permissionLevel === level.level ? "bg-zinc-50 font-medium" : ""
                      )}
                    >
                      <span>{level.name} - {level.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filtro por situação */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("status")}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 border border-gray-300 bg-white hover:bg-gray-50 text-left",
                  filters.status ? "text-gray-900" : "text-gray-500"
                )}
              >
                <span>
                  {filters.status === "ATIVO"
                    ? "Ativo"
                    : filters.status === "INATIVO"
                      ? "Inativo"
                      : "Todas as situações"}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200 flex-shrink-0",
                    openDropdown === "status" ? "rotate-180" : ""
                  )}
                />
              </button>
              {openDropdown === "status" && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-zinc-200 rounded-lg shadow-lg z-50 overflow-hidden transition-all duration-300 ease-out">
                  <button
                    onClick={() => {
                      setFilters({ ...filters, status: undefined });
                      setOpenDropdown(null);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors duration-150 text-left",
                      !filters.status ? "bg-zinc-50 font-medium" : ""
                    )}
                  >
                    <span>Todas as situações</span>
                  </button>
                  <button
                    onClick={() => {
                      setFilters({ ...filters, status: "ATIVO" });
                      setOpenDropdown(null);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors duration-150 text-left",
                      filters.status === "ATIVO" ? "bg-zinc-50 font-medium" : ""
                    )}
                  >
                    <span>Ativo</span>
                  </button>
                  <button
                    onClick={() => {
                      setFilters({ ...filters, status: "INATIVO" });
                      setOpenDropdown(null);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors duration-150 text-left",
                      filters.status === "INATIVO" ? "bg-zinc-50 font-medium" : ""
                    )}
                  >
                    <span>Inativo</span>
                  </button>
                </div>
              )}
            </div>

            {/* Botão limpar filtros */}
            <button
              onClick={() => {
                setFilters({});
                setOpenDropdown(null);
              }}
              className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Limpar
            </button>
          </div>
        )}
      </div>

      {/* Tabela */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-white border-b border-gray-200">
            <tr>
              <th className="text-center py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Nome
              </th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Função
              </th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Equipe
              </th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Nível
              </th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Situação
              </th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Último acesso
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  Nenhum usuário encontrado
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = selectedUserId === user.id;
                const levelConfig = getLevelConfig(user.permissionLevel);

                return (
                  <tr
                    key={user.id}
                    onClick={() => onUserSelect(user)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#004225]/10 hover:bg-[#004225]/15"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#004225] text-white flex items-center justify-center text-xs font-medium">
                          {user.photo ? (
                            <img
                              src={user.photo}
                              alt={user.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            getInitials(user.name)
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-900">
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">{user.team}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="inline-block min-w-[120px]"
                      >
                        <Dropdown
                          options={permissionLevelOptions}
                          value={user.permissionLevel}
                          placeholder={levelConfig.name}
                          onChange={(value) => {
                            if (value) {
                              onPermissionLevelChange?.(user.id, value as PermissionLevel);
                            }
                          }}
                          className={cn(
                            "text-xs font-medium text-white border-0 rounded-full px-3 py-1",
                            levelConfig.badgeColor,
                            // Remove hover effect - mantém a mesma cor no hover
                            levelConfig.badgeColor === "bg-green-500" && "hover:bg-green-500",
                            levelConfig.badgeColor === "bg-blue-500" && "hover:bg-blue-500",
                            levelConfig.badgeColor === "bg-purple-500" && "hover:bg-purple-500"
                          )}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={user.status === "ATIVO"}
                          onChange={(e) => {
                            e.stopPropagation();
                            onStatusToggle?.(
                              user.id,
                              e.target.checked ? "ATIVO" : "INATIVO"
                            );
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#004225] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#004225]"></div>
                        <span className="ml-3 text-sm text-gray-700">
                          {user.status === "ATIVO" ? "Ativo" : "Inativo"}
                        </span>
                      </label>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">
                        {formatLastAccess(user.lastAccessAt)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Contador */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Mostrando {filteredUsers.length} de {users.length} usuários
        </p>
      </div>
    </div>
  );
}

