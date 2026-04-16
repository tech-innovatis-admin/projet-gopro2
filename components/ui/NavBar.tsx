"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertTriangle,
  Activity,
  Bell,
  ChevronDown,
  FileCodeIcon,
  FileText,
  FolderOpen,
  Home,
  LogOut,
  Menu,
  Shield,
  User,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { listMyNotifications } from "@/src/lib/api/endpoints";
import { type AuthNotificationResponseDTO } from "@/src/lib/api/types";
import {
  loadReadNotificationIds,
  saveReadNotificationIds,
  subscribeReadNotificationIds,
} from "@/src/lib/notifications/readState";

type UserRole = "superadmin" | "admin" | "analista" | "estagiario";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
  avatarImageUrl?: string | null;
};

type NotificationType = "info" | "danger";
type NotificationCategory = "created" | "status_change" | "expiring";

type NavbarNotification = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  href: string;
  type: NotificationType;
  category: NotificationCategory;
};

interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}

const MAX_NAVBAR_NOTIFICATIONS = 8;

function resolveNotificationTimestamp(value: string | undefined): number {
  if (!value) {
    return 0;
  }

  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatRelativeTime(value: string): string {
  const timestamp = resolveNotificationTimestamp(value);
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
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(timestamp));
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
  return "info";
}

function toNavbarNotification(item: AuthNotificationResponseDTO): NavbarNotification {
  const timestamp = item.occurredAt ?? new Date().toISOString();
  return {
    id: item.id,
    title: item.title,
    message: item.message,
    timestamp,
    href: item.href?.trim() ? item.href : "/contratos",
    type: normalizeType(item.category, item.severity),
    category: normalizeCategory(item.category),
  };
}

function sortNavbarNotifications(items: NavbarNotification[]): NavbarNotification[] {
  const priorityByCategory: Record<NotificationCategory, number> = {
    expiring: 0,
    status_change: 1,
    created: 2,
  };

  return [...items].sort((first, second) => {
    const firstPriority = priorityByCategory[first.category];
    const secondPriority = priorityByCategory[second.category];

    if (firstPriority !== secondPriority) {
      return firstPriority - secondPriority;
    }

    if (first.category === "expiring" && second.category === "expiring") {
      return resolveNotificationTimestamp(first.timestamp) - resolveNotificationTimestamp(second.timestamp);
    }

    return resolveNotificationTimestamp(second.timestamp) - resolveNotificationTimestamp(first.timestamp);
  });
}

const baseNavigationItems: NavItem[] = [
  {
    label: "Home",
    href: "/home",
    icon: Home,
  },
  {
    label: "Contratos",
    href: "/contratos",
    icon: FolderOpen,
    children: [
      { label: "Todos os Contratos", href: "/contratos", icon: FolderOpen },
      { label: "Novo Contrato", href: "/contratos/novo-contrato", icon: FileText },
      { label: "Pré-Contratos", href: "/contratos/pre-projetos", icon: FileCodeIcon },
    ],
  },
  {
    label: "Gestão",
    href: "/gestão",
    icon: Users,
    children: [
      { label: "Parceiros", href: "/parceiros", icon: FolderOpen },
      { label: "Fornecedores", href: "/fornecedores", icon: FileText },
    ],
  },
];

function isItemActive(pathname: string, href: string): boolean {
  if (href === "/home") {
    return pathname === "/home";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function extractInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return "U";
  }
  return trimmed.charAt(0).toUpperCase();
}

export function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [notifications, setNotifications] = useState<NavbarNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set<string>());

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          if (!cancelled) {
            setCurrentUser(null);
          }
          return;
        }

        const data = await response.json();
        if (!cancelled && data?.isAuthenticated && data?.user) {
          setCurrentUser(data.user as SessionUser);
        }
      } catch {
        if (!cancelled) {
          setCurrentUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingUser(false);
        }
      }
    }

    void loadCurrentUser();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setOpenDropdown(null);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const syncReadIds = () => {
      setReadNotificationIds(loadReadNotificationIds());
    };

    syncReadIds();
    return subscribeReadNotificationIds(syncReadIds);
  }, []);

  const isSuperAdmin = currentUser?.role === "superadmin";
  const isAdmin = isSuperAdmin || currentUser?.role === "admin";

  const markNotificationAsRead = useCallback((notificationId: string) => {
    if (!notificationId) {
      return;
    }

    setReadNotificationIds((current) => {
      if (current.has(notificationId)) {
        return current;
      }

      const next = new Set(current);
      next.add(notificationId);
      saveReadNotificationIds(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setLoadingNotifications(false);
      return;
    }

    let cancelled = false;

    async function loadNotifications() {
      setLoadingNotifications(true);

      try {
        const response = await listMyNotifications({ size: MAX_NAVBAR_NOTIFICATIONS });
        const merged = sortNavbarNotifications(response.map(toNavbarNotification)).slice(0, MAX_NAVBAR_NOTIFICATIONS);

        if (!cancelled) {
          setNotifications(merged);
        }
      } catch {
        if (!cancelled) {
          setNotifications([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingNotifications(false);
        }
      }
    }

    void loadNotifications();

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  const navigationItems = useMemo<NavItem[]>(() => {
    if (!isAdmin) {
      return baseNavigationItems;
    }

    const adminChildren: NavItem[] = [
      { label: "Usuários", href: "/admin/usuarios", icon: Users },
    ];
    if (isSuperAdmin) {
      adminChildren.unshift({ label: "Convites", href: "/admin/convites", icon: Shield });
      adminChildren.push({ label: "Auditoria", href: "/admin/auditoria", icon: Activity });
    }

    const adminDefaultHref = isSuperAdmin ? "/admin/convites" : "/admin/usuarios";

    return [
      ...baseNavigationItems,
      {
        label: "Admin",
        href: adminDefaultHref,
        icon: Shield,
        children: adminChildren,
      },
    ];
  }, [isAdmin, isSuperAdmin]);

  const adminHomeHref = "/admin/usuarios";
  const resolvedNavigationItems = useMemo<NavItem[]>(() => {
    if (!isAdmin) {
      return navigationItems;
    }

    return [
      ...baseNavigationItems,
      {
        label: "Admin",
        href: adminHomeHref,
        icon: Shield,
        children: [
          { label: "Convites", href: "/admin/convites", icon: Shield },
          { label: "Usuários", href: "/admin/usuarios", icon: Users },
          { label: "Auditoria", href: "/admin/auditoria", icon: Activity },
        ],
      },
    ];
  }, [isAdmin, navigationItems]);

  const unreadNotificationCount = useMemo(
    () => notifications.filter((notification) => !readNotificationIds.has(notification.id)).length,
    [notifications, readNotificationIds]
  );
  const notificationCountLabel =
    unreadNotificationCount > 9 ? "9+" : String(unreadNotificationCount);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  const renderDesktopItem = (item: NavItem) => {
    const hasChildren = Boolean(item.children?.length);
    const isOpen = openDropdown === item.label;
    const parentActive =
      isItemActive(pathname, item.href) ||
      item.children?.some((child) => isItemActive(pathname, child.href));

    if (!hasChildren) {
      return (
        <Link
          key={item.label}
          href={item.href}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            parentActive
              ? "bg-[#004225]/10 text-[#004225]"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          )}
        >
          {item.icon && <item.icon className="h-4 w-4" />}
          <span>{item.label}</span>
        </Link>
      );
    }

    return (
      <div key={item.label} className="relative">
        <button
          type="button"
          onClick={() => setOpenDropdown(isOpen ? null : item.label)}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            parentActive
              ? "bg-[#004225]/10 text-[#004225]"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          )}
        >
          {item.icon && <item.icon className="h-4 w-4" />}
          <span>{item.label}</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </button>

        {isOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 w-60 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg">
            {item.children?.map((child) => {
              const childActive = isItemActive(pathname, child.href);
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    childActive
                      ? "bg-[#004225]/10 text-[#004225] font-semibold"
                      : "text-zinc-700 hover:bg-zinc-50"
                  )}
                >
                  {child.icon && <child.icon className="h-4 w-4" />}
                  <span>{child.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderMobileItem = (item: NavItem) => {
    const hasChildren = Boolean(item.children?.length);
    const isOpen = openDropdown === item.label;
    const parentActive =
      isItemActive(pathname, item.href) ||
      item.children?.some((child) => isItemActive(pathname, child.href));

    if (!hasChildren) {
      return (
        <Link
          key={item.label}
          href={item.href}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            parentActive
              ? "bg-[#004225]/10 text-[#004225]"
              : "text-zinc-700 hover:bg-zinc-100"
          )}
        >
          {item.icon && <item.icon className="h-4 w-4" />}
          <span>{item.label}</span>
        </Link>
      );
    }

    return (
      <div key={item.label}>
        <button
          type="button"
          onClick={() => setOpenDropdown(isOpen ? null : item.label)}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            parentActive
              ? "bg-[#004225]/10 text-[#004225]"
              : "text-zinc-700 hover:bg-zinc-100"
          )}
        >
          <span className="flex items-center gap-2">
            {item.icon && <item.icon className="h-4 w-4" />}
            {item.label}
          </span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </button>

        {isOpen && (
          <div className="ml-4 mt-2 space-y-1 border-l border-zinc-200 pl-3">
            {item.children?.map((child) => {
              const childActive = isItemActive(pathname, child.href);
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    childActive
                      ? "bg-[#004225]/10 text-[#004225] font-semibold"
                      : "text-zinc-600 hover:bg-zinc-100"
                  )}
                >
                  {child.icon && <child.icon className="h-4 w-4" />}
                  <span>{child.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/home" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Logos/logo_innovatis_preta.svg" alt="Logo Innovatis" className="h-6 w-6" />
          <span className="text-2xl font-semibold tracking-tight">GoPro2</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {resolvedNavigationItems.map(renderDesktopItem)}
        </div>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-lg text-zinc-700 hover:bg-zinc-100"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadNotificationCount > 0 && (
                      <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                        {notificationCountLabel}
                      </span>
                    )}
                    <span className="sr-only">Abrir notificações</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[360px] p-0">
                  <div className="border-b border-zinc-200 px-4 py-3">
                    <p className="text-sm font-semibold text-zinc-900">Notificações</p>
                    <p className="text-xs text-zinc-500">
                      {loadingNotifications
                        ? "Carregando alertas..."
                        : unreadNotificationCount > 0
                          ? `${unreadNotificationCount} não lida(s)`
                          : "Sem alertas no momento"}
                    </p>
                  </div>

                  <div className="max-h-96 space-y-1 overflow-y-auto p-2">
                    {loadingNotifications ? (
                      <p className="px-2 py-6 text-center text-sm text-zinc-500">Carregando notificações...</p>
                    ) : notifications.length === 0 ? (
                      <p className="px-2 py-6 text-center text-sm text-zinc-500">Nenhuma notificação recente.</p>
                    ) : (
                      notifications.map((notification) => (
                        <DropdownMenuItem
                          key={notification.id}
                          onSelect={(event) => {
                            event.preventDefault();
                            markNotificationAsRead(notification.id);
                            router.push(notification.href);
                          }}
                          className={cn(
                            "cursor-pointer items-start gap-3 rounded-lg p-3",
                            !readNotificationIds.has(notification.id) && "bg-[#1F4E79]/5"
                          )}
                        >
                          <span
                            className={cn(
                              "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                              notification.type === "danger" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
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

                          <div className="min-w-0 space-y-1">
                            <p
                              className={cn(
                                "truncate text-sm text-zinc-900",
                                readNotificationIds.has(notification.id) ? "font-medium" : "font-semibold"
                              )}
                            >
                              {notification.title}
                            </p>
                            <p className="text-xs text-zinc-600">{notification.message}</p>
                            <p className="text-[11px] text-zinc-500">
                              {notification.category === "expiring"
                                ? "Vencimento"
                                : notification.category === "status_change"
                                  ? "Mudanca de status"
                                  : "Criacao"}{" "}
                              |{" "}
                              {formatRelativeTime(notification.timestamp)}
                            </p>
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      router.push("/perfil/notificacoes");
                    }}
                    className="cursor-pointer justify-center py-2.5 text-xs font-medium text-[#004225]"
                  >
                    Ver todas as notificações
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                  >
                    {currentUser.avatarImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={currentUser.avatarImageUrl}
                        alt={`Foto de perfil de ${currentUser.name}`}
                        className="h-8 w-8 rounded-full border border-zinc-200 object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#004225] to-[#00B894] text-sm font-semibold text-white">
                        {extractInitial(currentUser.name)}
                      </div>
                    )}
                    <span className="hidden max-w-32 truncate sm:block">{currentUser.name}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onClick={() => router.push("/perfil")}
                    className="cursor-pointer gap-2"
                  >
                    <User className="h-4 w-4" />
                    Perfil
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem
                      onClick={() => router.push(adminHomeHref)}
                      className="cursor-pointer gap-2"
                    >
                      <Shield className="h-4 w-4" />
                      Administração
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer gap-2 text-red-600 focus:text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button variant="ghost" disabled className="hidden md:inline-flex">
              {loadingUser ? "Carregando..." : "Conta"}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-zinc-200 bg-white px-3 py-3 md:hidden">
          <div className="space-y-1">{resolvedNavigationItems.map(renderMobileItem)}</div>
        </div>
      )}
    </nav>
  );
}
