"use client";

import { type TeamUser } from "../../recursos-humanos/equipe/types";
import { PERMISSION_LEVELS, ROLE_LABELS } from "../../recursos-humanos/equipe/mockData";
import { formatHumanDate, getInitials } from "./utils";
import { Building, Shield, Clock, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// HEADER DE IDENTIDADE FUNCIONAL DO PERFIL
// =============================================================================

type ProfileHeaderProps = {
  user: TeamUser;
};

export function ProfileHeader({ user }: ProfileHeaderProps) {
  // Obtém configuração do nível de permissão
  const levelConfig = PERMISSION_LEVELS.find((l) => l.level === user.permissionLevel) || PERMISSION_LEVELS[0];
  
  // Obtém label da função
  const roleLabel = ROLE_LABELS[user.role] || user.role;
  
  // Obtém label da equipe
  const teamLabel = user.team === "EXECUCAO" ? "Execução" :
                    user.team === "COMERCIAL" ? "Comercial" :
                    user.team === "ADMINISTRATIVO" ? "Administrativo" :
                    user.team === "FINANCEIRO" ? "Financeiro" : user.team;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Container principal com espaçamento generoso */}
      <div className="p-8 sm:p-10">
        {/* Grid responsivo: Avatar + Informações */}
        <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-[#004225] to-[#00B894] text-white flex items-center justify-center text-2xl sm:text-3xl font-semibold shadow-lg">
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
          </div>

          {/* Informações principais */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Nome completo - Hierarquia visual clara */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {user.name}
              </h1>
              
              {/* Função e Equipe */}
              <div className="flex flex-wrap items-center gap-3 text-base text-gray-700">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{roleLabel}</span>
                </div>
                <span className="text-gray-300">•</span>
                <span>{teamLabel}</span>
              </div>
            </div>

            {/* Grid de badges: Nível de Permissão, Status e Último Acesso */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* Nível de Permissão */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-600 uppercase tracking-wide">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Nível de Permissão</span>
                </div>
                <div
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white w-fit",
                    levelConfig.badgeColor
                  )}
                >
                  <span>{levelConfig.level}</span>
                  <span className="text-xs opacity-90">({levelConfig.description})</span>
                </div>
              </div>

              {/* Status */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-600 uppercase tracking-wide">
                  {user.status === "ATIVO" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-red-500" />
                  )}
                  <span>Status</span>
                </div>
                <div
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold w-fit",
                    user.status === "ATIVO"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  )}
                >
                  {user.status === "ATIVO" ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Ativo</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      <span>Inativo</span>
                    </>
                  )}
                </div>
              </div>

              {/* Último Acesso */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-600 uppercase tracking-wide">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Último Acesso</span>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {user.lastAccessAt ? formatHumanDate(user.lastAccessAt) : "Nunca"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

