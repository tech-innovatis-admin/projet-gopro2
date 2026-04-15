"use client";

import Link from "next/link";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Camera,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  LifeBuoy,
  LogIn,
  PencilLine,
  PlusCircle,
  Shield,
  Trash2,
  TriangleAlert,
  Upload,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavBar } from "@/components/ui/NavBar";
import { listMyAuditLogs, me as fetchAuthMe, uploadMyAvatar } from "@/src/lib/api/endpoints/auth";
import { generateDocumentDownloadUrl } from "@/src/lib/api/endpoints/documents";
import { type AuditLogResponseDTO, type AuthUserResponseDTO } from "@/src/lib/api/types";
import { getUserErrorMessage } from "@/src/lib/feedback/user-messages";
import {
  resolveContext,
  resolveEntity,
} from "@/src/lib/audit/presentation";
import { AuditLogCard } from "@/src/components/audit/AuditLogCard";
import { ProfileHeader } from "./_components";

const ACTIVITY_CARDS_PER_PAGE = 4;
const MAX_PROFILE_PHOTO_BYTES = 20 * 1024 * 1024;
const AUDIT_FETCH_PAGE_SIZE = 50;
const MAX_AUDIT_FETCH_PAGES = 30;

const CONTRACT_ACTIVITY_TERMS = [
  "contrat",
  "project",
  "projeto",
  "orcament",
  "rubrica",
  "desembolso",
  "receita",
  "despesa",
  "meta",
  "etapa",
  "fase",
  "remanej",
] as const;

const CONTRACT_ENTITY_TERMS = [
  "project",
  "contract",
  "budget",
  "income",
  "expense",
  "goal",
  "stage",
  "phase",
  "disbursement",
] as const;

const LOGIN_ACTIVITY_TERMS = ["login", "signin", "autentic", "logout", "signout"] as const;

type ProfileTab = "overview" | "activities";

function getRequestErrorMessage(error: unknown): string {
  return getUserErrorMessage(error, "Não foi possível carregar os dados.");
}

function isUuid(value?: string | null): boolean {
  if (!value) {
    return false;
  }
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim()
  );
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function getHealthScore(user: AuthUserResponseDTO): number {
  let score = 0;

  if (user.fullName?.trim()) {
    score += 30;
  }
  if (user.email?.trim()) {
    score += 30;
  }
  if (user.username?.trim()) {
    score += 20;
  }
  if (user.status === "ACTIVE") {
    score += 20;
  }

  return Math.min(score, 100);
}

type ActivityAccent = {
  label: string;
  icon: typeof Activity;
  iconClass: string;
  barClass: string;
  borderClass: string;
};

function includesAny(value: string, terms: readonly string[]): boolean {
  return terms.some((term) => value.includes(term));
}

function normalizeAuditText(value?: string | null): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isLoginActivity(log: AuditLogResponseDTO): boolean {
  const searchable = [
    log.action,
    log.modulo,
    log.feature,
    log.aba,
    log.subsecao,
    log.resumo,
    log.descricao,
    log.entityType,
    log.entidadePrincipal,
  ]
    .map((value) => normalizeAuditText(value))
    .join(" ");

  return includesAny(searchable, LOGIN_ACTIVITY_TERMS);
}

function isContractActivity(log: AuditLogResponseDTO): boolean {
  if (log.tipoAuditoria === "CONTRACTS") {
    return true;
  }

  const entityType = normalizeAuditText(log.entityType);
  if (includesAny(entityType, CONTRACT_ENTITY_TERMS)) {
    return true;
  }

  const searchable = [
    log.action,
    log.modulo,
    log.feature,
    log.aba,
    log.subsecao,
    log.resumo,
    log.descricao,
    log.entidadePrincipal,
  ]
    .map((value) => normalizeAuditText(value))
    .join(" ");

  return includesAny(searchable, CONTRACT_ACTIVITY_TERMS);
}

async function fetchMyContractActivities(): Promise<AuditLogResponseDTO[]> {
  const contractLogs: AuditLogResponseDTO[] = [];
  const seenKeys = new Set<string>();

  for (let page = 0; page < MAX_AUDIT_FETCH_PAGES; page += 1) {
    const response = await listMyAuditLogs({
      page,
      size: AUDIT_FETCH_PAGE_SIZE,
    });

    for (const log of response.content) {
      if (isLoginActivity(log)) {
        continue;
      }
      if (!isContractActivity(log)) {
        continue;
      }

      const key = (log.auditId || "").trim() || String(log.id);
      if (seenKeys.has(key)) {
        continue;
      }
      seenKeys.add(key);
      contractLogs.push(log);
    }

    if (response.last || response.content.length === 0 || page >= response.totalPages - 1) {
      break;
    }
  }

  return contractLogs;
}

function resolveActivityAccent(action?: string | null): ActivityAccent {
  const normalizedAction = (action || "").trim().toUpperCase();

  if (includesAny(normalizedAction, ["ERRO", "ERROR", "FALHA", "EXCEPTION"])) {
    return {
      label: "Falha",
      icon: TriangleAlert,
      iconClass: "border-red-200 bg-red-50 text-red-600",
      barClass: "bg-gradient-to-r from-red-500 to-rose-500",
      borderClass: "border-red-200/70",
    };
  }

  if (includesAny(normalizedAction, ["EXCLUI", "DELETE", "REMOV", "CANCEL"])) {
    return {
      label: "Exclusão",
      icon: Trash2,
      iconClass: "border-rose-200 bg-rose-50 text-rose-600",
      barClass: "bg-gradient-to-r from-rose-500 to-red-500",
      borderClass: "border-rose-200/70",
    };
  }

  if (includesAny(normalizedAction, ["CRIAR", "CREATE", "POST", "ADICION", "REGISTER"])) {
    return {
      label: "Criação",
      icon: PlusCircle,
      iconClass: "border-emerald-200 bg-emerald-50 text-emerald-600",
      barClass: "bg-gradient-to-r from-emerald-500 to-teal-500",
      borderClass: "border-emerald-200/80",
    };
  }

  if (includesAny(normalizedAction, ["ATUALIZ", "UPDATE", "PATCH", "PUT", "ALTER", "EDIT"])) {
    return {
      label: "Atualização",
      icon: PencilLine,
      iconClass: "border-amber-200 bg-amber-50 text-amber-700",
      barClass: "bg-gradient-to-r from-amber-500 to-orange-500",
      borderClass: "border-amber-200/80",
    };
  }

  if (includesAny(normalizedAction, ["LOGIN", "SIGNIN", "AUTENTIC", "LOGOUT", "SIGNOUT"])) {
    return {
      label: "Acesso",
      icon: LogIn,
      iconClass: "border-sky-200 bg-sky-50 text-sky-700",
      barClass: "bg-gradient-to-r from-sky-500 to-blue-500",
      borderClass: "border-sky-200/80",
    };
  }

  return {
    label: "Atividade",
    icon: Activity,
    iconClass: "border-zinc-200 bg-zinc-50 text-zinc-700",
    barClass: "bg-gradient-to-r from-zinc-400 to-zinc-500",
    borderClass: "border-zinc-200",
  };
}

const quickActions = [
  {
    href: "/perfil/seguranca",
    title: "Segurança e senha",
    description: "Atualize senha e reforce a proteção da conta.",
    icon: Shield,
  },
  // TODO: Reativar quando as páginas estiverem implementadas.
  // {
  //   href: "/perfil/configuracoes",
  //   title: "Configurações da conta",
  //   description: "Ajuste preferências pessoais e exibição.",
  //   icon: Settings2,
  // },
  // {
  //   href: "/perfil/notificacoes",
  //   title: "Notificações",
  //   description: "Defina como e quando deseja ser avisado.",
  //   icon: Bell,
  // },
  {
    href: "/perfil/suporte",
    title: "Ajuda e suporte",
    description: "Abra chamados e acompanhe atendimento.",
    icon: LifeBuoy,
  },
] as const;

export default function PerfilPage() {
  const [currentUser, setCurrentUser] = useState<AuthUserResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [activityPage, setActivityPage] = useState(0);
  const [allContractActivityLogs, setAllContractActivityLogs] = useState<AuditLogResponseDTO[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [avatarImageUrl, setAvatarImageUrl] = useState<string | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileFormError, setProfileFormError] = useState<string | null>(null);
  const [profileActionMessage, setProfileActionMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadUserData = async () => {
      try {
        setErrorMessage(null);
        const user = await fetchAuthMe();
        if (cancelled) {
          return;
        }
        setCurrentUser(user);
      } catch (error) {
        if (cancelled) {
          return;
        }
        setCurrentUser(null);
        setErrorMessage(getRequestErrorMessage(error));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadUserData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadAvatarImage = async () => {
      const avatarReference = currentUser?.avatarUrl?.trim();
      if (!avatarReference) {
        setAvatarImageUrl(null);
        return;
      }

      if (/^https?:\/\//i.test(avatarReference)) {
        setAvatarImageUrl(avatarReference);
        return;
      }

      if (!isUuid(avatarReference)) {
        setAvatarImageUrl(null);
        return;
      }

      try {
        const download = await generateDocumentDownloadUrl(avatarReference, {
          expiresInMinutes: 60,
        });
        if (!cancelled) {
          setAvatarImageUrl(download.url);
        }
      } catch {
        if (!cancelled) {
          setAvatarImageUrl(null);
        }
      }
    };

    void loadAvatarImage();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.avatarUrl]);

  useEffect(() => {
    if (activeTab !== "activities") {
      return;
    }

    let cancelled = false;

    const loadActivities = async () => {
      setActivitiesLoading(true);
      setActivitiesError(null);

      try {
        const logs = await fetchMyContractActivities();

        if (cancelled) {
          return;
        }

        setAllContractActivityLogs(logs);
      } catch (error) {
        if (cancelled) {
          return;
        }
        setAllContractActivityLogs([]);
        setActivitiesError(getRequestErrorMessage(error));
      } finally {
        if (!cancelled) {
          setActivitiesLoading(false);
        }
      }
    };

    void loadActivities();

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const activityTotalElements = allContractActivityLogs.length;
  const activityTotalPages =
    activityTotalElements === 0 ? 0 : Math.ceil(activityTotalElements / ACTIVITY_CARDS_PER_PAGE);
  const activityLogs = useMemo(() => {
    const safePage = activityTotalPages === 0 ? 0 : Math.min(activityPage, activityTotalPages - 1);
    const start = safePage * ACTIVITY_CARDS_PER_PAGE;
    return allContractActivityLogs.slice(start, start + ACTIVITY_CARDS_PER_PAGE);
  }, [activityPage, activityTotalPages, allContractActivityLogs]);

  useEffect(() => {
    if (activityTotalPages === 0 && activityPage !== 0) {
      setActivityPage(0);
      return;
    }

    if (activityTotalPages > 0 && activityPage > activityTotalPages - 1) {
      setActivityPage(activityTotalPages - 1);
    }
  }, [activityPage, activityTotalPages]);

  const healthScore = useMemo(() => {
    if (!currentUser) {
      return 0;
    }
    return getHealthScore(currentUser);
  }, [currentUser]);
  const isProtectedOwner = currentUser?.role === "OWNER";
  const visibleQuickActions = useMemo(
    () =>
      quickActions.filter(
        (action) => !(isProtectedOwner && action.href === "/perfil/seguranca")
      ),
    [isProtectedOwner]
  );

  const avatarPreviewUrl = useMemo(() => {
    if (!avatarFile) {
      return "";
    }
    return URL.createObjectURL(avatarFile);
  }, [avatarFile]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const profileAvatarPreview = avatarPreviewUrl || avatarImageUrl;

  const openEditProfile = () => {
    if (currentUser?.role === "OWNER") {
      setProfileActionMessage("Conta Owner protegida. Edicao de perfil e troca de senha estao bloqueadas.");
      return;
    }
    setProfileFormError(null);
    setProfileActionMessage(null);
    setAvatarFile(null);
    setIsEditProfileOpen(true);
  };

  const closeEditProfile = () => {
    setAvatarFile(null);
    setProfileFormError(null);
    setIsEditProfileOpen(false);
  };

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setProfileFormError("Selecione um arquivo de imagem (JPG ou PNG).");
      setAvatarFile(null);
      return;
    }

    if (file.size > MAX_PROFILE_PHOTO_BYTES) {
      setProfileFormError("A imagem excede o limite de 20MB.");
      setAvatarFile(null);
      return;
    }

    setProfileFormError(null);
    setAvatarFile(file);
  };

  const saveProfilePhoto = async () => {
    if (currentUser?.role === "OWNER") {
      setProfileFormError("Conta Owner protegida. A foto de perfil nao pode ser alterada.");
      return;
    }

    if (!avatarFile) {
      setProfileFormError("Selecione uma foto para salvar.");
      return;
    }

    try {
      setIsSavingProfile(true);
      setProfileFormError(null);
      setProfileActionMessage(null);

      const updatedUser = await uploadMyAvatar(avatarFile);
      setCurrentUser(updatedUser);
      setProfileActionMessage("Foto de perfil atualizada com sucesso.");
      closeEditProfile();
    } catch (error) {
      setProfileFormError(getRequestErrorMessage(error));
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100">
        <NavBar />
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-13 lg:px-8">
          <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-10 shadow-sm">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-[#004225]" />
              <p className="text-gray-600">Carregando perfil...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100">
        <NavBar />
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-13 lg:px-8">
          <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-10 shadow-sm">
            <div className="text-center">
              <User className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p className="text-gray-600">
                {errorMessage ?? "Não foi possível carregar os dados do perfil."}
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100">
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-13 lg:px-8">
        <div className="space-y-6">
          <header className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Meu Perfil</h1>
            <p className="text-sm text-gray-600 sm:text-base">
              Gerencie seus dados da conta e personalize sua experiência no sistema.
            </p>
          </header>

          {profileActionMessage ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              {profileActionMessage}
            </div>
          ) : null}

          {isProtectedOwner ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              Contas Owner sao protegidas. Edicao de perfil e alteracao de senha ficam bloqueadas.
            </div>
          ) : null}

          <ProfileHeader
            user={currentUser}
            avatarImageUrl={avatarImageUrl}
            onEditProfile={isProtectedOwner ? undefined : openEditProfile}
          />

          <section className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTab === "overview"
                    ? "bg-[#004225] text-white"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                Visão geral
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("activities");
                  setActivityPage(0);
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTab === "activities"
                    ? "bg-[#004225] text-white"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                Últimas atividades
              </button>
            </div>
          </section>

          {activeTab === "overview" && (
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Ações rápidas</h2>
                    <p className="text-sm text-gray-600">
                      Acesse as áreas mais usadas para manter seu perfil atualizado.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {visibleQuickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link
                        key={action.href}
                        href={action.href}
                        className="group rounded-xl border border-gray-200 bg-gray-50/80 p-4 transition-all hover:border-emerald-300 hover:bg-emerald-50/70"
                      >
                        <div className="mb-3 inline-flex rounded-lg bg-white p-2 text-[#004225] shadow-sm ring-1 ring-gray-200">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-semibold text-gray-900">{action.title}</h3>
                          <p className="text-sm text-gray-600">{action.description}</p>
                        </div>
                        <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#004225]">
                          Abrir
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">Saúde da conta</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Indicadores básicos para monitorar sua conta.
                </p>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">Perfil completo</span>
                    <span className="font-semibold text-gray-900">{healthScore}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#004225] to-[#00B894] transition-all"
                      style={{ width: `${healthScore}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50/70 p-3">
                    {currentUser.status === "ACTIVE" ? (
                      <CircleCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                    ) : (
                      <CircleX className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">Status da conta</p>
                      <p className="text-xs text-gray-600">
                        {currentUser.status === "ACTIVE"
                          ? "Conta ativa e pronta para uso."
                          : "Conta com restrições. Revise com o administrador."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50/70 p-3">
                    {currentUser.username ? (
                      <CircleCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                    ) : (
                      <CircleX className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">Identificador de usuário</p>
                      <p className="text-xs text-gray-600">
                        {currentUser.username
                          ? `@${currentUser.username}`
                          : "Defina um usuário em Configurações para facilitar identificação."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeTab === "activities" && (
            <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/60 p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Últimas atividades</h2>
                  <p className="text-sm text-gray-600">
                    Últimas ações do usuário logado relacionadas a contratos.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 font-medium text-emerald-700">
                    {activityTotalElements} registro(s)
                  </span>
                  <span className="rounded-full border border-gray-200 bg-white px-3 py-1 font-medium text-gray-700">
                    {ACTIVITY_CARDS_PER_PAGE} por página
                  </span>
                </div>
              </div>

              {activitiesLoading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {Array.from({ length: ACTIVITY_CARDS_PER_PAGE }).map((_, index) => (
                    <div
                      key={`activity-skeleton-${index}`}
                      className="rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm"
                    >
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 w-2/3 rounded bg-gray-200" />
                        <div className="h-3 w-full rounded bg-gray-200" />
                        <div className="h-3 w-4/5 rounded bg-gray-200" />
                        <div className="h-16 rounded-lg bg-gray-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activitiesError ? (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/80 p-5 text-sm text-red-700">
                  <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{activitiesError}</span>
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white/90 p-5 text-sm text-gray-600">
                  <Activity className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-500" />
                  <span>Nenhuma atividade de contratos encontrada para este usuário.</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {activityLogs.map((log) => {
                      const accent = resolveActivityAccent(log.action);

                      return (
                        <AuditLogCard
                          key={log.auditId || String(log.id)}
                          log={log}
                          accent={{
                            label: accent.label,
                            icon: accent.icon,
                            iconClassName: accent.iconClass,
                            barClassName: accent.barClass,
                            borderClassName: accent.borderClass,
                          }}
                          className="group h-full bg-white/90 transition-all hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-gray-600 sm:grid-cols-2">
                            <div className="rounded-lg border border-gray-200 bg-white/90 p-2.5">
                              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-500">
                                Módulo / tela
                              </p>
                              <p className="line-clamp-2 font-medium text-gray-700">{resolveContext(log)}</p>
                            </div>

                            <div className="rounded-lg border border-gray-200 bg-white/90 p-2.5">
                              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-500">
                                Registro
                              </p>
                              <p className="line-clamp-2 font-medium text-gray-700">{resolveEntity(log)}</p>
                            </div>
                          </div>
                        </AuditLogCard>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex flex-col gap-3 rounded-xl border border-emerald-100 bg-white/90 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-700">
                      Página {activityTotalPages === 0 ? 0 : activityPage + 1} de {activityTotalPages} |{" "}
                      {activityTotalElements} atividade(s)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-gray-300 bg-white"
                        onClick={() => setActivityPage((previous) => Math.max(0, previous - 1))}
                        disabled={activityPage === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-gray-300 bg-white"
                        onClick={() =>
                          setActivityPage((previous) => Math.min(activityTotalPages - 1, previous + 1))
                        }
                        disabled={activityTotalPages === 0 || activityPage >= activityTotalPages - 1}
                      >
                        Próxima
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </section>
          )}

          {isEditProfileOpen ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
              <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-[#00331d] via-[#004225] to-[#00623f] px-5 py-4 text-white">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">Editar perfil</h3>
                    <p className="text-xs text-white/90">Atualize sua foto de perfil.</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeEditProfile}
                    className="rounded-lg p-2 transition hover:bg-white/15"
                    aria-label="Fechar modal de edição de perfil"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4 p-5">
                  <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                    <div className="h-20 w-20 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                      {profileAvatarPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profileAvatarPreview}
                          alt={`Pre-visualização da foto de ${currentUser.fullName}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#004225]">
                          <Camera className="h-8 w-8" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{currentUser.fullName}</p>
                      <p className="truncate text-xs text-gray-600">@{currentUser.username || "sem-usuário"}</p>
                      <p className="text-xs text-gray-500">Formatos recomendados: JPG e PNG (max. 20MB).</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="profile-avatar-upload"
                      className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      <Upload className="h-4 w-4" />
                      Selecionar foto
                    </label>
                    <input
                      id="profile-avatar-upload"
                      type="file"
                      accept="image/png,image/jpeg"
                      className="hidden"
                      onChange={handleAvatarFileChange}
                    />
                    {avatarFile ? (
                      <p className="text-xs text-gray-600">
                        {avatarFile.name} ({formatFileSize(avatarFile.size)})
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500">Nenhum arquivo selecionado.</p>
                    )}
                  </div>

                  {profileFormError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {profileFormError}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-4">
                  <Button type="button" variant="outline" onClick={closeEditProfile}>
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={saveProfilePhoto}
                    disabled={isSavingProfile || !avatarFile}
                    className="bg-[#004225] text-white hover:bg-[#00331d]"
                  >
                    {isSavingProfile ? "Salvando..." : "Salvar foto"}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

