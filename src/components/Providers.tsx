"use client";

import { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Componente que encapsula todos os providers da aplicação.
 * Deve ser usado no layout raiz para disponibilizar contextos globais.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <>
      {children}
    </>
  );
}
