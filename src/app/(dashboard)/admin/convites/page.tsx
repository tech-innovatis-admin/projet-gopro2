"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { NavBar } from "@/components/ui/NavBar";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  cancelAllowedRegistration,
  createAllowedRegistration,
  listAllowedRegistrations,
  reissueAllowedRegistration,
} from "@/src/lib/api/endpoints/auth";
import { resolveUserNamesById } from "@/src/lib/audit/userLookup";
import { canManageInvites, fetchCurrentUser } from "@/src/lib/auth/session";
import {
  AllowedRegistrationResponseDTO,
  AllowedRegistrationStatusEnum,
  UserRoleEnum,
} from "@/src/lib/api/types";
import { getUserErrorMessage } from "@/src/lib/feedback/user-messages";

const roleOptions: UserRoleEnum[] = ["OWNER", "SUPERADMIN", "ADMIN", "ANALISTA", "ESTAGIARIO"];
const statusOptions: Array<AllowedRegistrationStatusEnum | ""> = [
  "",
  "PENDING",
  "USED",
  "EXPIRED",
  "CANCELLED",
];

const roleLabels: Record<UserRoleEnum, string> = {
  OWNER: "Owner",
  SUPERADMIN: "Superadmin",
  ADMIN: "Admin",
  ANALISTA: "Analista",
  ESTAGIARIO: "Estagiario",
};

const statusLabels: Record<AllowedRegistrationStatusEnum, string> = {
  PENDING: "Pendente",
  USED: "Utilizado",
  EXPIRED: "Expirado",
  CANCELLED: "Cancelado",
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

function toLocalDateTimeOrUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed || undefined;
}

export default function AdminConvitesPage() {
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [canManage, setCanManage] = useState(false);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRoleEnum>("ANALISTA");
  const [expiresAt, setExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);

  const [statusFilter, setStatusFilter] = useState<AllowedRegistrationStatusEnum | "">("");
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [invites, setInvites] = useState<AllowedRegistrationResponseDTO[]>([]);
  const [inviterNamesById, setInviterNamesById] = useState<Record<number, string>>({});
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runningActionId, setRunningActionId] = useState<number | null>(null);

  const resolvedInviteLink = useMemo(() => {
    if (!inviteLink) {
      return null;
    }

    if (typeof window === "undefined") {
      return inviteLink;
    }

    try {
      return new URL(inviteLink, window.location.origin).toString();
    } catch {
      return inviteLink;
    }
  }, [inviteLink]);

  const loadInvites = useCallback(async () => {
    setLoadingInvites(true);
    setError(null);

    try {
      const response = await listAllowedRegistrations({
        status: statusFilter || undefined,
        page: 0,
        size: 50,
      });
      const inviterNameMap = await resolveUserNamesById(
        response.content.map((invite) => invite.invitedByUserId)
      );
      setInvites(response.content);
      setInviterNamesById(inviterNameMap);
    } catch (requestError) {
      setError(getUserErrorMessage(requestError, "Não foi possível carregar os convites."));
      setInvites([]);
      setInviterNamesById({});
    } finally {
      setLoadingInvites(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    let cancelled = false;

    async function loadAccess() {
      try {
        const user = await fetchCurrentUser();
        if (!cancelled) {
          setCanManage(canManageInvites(user));
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
    void loadInvites();
  }, [canManage, loadInvites]);

  const emptyMessage = useMemo(() => {
    if (loadingInvites) {
      return "Carregando convites...";
    }
    if (statusFilter) {
      return "Nenhum convite encontrado para o status selecionado.";
    }
    return "Nenhum convite encontrado.";
  }, [loadingInvites, statusFilter]);

  async function handleCreateInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setCreating(true);
    setError(null);
    setFeedback(null);
    setInviteLink(null);

    try {
      const created = await createAllowedRegistration({
        email,
        role,
        expiresAt: toLocalDateTimeOrUndefined(expiresAt),
      });

      setFeedback(`Convite enviado para ${created.email}.`);
      setInviteLink(created.inviteLink);
      setEmail("");
      setExpiresAt("");
      await loadInvites();
    } catch (requestError) {
      setError(getUserErrorMessage(requestError, "Não foi possível criar o convite."));
    } finally {
      setCreating(false);
    }
  }

  async function handleCancelInvite(inviteId: number) {
    setRunningActionId(inviteId);
    setError(null);
    setFeedback(null);

    try {
      await cancelAllowedRegistration(inviteId);
      setFeedback("Convite cancelado com sucesso.");
      await loadInvites();
    } catch (requestError) {
      setError(getUserErrorMessage(requestError, "Não foi possível cancelar o convite."));
    } finally {
      setRunningActionId(null);
    }
  }

  async function handleReissueInvite(inviteId: number) {
    setRunningActionId(inviteId);
    setError(null);
    setFeedback(null);

    try {
      const updated = await reissueAllowedRegistration(inviteId, {});
      setFeedback(`Convite reemitido para ${updated.email}.`);
      setInviteLink(updated.inviteLink);
      await loadInvites();
    } catch (requestError) {
      setError(getUserErrorMessage(requestError, "Não foi possível reemitir o convite."));
    } finally {
      setRunningActionId(null);
    }
  }

  async function handleCopyLink() {
    if (!resolvedInviteLink) {
      return;
    }

    setError(null);

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(resolvedInviteLink);
      } else {
        throw new Error("Clipboard API indisponivel.");
      }
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = resolvedInviteLink;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const copied = document.execCommand("copy");
      document.body.removeChild(textArea);

      if (!copied) {
        setError("Não foi possível copiar o link automaticamente.");
        return;
      }
    }

    setFeedback("Link copiado para a área de transferencia.");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100">
      <NavBar />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <header>
          <h1 className="text-2xl font-bold text-zinc-900">Gestão de convites</h1>
          <p className="text-sm text-zinc-600">
            Owner, superadmin e admin podem liberar novos cadastros por e-mail.
          </p>
        </header>

        {loadingAccess && (
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
            Validando permissão...
          </div>
        )}

        {!loadingAccess && !canManage && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Acesso permitido apenas para owner, superadmin e admin.
          </div>
        )}

        {!loadingAccess && canManage && (
          <>
            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900">Criar convite</h2>
              <form onSubmit={handleCreateInvite} className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="inviteEmail">Email</Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="usuário@empresa.com"
                    required
                    disabled={creating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inviteRole">Perfil</Label>
                  <select
                    id="inviteRole"
                    value={role}
                    onChange={(event) => setRole(event.target.value as UserRoleEnum)}
                    className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
                    disabled={creating}
                  >
                    {roleOptions.map((option) => (
                      <option key={option} value={option}>
                        {roleLabels[option]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Expira em (opcional)</Label>
                  <DateTimePicker
                    value={expiresAt}
                    onChange={setExpiresAt}
                    placeholder="Selecione data e hora"
                    disabled={creating}
                    defaultTime="23:59"
                  />
                  <p className="text-xs text-zinc-500">
                    Se informar apenas a data, o vencimento será definido para 23:59.
                  </p>
                </div>

                <div className="md:col-span-4">
                  <Button type="submit" disabled={creating}>
                    {creating ? "Criando..." : "Criar convite"}
                  </Button>
                </div>
              </form>
            </section>

            {resolvedInviteLink && (
              <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <p className="mb-2 text-sm font-medium text-zinc-800">Link de convite</p>
                <div className="flex flex-col gap-2 md:flex-row">
                  <Input value={resolvedInviteLink} readOnly />
                  <Button type="button" variant="outline" onClick={handleCopyLink}>
                    Copiar link
                  </Button>
                </div>
              </section>
            )}

            {feedback && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                {feedback}
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900">Convites</h2>
                  <p className="text-sm text-zinc-600">Acompanhe status e reemissao de links.</p>
                </div>

                <div className="w-full md:w-60">
                  <Label htmlFor="statusFilter">Filtrar por status</Label>
                  <select
                    id="statusFilter"
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as AllowedRegistrationStatusEnum | "")
                    }
                    className="mt-1 h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
                  >
                    {statusOptions.map((option) => (
                      <option key={option || "all"} value={option}>
                        {option ? statusLabels[option] : "Todos"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {invites.length === 0 ? (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                  {emptyMessage}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 text-left text-zinc-600">
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2">Convidado por</th>
                        <th className="px-3 py-2">Perfil</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Expira em</th>
                        <th className="px-3 py-2">Usado em</th>
                        <th className="px-3 py-2">Edição</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invites.map((invite) => {
                        const isBusy = runningActionId === invite.id;
                        const canCancel = invite.status === "PENDING";
                        const canReissue = invite.status !== "USED";
                        return (
                          <tr key={invite.id} className="border-b border-zinc-100">
                            <td className="px-3 py-2">{invite.email}</td>
                            <td className="px-3 py-2">
                              {invite.invitedByUserId
                                ? (inviterNamesById[invite.invitedByUserId] ??
                                  `ID ${invite.invitedByUserId}`)
                                : "Sistema"}
                            </td>
                            <td className="px-3 py-2">{roleLabels[invite.role]}</td>
                            <td className="px-3 py-2">{statusLabels[invite.status]}</td>
                            <td className="px-3 py-2">{formatDate(invite.expiresAt)}</td>
                            <td className="px-3 py-2">{formatDate(invite.usedAt)}</td>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={!canReissue || isBusy}
                                  onClick={() => void handleReissueInvite(invite.id)}
                                >
                                  Reemitir
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={!canCancel || isBusy}
                                  onClick={() => void handleCancelInvite(invite.id)}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
