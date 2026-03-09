"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, AlertTriangle, ArrowRight, Bell, Check, CheckCheck, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavBar } from "@/components/ui/NavBar";
import { listMyNotifications } from "@/src/lib/api/endpoints";
import { type AuthNotificationResponseDTO } from "@/src/lib/api/types";
import {
  loadReadNotificationIds,
  saveReadNotificationIds,
  subscribeReadNotificationIds,
} from "@/src/lib/notifications/readState";

type FilterType = "all" | "unread" | "read";
type NotificationCategory = "created" | "status_change" | "expiring";
type NotificationType = "info" | "success" | "danger";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  href: string;
  category: NotificationCategory;
  type: NotificationType;
};

const NOTIFICATION_PAGE_SIZE = 80;

function parseDateToTimestamp(value: string | undefined): number {
  if (!value) {
    return 0;
  }
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

function formatRelativeTime(value: string): string {
  const timestamp = parseDateToTimestamp(value);
  if (timestamp <= 0) {
    return "agora";
  }

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return "agora";
  }
  if (diffMinutes < 60) {
    return `ha ${diffMinutes} min`;
  }
  if (diffHours < 24) {
    return `ha ${diffHours} h`;
  }
  if (diffDays < 7) {
    return `ha ${diffDays} dia${diffDays > 1 ? "s" : ""}`;
  }
  return formatDate(value);
}

function normalizeCategory(category: AuthNotificationResponseDTO["category"]): NotificationCategory {
  if (category === "EXPIRING") {
    return "expiring";
  }
  if (category === "STATUS_CHANGE") {
    return "status_change";
  }
  return "created";
}

function normalizeType(
  category: AuthNotificationResponseDTO["category"],
  severity: AuthNotificationResponseDTO["severity"]
): NotificationType {
  if (severity === "DANGER" || category === "EXPIRING") {
    return "danger";
  }
  if (category === "STATUS_CHANGE") {
    return "success";
  }
  return "info";
}

function toNotificationItem(item: AuthNotificationResponseDTO): NotificationItem {
  const timestamp = item.occurredAt ?? new Date().toISOString();
  return {
    id: item.id,
    title: item.title,
    message: item.message,
    timestamp,
    href: item.href?.trim() ? item.href : "/contratos",
    category: normalizeCategory(item.category),
    type: normalizeType(item.category, item.severity),
  };
}

function sortNotifications(items: NotificationItem[]): NotificationItem[] {
  const priority: Record<NotificationCategory, number> = {
    expiring: 0,
    status_change: 1,
    created: 2,
  };

  return [...items].sort((first, second) => {
    const firstPriority = priority[first.category];
    const secondPriority = priority[second.category];
    if (firstPriority !== secondPriority) {
      return firstPriority - secondPriority;
    }

    if (first.category === "expiring" && second.category === "expiring") {
      return parseDateToTimestamp(first.timestamp) - parseDateToTimestamp(second.timestamp);
    }

    return parseDateToTimestamp(second.timestamp) - parseDateToTimestamp(first.timestamp);
  });
}

function getTypeLabel(type: NotificationType): string {
  if (type === "danger") {
    return "Danger";
  }
  if (type === "success") {
    return "Mudanca";
  }
  return "Criacao";
}

function getCategoryLabel(category: NotificationCategory): string {
  if (category === "expiring") {
    return "Vencimento";
  }
  if (category === "status_change") {
    return "Mudanca de status";
  }
  return "Criacao";
}

function getIndicatorColor(type: NotificationType): string {
  if (type === "danger") {
    return "bg-red-500";
  }
  if (type === "success") {
    return "bg-emerald-500";
  }
  return "bg-blue-500";
}

function EmptyState({ filter }: { filter: FilterType }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100">
        <Bell className="h-10 w-10 text-zinc-400" />
      </div>
      <h3 className="mb-2 text-lg font-medium text-zinc-700">
        {filter === "all" ? "Nenhuma notificacao" : "Nenhuma notificacao encontrada"}
      </h3>
      <p className="max-w-[320px] text-sm text-zinc-500">
        {filter === "all"
          ? "Quando houver novos eventos de contratos, eles serao exibidos aqui."
          : "Nao ha notificacoes que correspondam ao filtro selecionado."}
      </p>
    </div>
  );
}

export default function NotificacoesPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set<string>());

  useEffect(() => {
    const syncReadIds = () => {
      setReadNotificationIds(loadReadNotificationIds());
    };

    syncReadIds();
    return subscribeReadNotificationIds(syncReadIds);
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await listMyNotifications({ size: NOTIFICATION_PAGE_SIZE });
      const allNotifications = sortNotifications(response.map(toNotificationItem));

      setNotifications(allNotifications);
    } catch (requestError) {
      setNotifications([]);
      if (requestError instanceof Error) {
        setError(requestError.message || "Falha ao carregar notificacoes.");
      } else {
        setError("Falha ao carregar notificacoes.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !readNotificationIds.has(notification.id)).length,
    [notifications, readNotificationIds]
  );

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (filter === "unread") {
        return !readNotificationIds.has(notification.id);
      }
      if (filter === "read") {
        return readNotificationIds.has(notification.id);
      }
      return true;
    });
  }, [filter, notifications, readNotificationIds]);

  const handleMarkAsRead = useCallback((id: string) => {
    if (!id) {
      return;
    }

    setReadNotificationIds((current) => {
      if (current.has(id)) {
        return current;
      }

      const next = new Set(current);
      next.add(id);
      saveReadNotificationIds(next);
      return next;
    });
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    if (notifications.length === 0) {
      return;
    }

    setReadNotificationIds((current) => {
      const next = new Set(current);
      notifications.forEach((notification) => next.add(notification.id));
      saveReadNotificationIds(next);
      return next;
    });
  }, [notifications]);

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <NavBar />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-zinc-900">
              <Bell className="h-7 w-7 text-[#1F4E79]" />
              Notificacoes
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {unreadCount > 0
                ? `Voce tem ${unreadCount} notificacao${unreadCount > 1 ? "oes" : ""} nao lida${unreadCount > 1 ? "s" : ""}.`
                : "Todas as notificacoes estao lidas."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => void loadNotifications()}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Atualizar
            </button>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center gap-2 rounded-lg border border-[#1F4E79]/20 bg-white px-3 py-2 text-sm font-semibold text-[#1F4E79] hover:bg-[#00C48B] hover:text-white hover:border-[#00C48B]"
              >
                <CheckCheck className="h-4 w-4" />
                Marcar todas como lidas
              </button>
            )}
          </div>
        </div>

        <div className="mb-6 flex items-center gap-2 border-b border-zinc-200 pb-4">
          <div className="flex items-center gap-1 rounded-lg bg-zinc-100 p-1">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                filter === "all" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
              )}
            >
              Todas ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                filter === "unread" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
              )}
            >
              Nao lidas ({unreadCount})
            </button>
            <button
              onClick={() => setFilter("read")}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                filter === "read" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
              )}
            >
              Lidas ({notifications.length - unreadCount})
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500">
              Carregando notificacoes...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            filteredNotifications.map((notification) => {
              const isRead = readNotificationIds.has(notification.id);

              return (
                <div
                  key={notification.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    handleMarkAsRead(notification.id);
                    router.push(notification.href);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleMarkAsRead(notification.id);
                      router.push(notification.href);
                    }
                  }}
                  className={cn(
                    "group relative cursor-pointer rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1F4E79]/30",
                    isRead ? "border-zinc-200" : "border-[#1F4E79]/30"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="pt-1">
                      <div className={cn("h-3 w-3 rounded-full", getIndicatorColor(notification.type))} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <h4
                          className={cn(
                            "text-base leading-snug",
                            isRead ? "font-normal text-zinc-700" : "font-semibold text-zinc-900"
                          )}
                        >
                          {notification.title}
                        </h4>
                        <div className="flex shrink-0 items-center gap-2">
                          {!isRead && (
                            <span className="inline-flex rounded-full bg-[#00C48B]/15 px-2 py-0.5 text-xs font-medium text-[#1E7F4B]">
                              Nova
                            </span>
                          )}
                          <span className="whitespace-nowrap text-xs text-zinc-400">
                            {formatRelativeTime(notification.timestamp)}
                          </span>
                        </div>
                      </div>

                      <p className="mb-2 text-sm text-zinc-600">{notification.message}</p>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                            notification.type === "danger" && "bg-red-100 text-red-700",
                            notification.type === "success" && "bg-emerald-100 text-emerald-700",
                            notification.type === "info" && "bg-blue-100 text-blue-700"
                          )}
                        >
                          {getTypeLabel(notification.type)}
                        </span>

                        <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                          {getCategoryLabel(notification.category)}
                        </span>

                        <span className="inline-flex items-center gap-1 rounded-md bg-[#1F4E79]/5 px-2 py-1 text-xs font-medium text-[#1F4E79]">
                          Ver detalhes
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </div>

                  {!isRead && (
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                      className="absolute right-3 top-3 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100"
                      aria-label="Marcar como lida"
                      title="Marcar como lida"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}

                  <span
                    className={cn(
                      "pointer-events-none absolute bottom-3 right-3 inline-flex h-7 w-7 items-center justify-center rounded-md",
                      notification.category === "expiring"
                        ? "bg-red-50 text-red-600"
                        : notification.category === "status_change"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-blue-50 text-blue-600"
                    )}
                  >
                    {notification.category === "expiring" ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : notification.category === "status_change" ? (
                      <Activity className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
