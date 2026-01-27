"use client";

import { useEffect, useRef, useCallback } from "react";
import { X, Bell, Check, CheckCheck } from "lucide-react";
import { useNotification } from "@/contexts/NotificationContext";
import { cn } from "@/lib/utils";
import { Notification, mockNotifications } from "../data";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Formata a data/hora de forma relativa e discreta
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "Agora";
  if (diffMinutes < 60) return `${diffMinutes}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/**
 * Retorna a cor do indicador baseado no tipo de notificação
 */
function getTypeIndicatorColor(type: Notification["type"]): string {
  switch (type) {
    case "success":
      return "bg-[#1E7F4B]";
    case "warning":
      return "bg-amber-500";
    case "error":
      return "bg-red-500";
    case "info":
    default:
      return "bg-[#1F4E79]";
  }
}

// ============================================================================
// NOTIFICATION ITEM COMPONENT
// ============================================================================

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

function NotificationItem({ notification, onMarkAsRead, onClick }: NotificationItemProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(notification)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(notification);
        }
      }}
      className={cn(
        "group relative flex gap-3 px-4 py-3 cursor-pointer transition-all duration-200",
        "hover:bg-zinc-50 focus:bg-zinc-50 focus:outline-none",
        !notification.read && "bg-[#1F4E79]/5"
      )}
    >
      {/* Indicador de tipo */}
      <div className="flex-shrink-0 pt-1">
        <div className={cn("w-2 h-2 rounded-full", getTypeIndicatorColor(notification.type))} />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4
            className={cn(
              "text-sm leading-snug truncate",
              notification.read ? "font-normal text-zinc-700" : "font-semibold text-zinc-900"
            )}
          >
            {notification.title}
          </h4>
          <span className="flex-shrink-0 text-xs text-zinc-400">
            {formatRelativeTime(notification.timestamp)}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-zinc-500 line-clamp-2">{notification.message}</p>
      </div>

      {/* Indicador de não lida */}
      {!notification.read && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-2 h-2 rounded-full bg-[#00C48B]" />
        </div>
      )}

      {/* Botão marcar como lida (visível no hover) */}
      {!notification.read && onMarkAsRead && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMarkAsRead(notification.id);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 rounded-md hover:bg-zinc-200"
          aria-label="Marcar como lida"
        >
          <Check className="w-3.5 h-3.5 text-zinc-500" />
        </button>
      )}
    </div>
  );
}

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
        <Bell className="w-8 h-8 text-zinc-400" />
      </div>
      <h3 className="text-base font-medium text-zinc-700 mb-1">
        Nenhuma notificação
      </h3>
      <p className="text-sm text-zinc-500 max-w-[200px]">
        Você está em dia! Quando houver novidades, elas aparecerão aqui.
      </p>
    </div>
  );
}

// ============================================================================
// NOTIFICATION DRAWER COMPONENT
// ============================================================================

export function NotificationDrawer() {
  const { isDrawerOpen, closeDrawer } = useNotification();
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Lista de notificações (futuramente virá da API)
  const notifications = mockNotifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Handler para marcar como lida
  const handleMarkAsRead = useCallback((id: string) => {
    // TODO: Integrar com API
    console.log("Marcar como lida:", id);
  }, []);

  // Handler para marcar todas como lidas
  const handleMarkAllAsRead = useCallback(() => {
    // TODO: Integrar com API
    console.log("Marcar todas como lidas");
  }, []);

  // Handler para click na notificação
  const handleNotificationClick = useCallback((notification: Notification) => {
    // TODO: Navegar para actionUrl se existir
    if (notification.actionUrl) {
      console.log("Navegar para:", notification.actionUrl);
    }
    closeDrawer();
  }, [closeDrawer]);

  // Focus trap e ESC handler
  useEffect(() => {
    if (!isDrawerOpen) return;

    // Focus no botão de fechar ao abrir
    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 100);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeDrawer();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  // Click outside handler
  useEffect(() => {
    if (!isDrawerOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        closeDrawer();
      }
    };

    // Delay to prevent immediate close
    setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 10);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDrawerOpen, closeDrawer]);

  return (
    <>
      {/* Drawer Panel - posicionado abaixo do navbar */}
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Painel de notificações"
        className={cn(
          "fixed top-16 right-0 z-40 h-[calc(100vh-4rem)] w-full sm:w-[400px] max-w-full",
          "bg-white shadow-2xl flex flex-col border-l border-zinc-200",
          "transition-transform duration-300 ease-out",
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-4 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-[#1F4E79]" />
            <h2 className="text-lg font-semibold text-zinc-900">Notificações</h2>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-[#00C48B]/15 text-[#1E7F4B] rounded-full">
                {unreadCount} {unreadCount === 1 ? "nova" : "novas"}
              </span>
            )}
          </div>
          <button
            ref={closeButtonRef}
            onClick={closeDrawer}
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#1F4E79]/50"
            aria-label="Fechar notificações"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Actions Bar */}
        {notifications.length > 0 && unreadCount > 0 && (
          <div className="px-4 py-2 border-b border-zinc-100 bg-zinc-50/50">
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 text-sm text-[#1F4E79] hover:text-[#153653] font-medium transition-colors duration-200"
            >
              <CheckCheck className="w-4 h-4" />
              Marcar todas como lidas
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="divide-y divide-zinc-100">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onClick={handleNotificationClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <footer className="px-4 py-3 border-t border-zinc-200 bg-zinc-50/50">
            <button
              onClick={() => {
                // TODO: Navegar para página completa de notificações
                console.log("Ver todas as notificações");
                closeDrawer();
              }}
              className="w-full text-center text-sm font-medium text-[#1F4E79] hover:text-[#153653] transition-colors duration-200 py-2 rounded-lg hover:bg-zinc-100"
            >
              Ver todas as notificações
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}
