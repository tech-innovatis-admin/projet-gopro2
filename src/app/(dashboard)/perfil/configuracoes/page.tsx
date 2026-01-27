"use client";

import { NavBar } from "@/components/ui/NavBar";

// =============================================================================
// PÁGINA DE CONFIGURAÇÕES
// =============================================================================

export default function ConfiguracoesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100">
      <NavBar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Configurações
          </h1>
          <p className="text-sm text-gray-500">
            Página de configurações do sistema
          </p>
        </div>
      </main>
    </div>
  );
}

