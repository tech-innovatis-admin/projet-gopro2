"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@radix-ui/react-dropdown-menu";
import {
  Command,
  ChevronDown,
  Menu,
  X,
  Home,
  FolderOpen,
  Settings,
  Users,
  BarChart3,
  FileText,
  LogOut,
  User,
  Shield,
  FileCodeIcon,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/home",
    icon: Home,
  },
  {
    label: "Contratos",
    href: "/contratos",
    icon: FolderOpen,
    children: [
      { label: "Todos os Contratos", href: "/contratos", icon: FolderOpen },
      { label: "Funil de Contratos", href: "/contratos/funil", icon: BarChart3 },
      { label: "Novo Contrato", href: "modal:novo-contrato", icon: FileText },
      { label: "Pré-Contratos", href: "/contratos/pre-projetos", icon: FileCodeIcon },
    ],
  },
  {
    label: "Parceiros",
    href: "/parceiros",
    icon: Users,
    children: [
      { label: "Todos os Parceiros", href: "/parceiros", icon: Users },
      { label: "Fundações", href: "/parceiros/fundacoes", icon: FileText },
      { label: "IFES", href: "/parceiros/ifes", icon: BarChart3 },
    ],
  },
  {
    label: "Equipe",
    href: "/equipe",
    icon: Users,
    children: [
      { label: "Membros", href: "/equipe/membros", icon: Users },
      { label: "Permissões", href: "/equipe/permissoes", icon: Shield },
    ],
  },
];

export function NavBar() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const navbarRef = useRef<HTMLElement>(null);

  // Garantir que o componente só renderize após a hidratação no cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const toggleDropdown = (label: string) => {
    setOpenDropdowns(prev =>
      prev.includes(label)
        ? [] // Fecha o dropdown se estiver aberto
        : [label] // Abre apenas este dropdown, fechando outros
    );
  };

  // Fecha dropdowns quando clicar fora do navbar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target as Node)) {
        setOpenDropdowns([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const NavItemComponent = ({ item, isMobile = false }: { item: NavItem; isMobile?: boolean }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openDropdowns.includes(item.label);

    const handleClick = (href: string) => {
      if (href.startsWith('modal:')) {
        const modalName = href.replace('modal:', '');
        // Dispara evento customizado para abrir o modal
        window.dispatchEvent(new CustomEvent('open-modal', { detail: { modalName } }));
        setOpenDropdowns([]);
        if (isMobile) setMobileMenuOpen(false);
      }
    };

    if (hasChildren) {
      return (
        <div className="relative">
          <button
            onClick={() => toggleDropdown(item.label)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-zinc-100 hover:text-zinc-900 group",
              isMobile ? "w-full justify-between" : "",
              isOpen ? "bg-zinc-100 text-zinc-900" : "text-zinc-600"
            )}
          >
            {item.icon && <item.icon className="h-4 w-4" />}
            <span>{item.label}</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isOpen ? "rotate-180" : ""
              )}
            />
          </button>

          {/* Desktop Dropdown */}
          {!isMobile && (
            <div
              className={cn(
                "absolute top-full left-0 mt-1 w-56 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 overflow-hidden transition-all duration-300 ease-out",
                isOpen
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
              )}
            >
              {item.children?.map((child, index) => {
                const isModal = child.href?.startsWith('modal:');
                
                if (isModal) {
                  return (
                    <button
                      key={child.href}
                      onClick={() => handleClick(child.href!)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors duration-150 w-full text-left",
                        index === 0 ? "pt-4" : "",
                        index === item.children!.length - 1 ? "pb-4" : ""
                      )}
                    >
                      {child.icon && <child.icon className="h-4 w-4" />}
                      <span>{child.label}</span>
                    </button>
                  );
                }

                return (
                  <Link
                    key={child.href}
                    href={child.href || "#"}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors duration-150",
                      index === 0 ? "pt-4" : "",
                      index === item.children!.length - 1 ? "pb-4" : ""
                    )}
                    onClick={() => setOpenDropdowns([])}
                  >
                    {child.icon && <child.icon className="h-4 w-4" />}
                    <span>{child.label}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Mobile Submenu */}
          {isMobile && isOpen && (
            <div className="ml-6 mt-2 space-y-1 border-l-2 border-zinc-200 pl-4 animate-in slide-in-from-top-2 duration-300">
              {item.children?.map((child) => {
                const isModal = child.href?.startsWith('modal:');
                
                if (isModal) {
                  return (
                    <button
                      key={child.href}
                      onClick={() => handleClick(child.href!)}
                      className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 rounded-md transition-colors duration-150 w-full text-left"
                    >
                      {child.icon && <child.icon className="h-4 w-4" />}
                      <span>{child.label}</span>
                    </button>
                  );
                }

                return (
                  <Link
                    key={child.href}
                    href={child.href || "#"}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 rounded-md transition-colors duration-150"
                    onClick={() => setMobileMenuOpen(false)}
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
    }

    return (
      <Link
        href={item.href || "#"}
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-zinc-100 hover:text-zinc-900",
          isMobile ? "w-full" : ""
        )}
        onClick={() => isMobile && setMobileMenuOpen(false)}
      >
        {item.icon && <item.icon className="h-4 w-4" />}
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <nav ref={navbarRef} className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/home" className="flex items-center gap-3 group">
          <div className="flex items-center gap-2">
            <img src="/Logos/logo_innovatis_preta.svg" alt="Logo Innovatis" className="h-6 w-6" />
            <span className="text-2xl font-semibold tracking-tight">GoPro2</span>
          </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <NavItemComponent key={item.label} item={item} />
            ))}
          </div>

          {/* User Menu & Mobile Toggle */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button
              className="relative p-2 text-[#004225] hover:text-white hover:bg-[#31938A] rounded-lg transition-colors duration-200"
              aria-label="Notificações"
            >
              <Bell className="h-5 w-5" />
              {/* Badge de notificações não lidas (comentado para uso futuro) */}
              {/* <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" /> */}
            </button>

            {/* User Dropdown */}
            {mounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 rounded-lg transition-colors duration-200"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1F4E79] to-[#153653] flex items-center justify-center text-white font-semibold text-sm">
                      A
                    </div>
                    <span className="hidden sm:block">Admin</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 mt-2 bg-white border border-zinc-200 rounded-lg shadow-lg p-1 animate-in slide-in-from-top-2 duration-200"
                >
                  <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 rounded-md cursor-pointer transition-colors duration-150">
                    <User className="h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 rounded-md cursor-pointer transition-colors duration-150">
                    <Settings className="h-4 w-4" />
                    <span>Configurações</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1 h-px bg-zinc-200" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md cursor-pointer transition-colors duration-150"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 rounded-lg transition-colors duration-200"
                disabled
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#004225] to-[#00B894] flex items-center justify-center text-white font-semibold text-sm">
                  A
                </div>
                <span className="hidden sm:block">Admin</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-2 hover:bg-zinc-100 rounded-lg transition-colors duration-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1 animate-in slide-in-from-top-2 duration-300">
              {navigationItems.map((item) => (
                <NavItemComponent key={item.label} item={item} isMobile />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Backdrop for mobile menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </nav>
  );
}
