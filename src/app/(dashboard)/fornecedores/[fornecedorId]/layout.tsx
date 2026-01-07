"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Eye, Pencil, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavBar } from "@/components/ui/NavBar";
import { getFornecedorById } from "../mockData";
import { STATUS_CONFIG } from "../types";

// =============================================================================
// LAYOUT COMPARTILHADO PARA PÁGINAS DE DETALHE DO FORNECEDOR
// =============================================================================

interface FornecedorLayoutProps {
  children: React.ReactNode;
}

export default function FornecedorLayout({ children }: FornecedorLayoutProps) {
  const params = useParams();
  const pathname = usePathname();
  const fornecedorId = params.fornecedorId as string;

  const fornecedor = getFornecedorById(fornecedorId);

  if (!fornecedor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Fornecedor não encontrado
          </h2>
          <p className="text-gray-500 mb-4">
            O fornecedor solicitado não existe ou foi removido.
          </p>
          <Link
            href="/fornecedores"
            className="inline-flex items-center gap-2 text-[#1F4E79] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para lista
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[fornecedor.status];

  // Tabs de navegação
  const tabs = [
    {
      label: "Visão Geral",
      href: `/fornecedores/${fornecedorId}`,
      icon: Eye,
      isActive: pathname === `/fornecedores/${fornecedorId}`,
    },
    {
      label: "Editar",
      href: `/fornecedores/${fornecedorId}/editar`,
      icon: Pencil,
      isActive: pathname === `/fornecedores/${fornecedorId}/editar`,
    },
    {
      label: "Contratos",
      href: `/fornecedores/${fornecedorId}/contratos`,
      icon: FileText,
      isActive: pathname === `/fornecedores/${fornecedorId}/contratos`,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100">
      <NavBar />
      {/* Header do fornecedor */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb e voltar */}
          <div className="py-4">
            <Link
              href="/fornecedores"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para fornecedores
            </Link>
          </div>

          {/* Info do fornecedor */}
          <div className="pb-4">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="flex-shrink-0 h-16 w-16 rounded-xl bg-[#1F4E79]/10 flex items-center justify-center">
                <span className="text-xl font-bold text-[#1F4E79]">
                  {fornecedor.nome
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
              </div>

              {/* Dados */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900">
                    {fornecedor.nome}
                  </h1>
                  <span
                    className={cn(
                      "inline-flex px-2.5 py-1 text-xs font-medium rounded-full",
                      statusConfig.bg,
                      statusConfig.text
                    )}
                  >
                    {statusConfig.label}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                  <span>
                    {fornecedor.municipio}, {fornecedor.uf}
                  </span>
                  {fornecedor.cnpj && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span>{fornecedor.cnpj}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs de navegação */}
          <div className="flex items-center gap-1 -mb-px">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                  tab.isActive
                    ? "border-[#1F4E79] text-[#1F4E79]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
