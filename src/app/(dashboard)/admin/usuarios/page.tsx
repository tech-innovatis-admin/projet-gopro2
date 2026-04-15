"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { NavBar } from "@/components/ui/NavBar";
import { Button } from "@/components/ui/button";
import {
  listAdminUsers,
  updateAdminUser,
} from "@/src/lib/api/endpoints/auth";
import { canManageAdminArea, fetchCurrentUser } from "@/src/lib/auth/session";
import {
  AdminUserResponseDTO,
  UserRoleEnum,
  UserStatusEnum,
} from "@/src/lib/api/types";
import { getUserErrorMessage } from "@/src/lib/feedback/user-messages";

const roleOptions: UserRoleEnum[] = ["OWNER", "SUPERADMIN", "ADMIN", "ANALISTA", "ESTAGIARIO"];
const statusOptions: UserStatusEnum[] = ["ACTIVE", "DISABLED", "PENDING"];

const roleLabels: Record<UserRoleEnum, string> = {
  OWNER: "Owner",
  SUPERADMIN: "Superadmin",
  ADMIN: "Admin",
  ANALISTA: "Analista",
  ESTAGIARIO: "Estagiario",
};

const statusLabels: Record<UserStatusEnum, string> = {
  ACTIVE: "Ativo",
  DISABLED: "Desativado",
  PENDING: "Pendente",
};

type UserDraft = {
  role: UserRoleEnum;
  status: UserStatusEnum;
};

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default function AdminUsuariosPage() {
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [users, setUsers] = useState<AdminUserResponseDTO[]>([]);
  const [drafts, setDrafts] = useState<Record<number, UserDraft>>({});
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);
  const [roleFilter, setRoleFilter] = useState<UserRoleEnum | "">("");
  const [statusFilter, setStatusFilter] = useState<UserStatusEnum | "">("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    setError(null);

    try {
      const response = await listAdminUsers({
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        page: 0,
        size: 100,
      });
      setUsers(response.content);

      const nextDrafts: Record<number, UserDraft> = {};
      for (const user of response.content) {
        nextDrafts[user.id] = {
          role: user.role,
          status: user.status,
        };
      }
      setDrafts(nextDrafts);
    } catch (requestError) {
      setError(getUserErrorMessage(requestError, "Nao foi possivel carregar os usuarios."));
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [roleFilter, statusFilter]);

  useEffect(() => {
    let cancelled = false;

    async function loadAccess() {
      try {
        const user = await fetchCurrentUser();
        if (!cancelled) {
          setCanManage(canManageAdminArea(user));
        }
      } finally {
        if (!cancelled) {
          setLoadingAccess(false);
        }
      }
    }

    void loadAccess();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!canManage) {
      return;
    }

    void loadUsers();
  }, [canManage, loadUsers]);

  const emptyMessage = useMemo(() => {
    if (loadingUsers) {
      return "Carregando usuarios...";
    }
    return "Nenhum usuario encontrado para os filtros selecionados.";
  }, [loadingUsers]);

  function handleDraftRole(userId: number, value: UserRoleEnum) {
    setDrafts((previous) => ({
      ...previous,
      [userId]: {
        ...previous[userId],
        role: value,
      },
    }));
  }

  function handleDraftStatus(userId: number, value: UserStatusEnum) {
    setDrafts((previous) => ({
      ...previous,
      [userId]: {
        ...previous[userId],
        status: value,
      },
    }));
  }

  async function handleSaveUser(user: AdminUserResponseDTO) {
    if (user.role === "OWNER") {
      setFeedback(null);
      setError("Usuarios Owner sao protegidos e nao podem ser alterados.");
      return;
    }

    const draft = drafts[user.id];
    if (!draft) {
      return;
    }

    const roleChanged = draft.role !== user.role;
    const statusChanged = draft.status !== user.status;
    if (!roleChanged && !statusChanged) {
      setFeedback("Nenhuma alteracao para salvar.");
      return;
    }

    setSavingUserId(user.id);
    setFeedback(null);
    setError(null);

    try {
      await updateAdminUser(user.id, {
        role: draft.role,
        status: draft.status,
      });
      setFeedback(`Usuario ${user.email} atualizado com sucesso.`);
      await loadUsers();
    } catch (requestError) {
      setError(getUserErrorMessage(requestError, "Nao foi possivel atualizar o usuario."));
    } finally {
      setSavingUserId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100">
      <NavBar />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <header>
          <h1 className="text-2xl font-bold text-zinc-900">Gestao de usuarios</h1>
          <p className="text-sm text-zinc-600">
            Owner, superadmin e admin podem gerenciar usuarios. Contas Owner sao protegidas.
          </p>
        </header>

        {loadingAccess && (
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-zinc-600">Validando permissao...</p>
          </section>
        )}

        {!loadingAccess && !canManage && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <p className="text-sm text-amber-800">
              Acesso permitido apenas para owner, superadmin e admin.
            </p>
          </section>
        )}

        {!loadingAccess && canManage && (
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <label htmlFor="roleFilter" className="text-sm font-medium text-zinc-700">
                Filtrar por perfil
              </label>
              <select
                id="roleFilter"
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value as UserRoleEnum | "")}
                className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
              >
                <option value="">Todos</option>
                {roleOptions.map((option) => (
                  <option key={option} value={option}>
                    {roleLabels[option]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="statusFilter" className="text-sm font-medium text-zinc-700">
                Filtrar por status
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as UserStatusEnum | "")}
                className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
              >
                <option value="">Todos</option>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {statusLabels[option]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button type="button" variant="outline" onClick={() => void loadUsers()}>
                Atualizar lista
              </Button>
            </div>
          </div>
          </section>
        )}

        {!loadingAccess && canManage && feedback && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {feedback}
          </div>
        )}

        {!loadingAccess && canManage && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loadingAccess && canManage && (
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          {users.length === 0 ? (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
              {emptyMessage}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-zinc-600">
                    <th className="px-3 py-2">Usuario</th>
                    <th className="px-3 py-2">E-mail</th>
                    <th className="px-3 py-2">Perfil</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Ultimo login</th>
                    <th className="px-3 py-2">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const draft = drafts[user.id];
                    const isBusy = savingUserId === user.id;
                    const isProtectedUser = user.role === "OWNER";
                    const isDisabled = isBusy || isProtectedUser;

                    return (
                      <tr key={user.id} className="border-b border-zinc-100">
                        <td className="px-3 py-2">
                          <div className="font-medium text-zinc-900">{user.fullName}</div>
                          <div className="text-xs text-zinc-500">{user.username || "-"}</div>
                          {isProtectedUser && (
                            <div className="mt-1 text-xs font-medium text-amber-700">
                              Conta Owner protegida
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2">{user.email}</td>
                        <td className="px-3 py-2">
                          <select
                            value={draft?.role ?? user.role}
                            onChange={(event) =>
                              handleDraftRole(user.id, event.target.value as UserRoleEnum)
                            }
                            className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm"
                            disabled={isDisabled}
                          >
                            {roleOptions.map((option) => (
                              <option key={option} value={option}>
                                {roleLabels[option]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={draft?.status ?? user.status}
                            onChange={(event) =>
                              handleDraftStatus(user.id, event.target.value as UserStatusEnum)
                            }
                            className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm"
                            disabled={isDisabled}
                          >
                            {statusOptions.map((option) => (
                              <option key={option} value={option}>
                                {statusLabels[option]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">{formatDate(user.lastLoginAt)}</td>
                        <td className="px-3 py-2">
                          <Button
                            type="button"
                            size="sm"
                            disabled={isDisabled}
                            onClick={() => void handleSaveUser(user)}
                          >
                            {isProtectedUser ? "Protegido" : isBusy ? "Salvando..." : "Salvar"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          </section>
        )}
      </main>
    </div>
  );
}
