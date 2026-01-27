"use client";

import { useEffect } from "react";
import { useNotification } from "@/contexts/NotificationContext";

/**
 * Página de Notificações
 * 
 * Esta página serve como um fallback para quando o usuário navega diretamente
 * para /perfil/notificacoes. Na prática, as notificações são exibidas via 
 * drawer lateral acessível pelo ícone de notificações no navbar.
 * 
 * Ao acessar esta rota, o drawer de notificações é aberto automaticamente.
 */
export default function NotificacoesPage() {
  const { openDrawer, isDrawerOpen } = useNotification();

  // Abre o drawer automaticamente ao acessar a página
  useEffect(() => {
    if (!isDrawerOpen) {
      openDrawer();
    }
  }, [openDrawer, isDrawerOpen]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center text-zinc-500">
        <p className="text-sm">
          Carregando notificações...
        </p>
      </div>
    </div>
  );
}
