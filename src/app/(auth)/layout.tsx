"use client";

import { ReactNode } from "react";

/**
 * Layout para páginas de autenticação (login, registro, etc.)
 * 
 * Este layout:
 * - Não exibe o MiniFooter (rodapé)
 * - Garante que a página ocupe 100% da altura da viewport
 * - Evita barras de rolagem desnecessárias
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen overflow-hidden">
      {children}
    </div>
  );
}
