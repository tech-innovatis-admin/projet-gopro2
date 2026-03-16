"use client";

import { NavBar } from "@/components/ui/NavBar";

export default function AdminAuditoriaPage() {
  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <NavBar />

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-zinc-900">Auditoria geral desativada</h1>
            <p className="text-sm text-zinc-600">
              Nesta versao vamos manter somente a auditoria vinculada aos contratos.
            </p>
            <p className="text-sm text-zinc-600">
              A consulta completa do sistema ficou pausada enquanto avaliamos o volume de dados para producao.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
