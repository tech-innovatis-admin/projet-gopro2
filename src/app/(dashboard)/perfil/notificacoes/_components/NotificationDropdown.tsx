"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
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
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
        <Bell className="w-6 h-6 text-zinc-400" />
      </div>
      <h3 className="text-sm font-medium text-zinc-700 mb-1">
        Nenhuma notificação
      </h3>
      <p className="text-xs text-zinc-500 max-w-[180px]">
        Você está em dia! Quando houver novidades, elas aparecerão aqui.
      </p>
    </div>
  );
}

// ============================================================================
// NOTIFICATION DROPDOWN COMPONENT
// ============================================================================

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Lista de notificações (futuramente virá da API)
  const notifications = mockNotifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleDropdown = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

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
    closeDropdown();
  }, [closeDropdown]);

  // ESC handler e click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeDropdown();
        buttonRef.current?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, closeDropdown]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão de Notificações */}
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className="relative p-2 text-[#004225] hover:text-white hover:bg-[#31938A] rounded-lg transition-colors duration-200"
        aria-label={isOpen ? "Fechar notificações" : "Abrir notificações"}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5" />
        {/* Badge de notificações não lidas */}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-[#00C48B] rounded-full animate-pulse" />
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          role="menu"
          aria-label="Painel de notificações"
          className={cn(
            "absolute right-0 top-full mt-2 z-50",
            "w-[360px] max-w-[calc(100vw-2rem)] max-h-[480px]",
            "bg-white rounded-xl shadow-xl border border-zinc-200",
            "flex flex-col overflow-hidden",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
          )}
        >
          {/* Header */}
          <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-zinc-50/50">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-zinc-900">Notificações</h2>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium bg-[#00C48B]/15 text-[#1E7F4B] rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {notifications.length > 0 && unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1.5 text-xs text-[#1F4E79] hover:text-[#153653] font-medium transition-colors duration-200"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar todas
              </button>
            )}
          </header>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto max-h-[340px]">
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
            <footer className="px-4 py-2.5 border-t border-zinc-200 bg-zinc-50/50">
              <button
                onClick={() => {
                  // TODO: Navegar para página completa de notificações
                  console.log("Ver todas as notificações");
                  closeDropdown();
                }}
                className="w-full text-center text-xs font-medium text-[#1F4E79] hover:text-[#153653] transition-colors duration-200 py-1.5 rounded-lg hover:bg-zinc-100"
              >
                Ver todas as notificações
              </button>
            </footer>
          )}
        </div>
      )}
    </div>
  );
}
