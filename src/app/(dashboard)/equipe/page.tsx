"use client";

import { useState, useMemo, useCallback } from "react";
import { NavBar } from "@/components/ui/NavBar";
import { UsersTable, UserDetails } from "./_components";
import {
  MOCK_TEAM_USERS,
  MOCK_PERMISSION_HISTORY,
} from "./mockData";
import { type TeamUser, type PermissionLevel } from "./types";

// =============================================================================
// PÁGINA DO PAINEL DA EQUIPE DE EXECUÇÃO
// =============================================================================

export default function EquipePage() {
  // Estado local dos usuários (simula estado da API)
  const [users, setUsers] = useState<TeamUser[]>(MOCK_TEAM_USERS);
  
  // Estado de seleção
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();

  // Usuário selecionado
  const selectedUser = useMemo(() => {
    return selectedUserId ? users.find((u) => u.id === selectedUserId) ?? null : null;
  }, [users, selectedUserId]);

  // Handler: selecionar usuário
  const handleUserSelect = useCallback((user: TeamUser) => {
    setSelectedUserId(user.id);
  }, []);

  // Handler: mudar nível de permissão
  const handlePermissionLevelChange = useCallback(
    async (userId: string, newLevel: PermissionLevel) => {
      // Atualização otimista
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, permissionLevel: newLevel } : user
        )
      );

      // TODO: Chamar API para persistir mudança
      // await fetch(`/api/admin/users/${userId}/permission-level`, {
      //   method: "PATCH",
      //   body: JSON.stringify({ level: newLevel }),
      // });

      // Se o usuário selecionado foi alterado, atualiza a seleção
      if (selectedUserId === userId) {
        const updatedUser = users.find((u) => u.id === userId);
        if (updatedUser) {
          setSelectedUserId(updatedUser.id);
        }
      }
    },
    [selectedUserId, users]
  );

  // Handler: alternar status (ativo/inativo)
  const handleStatusToggle = useCallback(
    async (userId: string, newStatus: "ATIVO" | "INATIVO") => {
      // Atualização otimista
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, status: newStatus } : user
        )
      );

      // TODO: Chamar API para persistir mudança
      // await fetch(`/api/admin/users/${userId}/status`, {
      //   method: "PATCH",
      //   body: JSON.stringify({ status: newStatus }),
      // });

      // Se o usuário selecionado foi alterado, atualiza a seleção
      if (selectedUserId === userId) {
        const updatedUser = users.find((u) => u.id === userId);
        if (updatedUser) {
          setSelectedUserId(updatedUser.id);
        }
      }
    },
    [selectedUserId, users]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100">
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Equipe de Execução e Permissões
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Visualize os níveis de acesso e as permissões de cada usuário na GoPro 2.
            </p>
          </div>

          {/* Grid principal: Layout 2 colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
            {/* Painel Central: Tabela de Usuários */}
            <div className="h-[calc(100vh-250px)]">
              <UsersTable
                users={users}
                selectedUserId={selectedUserId}
                onUserSelect={handleUserSelect}
                onPermissionLevelChange={handlePermissionLevelChange}
                onStatusToggle={handleStatusToggle}
              />
            </div>

            {/* Painel Direito: Detalhes do Usuário */}
            <div className="h-[calc(100vh-250px)]">
              <UserDetails
                user={selectedUser}
                permissionHistory={MOCK_PERMISSION_HISTORY}
                onClose={() => setSelectedUserId(undefined)}
                onPermissionLevelChange={handlePermissionLevelChange}
                onStatusToggle={handleStatusToggle}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

