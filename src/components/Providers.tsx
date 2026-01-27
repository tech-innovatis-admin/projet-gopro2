"use client";

import { ReactNode } from "react";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { NotificationDrawer } from "@/src/app/(dashboard)/perfil/notificacoes/_components";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Componente que encapsula todos os providers da aplicação.
 * Deve ser usado no layout raiz para disponibilizar contextos globais.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <NotificationProvider>
      {children}
      <NotificationDrawer />
    </NotificationProvider>
  );
}
