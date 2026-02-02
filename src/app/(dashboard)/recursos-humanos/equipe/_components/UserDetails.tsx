"use client";

import { type TeamUser, type PermissionHistoryEntry, type PermissionLevel } from "../types";
import { PERMISSION_LEVELS, ROLE_LABELS, MODULE_LABELS, PERMISSION_LABELS } from "../mockData";
import { X, User, Mail, Building, Shield, Clock, History } from "lucide-react";
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

// =============================================================================
// DETALHES DO USUÁRIO - Painel direito
// =============================================================================

type UserDetailsProps = {
  user: TeamUser | null;
  permissionHistory?: PermissionHistoryEntry[];
  onClose: () => void;
  onPermissionLevelChange?: (userId: string, newLevel: PermissionLevel) => void;
  onStatusToggle?: (userId: string, newStatus: "ATIVO" | "INATIVO") => void;
};

export function UserDetails({
  user,
  permissionHistory = [],
  onClose,
  onPermissionLevelChange,
  onStatusToggle,
}: UserDetailsProps) {
  if (!user) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Selecione um usuário para ver os detalhes</p>
        </div>
      </div>
    );
  }

  // Função para obter iniciais do nome
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Obtém configuração do nível
  const levelConfig = PERMISSION_LEVELS.find((l) => l.level === user.permissionLevel) || PERMISSION_LEVELS[0];

  // Opções de nível de permissão para o dropdown
  const permissionLevelOptions: DropdownOption[] = useMemo(() => {
    return PERMISSION_LEVELS.map((level) => ({
      value: level.level,
      label: `${level.name} - ${level.description}`,
    }));
  }, []);

  // Formata data
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Histórico filtrado para este usuário
  const userHistory = permissionHistory.filter((h) => h.userId === user.id);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full overflow-y-auto">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Detalhes do Usuário</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Resumo */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-[#004225] text-white flex items-center justify-center text-lg font-medium flex-shrink-0">
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

          {/* Informações básicas */}
          <div className="flex-1 min-w-0">
            <h4 className="text-xl font-semibold text-gray-900 mb-1">{user.name}</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building className="h-4 w-4" />
                <span>{ROLE_LABELS[user.role]}</span>
                <span className="text-gray-400">•</span>
                <span>{user.team}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nível de permissão e situação */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Nível de Permissão
            </label>
            <Dropdown
              options={permissionLevelOptions}
              value={user.permissionLevel}
              placeholder={`${levelConfig.name} - ${levelConfig.description}`}
              onChange={(value) => {
                if (value) {
                  onPermissionLevelChange?.(user.id, value as PermissionLevel);
                }
              }}
              className={cn(
                "w-full px-3 py-2 rounded-lg text-sm font-medium text-white",
                levelConfig.badgeColor,
                // Remove hover effect - mantém a mesma cor no hover
                levelConfig.badgeColor === "bg-green-500" && "hover:bg-green-500",
                levelConfig.badgeColor === "bg-blue-500" && "hover:bg-blue-500",
                levelConfig.badgeColor === "bg-purple-500" && "hover:bg-purple-500"
              )}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Situação
            </label>
            <label className="relative inline-flex items-center cursor-pointer w-full">
              <input
                type="checkbox"
                checked={user.status === "ATIVO"}
                onChange={(e) =>
                  onStatusToggle?.(user.id, e.target.checked ? "ATIVO" : "INATIVO")
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#004225] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#004225]"></div>
              <span className="ml-3 text-sm text-gray-700">
                {user.status === "ATIVO" ? "Ativo" : "Inativo"}
              </span>
            </label>
          </div>
        </div>

        {/* Último acesso */}
        {user.lastAccessAt && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Último acesso: {formatDate(user.lastAccessAt)}</span>
          </div>
        )}
      </div>

      {/* Permissões por módulo */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-gray-700" />
          <h4 className="font-semibold text-gray-900">Permissões por Módulo</h4>
        </div>

        <div className="space-y-2">
          {user.modulePermissions.map((perm) => (
            <div
              key={perm.module}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <span className="text-sm font-medium text-gray-900">
                {MODULE_LABELS[perm.module]}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  perm.access === "NENHUM"
                    ? "bg-gray-200 text-gray-700"
                    : perm.access === "CONFIGURAR"
                      ? "bg-purple-100 text-purple-700"
                      : perm.access === "EDITAR"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                }`}
              >
                {PERMISSION_LABELS[perm.access]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Histórico de mudanças */}
      {userHistory.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <History className="h-5 w-5 text-gray-700" />
            <h4 className="font-semibold text-gray-900">Histórico de Mudanças</h4>
          </div>

          <div className="space-y-3">
            {userHistory.map((entry) => (
              <div
                key={entry.id}
                className="p-3 bg-gray-50 rounded-lg border-l-4 border-[#004225]"
              >
                <p className="text-sm text-gray-900 mb-1">
                  <span className="font-medium">
                    Nível alterado{" "}
                    {entry.fromLevel
                      ? `de ${PERMISSION_LEVELS.find((l) => l.level === entry.fromLevel)?.name} para ${PERMISSION_LEVELS.find((l) => l.level === entry.toLevel)?.name}`
                      : `para ${PERMISSION_LEVELS.find((l) => l.level === entry.toLevel)?.name}`}
                  </span>
                </p>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{formatDate(entry.changedAt)}</span>
                  <span>por {entry.changedByName}</span>
                </div>
                {entry.reason && (
                  <p className="text-xs text-gray-500 mt-1 italic">{entry.reason}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {userHistory.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          Nenhum histórico de mudanças registrado
        </div>
      )}
    </div>
  );
}

