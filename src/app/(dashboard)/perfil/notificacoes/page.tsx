"use client";

import { useState, useCallback } from "react";
import { Bell, Check, CheckCheck, Settings, Filter, ArrowRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavBar } from "@/components/ui/NavBar";
import { Notification, mockNotifications } from "./data";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "Agora";
  if (diffMinutes < 60) return `${diffMinutes} minutos atrás`;
  if (diffHours < 24) return `${diffHours} horas atrás`;
  if (diffDays < 7) return `${diffDays} dias atrás`;
  
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

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

function getTypeLabel(type: Notification["type"]): string {
  switch (type) {
    case "success":
      return "Sucesso";
    case "warning":
      return "Atenção";
    case "error":
      return "Erro";
    case "info":
    default:
      return "Informação";
  }
}

// ============================================================================
// NOTIFICATION CARD COMPONENT
// ============================================================================

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

function NotificationCard({ notification, onMarkAsRead, onClick }: NotificationCardProps) {
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
        "group relative flex gap-4 p-4 cursor-pointer transition-all duration-200 rounded-lg border",
        "hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#1F4E79]/30",
        notification.actionUrl && "hover:border-[#1F4E79]/40",
        "bg-white border-[#1F4E79]/20 shadow-sm"
      )}
    >
      {/* Indicador de tipo */}
      <div className="flex-shrink-0 pt-1">
        <div className={cn("w-3 h-3 rounded-full", getTypeIndicatorColor(notification.type))} />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4 mb-1">
          <h4
            className={cn(
              "text-base leading-snug",
              notification.read ? "font-normal text-zinc-700" : "font-semibold text-zinc-900"
            )}
          >
            {notification.title}
          </h4>
          <div className="flex items-center gap-3 flex-shrink-0">
            {!notification.read && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-[#00C48B]/15 text-[#1E7F4B] rounded-full">
                Nova
              </span>
            )}
            <span className="text-xs text-zinc-400 whitespace-nowrap">
              {formatRelativeTime(notification.timestamp)}
            </span>
          </div>
        </div>
        <p className="text-sm text-zinc-600 mb-2">{notification.message}</p>
        <div className="flex items-center gap-3">
          <span className={cn(
            "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full",
            notification.type === "success" && "bg-green-100 text-green-700",
            notification.type === "warning" && "bg-amber-100 text-amber-700",
            notification.type === "error" && "bg-red-100 text-red-700",
            notification.type === "info" && "bg-blue-100 text-blue-700"
          )}>
            {getTypeLabel(notification.type)}
          </span>
          {notification.actionUrl && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-[#1F4E79]/5 text-[#1F4E79] rounded-md group-hover:bg-[#1F4E79]/10 group-hover:text-[#153653] transition-all duration-200">
              <span className="text-xs font-medium">
                {notification.type === "warning" || notification.type === "error" ? "Ação necessária" : "Ver detalhes"}
              </span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-200" />
            </div>
          )}
        </div>
      </div>

      {/* Indicador de clicável para cards com ação */}
      {notification.actionUrl && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-60 transition-opacity duration-200">
          <ExternalLink className="w-4 h-4 text-zinc-400" />
        </div>
      )}
      
      {/* Botão marcar como lida */}
      {!notification.read && onMarkAsRead && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMarkAsRead(notification.id);
          }}
          className={cn(
            "absolute p-2 rounded-lg hover:bg-zinc-100 transition-all duration-200",
            notification.actionUrl ? "right-4 top-10 opacity-0 group-hover:opacity-100" : "right-4 top-4 opacity-0 group-hover:opacity-100"
          )}
          aria-label="Marcar como lida"
          title="Marcar como lida"
        >
          <Check className="w-4 h-4 text-zinc-500" />
        </button>
      )}
    </div>
  );
}

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

function EmptyState({ filter }: { filter: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
        <Bell className="w-10 h-10 text-zinc-400" />
      </div>
      <h3 className="text-lg font-medium text-zinc-700 mb-2">
        {filter === "all" ? "Nenhuma notificação" : "Nenhuma notificação encontrada"}
      </h3>
      <p className="text-sm text-zinc-500 max-w-[300px]">
        {filter === "all" 
          ? "Você está em dia! Quando houver novidades, elas aparecerão aqui."
          : "Não há notificações que correspondam ao filtro selecionado."
        }
      </p>
    </div>
  );
}

// ============================================================================
// NOTIFICATIONS PAGE COMPONENT
// ============================================================================

type FilterType = "all" | "unread" | "read";

export default function NotificacoesPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  
  // Lista de notificações (futuramente virá da API)
  const notifications = mockNotifications;
  const unreadCount = notifications.filter((n) => !n.read).length;
  
  // Filtrar notificações
  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "read") return n.read;
    return true;
  });

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
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <NavBar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-3">
              <Bell className="w-7 h-7 text-[#1F4E79]" />
              Notificações
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              {unreadCount > 0 
                ? `Você tem ${unreadCount} ${unreadCount === 1 ? "notificação não lida" : "notificações não lidas"}`
                : "Todas as notificações foram lidas"
              }
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="group flex items-center gap-2.5 px-5 py-2.5 text-sm font-semibold text-[#1F4E79] bg-white border border-[#1F4E79]/20 rounded-lg shadow-sm hover:bg-[#00C48B] hover:text-white hover:border-[#00C48B] hover:shadow-md active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00C48B]/50 focus:ring-offset-2"
              >
                <CheckCheck className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                <span>Marcar todas como lidas</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-zinc-200">
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
                filter === "all" 
                  ? "bg-white text-zinc-900 shadow-sm" 
                  : "text-zinc-600 hover:text-zinc-900"
              )}
            >
              Todas ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
                filter === "unread" 
                  ? "bg-white text-zinc-900 shadow-sm" 
                  : "text-zinc-600 hover:text-zinc-900"
              )}
            >
              Não lidas ({unreadCount})
            </button>
            <button
              onClick={() => setFilter("read")}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
                filter === "read" 
                  ? "bg-white text-zinc-900 shadow-sm" 
                  : "text-zinc-600 hover:text-zinc-900"
              )}
            >
              Lidas ({notifications.length - unreadCount})
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onClick={handleNotificationClick}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
