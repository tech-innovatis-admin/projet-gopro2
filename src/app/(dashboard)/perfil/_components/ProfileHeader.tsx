"use client";

import Link from "next/link";
import { CheckCircle2, Clock3, Mail, PencilLine, Shield, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type AuthUserResponseDTO, type UserRoleEnum, type UserStatusEnum } from "@/src/lib/api/types";
import { getInitials } from "./utils";

type ProfileHeaderProps = {
  user: AuthUserResponseDTO;
  avatarImageUrl?: string | null;
  onEditProfile?: () => void;
};

const ROLE_LABELS: Record<UserRoleEnum, string> = {
  SUPERADMIN: "Superadmin",
  ADMIN: "Admin",
  ANALISTA: "Analista",
  ESTAGIARIO: "Estagiario",
};

const ROLE_BADGE_COLORS: Record<UserRoleEnum, string> = {
  SUPERADMIN: "bg-amber-200/95 text-amber-950 ring-1 ring-amber-100",
  ADMIN: "bg-sky-200/95 text-sky-950 ring-1 ring-sky-100",
  ANALISTA: "bg-violet-200/95 text-violet-950 ring-1 ring-violet-100",
  ESTAGIARIO: "bg-rose-200/95 text-rose-950 ring-1 ring-rose-100",
};

const STATUS_LABELS: Record<UserStatusEnum, string> = {
  ACTIVE: "Ativo",
  DISABLED: "Desativado",
  PENDING: "Pendente",
};

const STATUS_BADGE_COLORS: Record<UserStatusEnum, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  DISABLED: "bg-red-100 text-red-700",
  PENDING: "bg-amber-100 text-amber-700",
};

function formatLastAccess(lastLoginAt: string | null): string {
  if (!lastLoginAt) {
    return "Sem registro";
  }

  const [datePart, timePart] = lastLoginAt.split("T");
  if (!datePart || !timePart) {
    return "Sem registro";
  }

  const [year, month, day] = datePart.split("-");
  const [hour, minute] = timePart.split(":");
  if (!year || !month || !day || !hour || !minute) {
    return "Sem registro";
  }

  return `${day}/${month}/${year} ${hour}:${minute}`;
}

export function ProfileHeader({ user, avatarImageUrl, onEditProfile }: ProfileHeaderProps) {
  const roleLabel = ROLE_LABELS[user.role] ?? user.role;
  const statusLabel = STATUS_LABELS[user.status] ?? user.status;
  const username = user.username?.trim() || "Nao informado";
  const lastAccess = formatLastAccess(user.lastLoginAt);

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="relative overflow-hidden bg-gradient-to-r from-[#00331d] via-[#004225] to-[#00714a] px-6 py-6 sm:px-8 sm:py-7">
        <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 left-10 h-24 w-24 rounded-full bg-emerald-200/20 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {avatarImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarImageUrl}
                alt={`Foto de perfil de ${user.fullName}`}
                className="h-20 w-20 rounded-2xl border border-white/30 object-cover shadow-lg"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/30 bg-white/10 text-2xl font-semibold text-white shadow-lg backdrop-blur-sm">
                {getInitials(user.fullName)}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-white">{user.fullName}</h2>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                    ROLE_BADGE_COLORS[user.role]
                  )}
                >
                  {roleLabel}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-white/90">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium",
                    STATUS_BADGE_COLORS[user.status]
                  )}
                >
                  {user.status === "ACTIVE" ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  {statusLabel}
                </span>
                <span className="text-white/50">|</span>
                <span className="font-medium text-white/95">@{username}</span>
              </div>
            </div>
          </div>

          <div className="flex w-full gap-2 sm:w-auto">
            {onEditProfile ? (
              <Button
                type="button"
                variant="outline"
                onClick={onEditProfile}
                className="flex-1 border-white/40 bg-white/20 text-white hover:bg-white/30 sm:flex-none"
              >
                <PencilLine className="h-4 w-4" />
                Editar perfil
              </Button>
            ) : null}
            <Button
              asChild
              variant="outline"
              className="flex-1 border-white/40 bg-white/90 text-[#00331d] hover:bg-white sm:flex-none"
            >
              <Link href="/perfil/seguranca">Seguranca</Link>
            </Button>
            {/* TODO: Reativar quando a pagina de configuracoes estiver implementada. */}
            {/* <Button asChild className="flex-1 bg-[#002818] hover:bg-[#001f13] sm:flex-none">
              <Link href="/perfil/configuracoes">Configuracoes</Link>
            </Button> */}
          </div>
        </div>
      </div>

      <div className="px-6 pb-7 pt-5 sm:px-8">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
            <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              <Mail className="h-3.5 w-3.5" />
              Email
            </div>
            <p className="break-all text-sm font-medium text-gray-900">{user.email}</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
            <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              <Shield className="h-3.5 w-3.5" />
              Perfil de acesso
            </div>
            <p className="text-sm font-semibold text-gray-900">{roleLabel}</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
            <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              <Clock3 className="h-3.5 w-3.5" />
              Ultimo acesso da conta
            </div>
            <p className="text-sm font-semibold text-gray-900">{lastAccess}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
