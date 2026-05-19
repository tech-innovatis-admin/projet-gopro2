"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Eye, Pencil, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavBar } from "@/components/ui/NavBar";
import { StarRating } from "@/components/ui/StarRating";
import { getCompanyById } from "@/src/lib/api/endpoints";
import { getContratosByFornecedor } from "../mockData";
import { STATUS_CONFIG, type Fornecedor } from "../types";
import { getFriendlyApiError, mapCompanyToFornecedor } from "../mappers";

interface FornecedorLayoutProps {
  children: React.ReactNode;
}

export default function FornecedorLayout({ children }: FornecedorLayoutProps) {
  const params = useParams();
  const pathname = usePathname();
  const fornecedorId = params.fornecedorId as string;

  const [fornecedor, setFornecedor] = useState<Fornecedor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const company = await getCompanyById(fornecedorId);
        if (!mounted) return;
        setFornecedor(mapCompanyToFornecedor(company));
      } catch (loadError) {
        if (!mounted) return;
        setFornecedor(null);
        setError(getFriendlyApiError(loadError));
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [fornecedorId]);

  if (isLoading) {
    return <FornecedorRouteLoadingSkeleton />;
  }

  const contratos = fornecedor ? getContratosByFornecedor(fornecedorId) : [];
  const avaliacoes = contratos
    .map((c) => c.avaliacao?.nota)
    .filter((nota): nota is number => nota !== undefined && nota > 0);
  const mediaAvaliacoes =
    avaliacoes.length > 0
      ? avaliacoes.reduce((sum, nota) => sum + nota, 0) / avaliacoes.length
      : 0;

  if (!fornecedor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Fornecedor não encontrado</h2>
          <p className="text-gray-500 mb-4">
            {error || "O fornecedor solicitado não existe ou foi removido."}
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
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <Link
              href="/fornecedores"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para fornecedores
            </Link>
          </div>

          <div className="pb-4">
            <div className="flex items-start gap-4">
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

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900">{fornecedor.nome}</h1>
                  <span
                    className={cn(
                      "inline-flex px-2.5 py-1 text-xs font-medium rounded-full",
                      statusConfig.bg,
                      statusConfig.text
                    )}
                  >
                    {statusConfig.label}
                  </span>
                  {mediaAvaliacoes > 0 && (
                    <div className="flex items-center gap-1.5">
                      <StarRating nota={mediaAvaliacoes} readonly size="sm" />
                      <span className="text-xs font-medium text-gray-600">
                        {mediaAvaliacoes.toFixed(1)}
                      </span>
                    </div>
                  )}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}

function FornecedorRouteLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100">
      <NavBar />
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="h-4 w-44 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="pb-4">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 animate-pulse rounded-xl bg-gray-200" />
              <div className="min-w-0 flex-1">
                <div className="h-7 w-80 animate-pulse rounded bg-gray-200" />
                <div className="mt-3 h-4 w-64 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 pb-2">
            <div className="h-9 w-28 animate-pulse rounded bg-gray-200" />
            <div className="h-9 w-20 animate-pulse rounded bg-gray-200" />
            <div className="h-9 w-28 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="h-6 w-56 animate-pulse rounded bg-gray-200" />
              <div className="mt-5 space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={`fornecedor-loading-main-${index}`} className="h-16 w-full animate-pulse rounded-xl bg-gray-200" />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={`fornecedor-loading-side-${index}`} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
                <div className="mt-4 space-y-3">
                  <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

