"use client";

import { useEffect, useMemo, useState } from "react";
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
  Activity,
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

type UserRole = "superadmin" | "admin" | "analista" | "estagiario";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
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
      { label: "Pre-Contratos", href: "/contratos/pre-projetos", icon: FileCodeIcon },
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

  const isSuperAdmin = currentUser?.role === "superadmin";
  const isAdmin = isSuperAdmin || currentUser?.role === "admin";

  const navigationItems = useMemo<NavItem[]>(() => {
    if (!isAdmin) {
      return baseNavigationItems;
    }

    const adminChildren: NavItem[] = [
      { label: "Usuarios", href: "/admin/usuarios", icon: Users },
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
          <img src="/Logos/logo_innovatis_preta.svg" alt="Logo Innovatis" className="h-6 w-6" />
          <span className="text-2xl font-semibold tracking-tight">GoPro2</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navigationItems.map(renderDesktopItem)}
        </div>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#004225] to-[#00B894] text-sm font-semibold text-white">
                    {extractInitial(currentUser.name)}
                  </div>
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
                    onClick={() => router.push(isSuperAdmin ? "/admin/convites" : "/admin/usuarios")}
                    className="cursor-pointer gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Administracao
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
          <div className="space-y-1">{navigationItems.map(renderMobileItem)}</div>
        </div>
      )}
    </nav>
  );
}
