"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Eye,
  Pencil,
  FileText,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { NavBar } from "@/components/ui/NavBar";

import { getPartnerById } from "@/src/lib/api/endpoints";
import { mapPartnerToParceiro } from "../mappers";
import { STATUS_CONFIG, TIPO_CONFIG } from "../types";
import type { Parceiro } from "../types";

interface Props {
  children: React.ReactNode;
}

export default function ParceiroLayout({ children }: Props) {
  const params = useParams();
  const pathname = usePathname();
  const parceiroId = params.parceiroId as string;

  const [parceiro, setParceiro] = useState<Parceiro | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔥 Carrega parceiro real
  useEffect(() => {
    async function load() {
      try {
        const response = await getPartnerById(parceiroId);
        const mapped = mapPartnerToParceiro(response, []);
        setParceiro(mapped);
      } catch {
        setParceiro(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [parceiroId]);

  if (loading) {
    return <ParceiroRouteLoadingSkeleton />;
  }

  if (!parceiro) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Parceiro não encontrado
          </h2>
          <Link href="/parceiros" className="text-[#004225] hover:underline">
            <ArrowLeft className="h-4 w-4 inline mr-1" />
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[parceiro.status];
  const tipoConfig = TIPO_CONFIG[parceiro.tipo];

  const tabs = [
    {
      label: "Visão Geral",
      href: `/parceiros/${parceiroId}`,
      icon: Eye,
      isActive: pathname === `/parceiros/${parceiroId}`,
    },
    {
      label: "Editar",
      href: `/parceiros/${parceiroId}/editar`,
      icon: Pencil,
      isActive: pathname === `/parceiros/${parceiroId}/editar`,
    },
    {
      label: "Contratos",
      href: `/parceiros/${parceiroId}/contratos`,
      icon: FileText,
      isActive: pathname === `/parceiros/${parceiroId}/contratos`,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <NavBar />
      {/* CONTEÚDO */}
      <main className="max-w-7xl mx-auto px-6 py-1">
        {children}
      </main>
    </div>
  );
}

function ParceiroRouteLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <NavBar />
      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="space-y-6">
          <div className="h-4 w-56 animate-pulse rounded bg-gray-200" />

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="h-2 w-full animate-pulse bg-gray-200" />
            <div className="p-6">
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 animate-pulse rounded-xl bg-gray-200" />
                  <div>
                    <div className="h-8 w-80 animate-pulse rounded bg-gray-200" />
                    <div className="mt-3 h-5 w-44 animate-pulse rounded bg-gray-200" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-9 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="h-9 w-24 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="h-6 w-56 animate-pulse rounded bg-gray-200" />
                <div className="mt-5 space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={`parceiro-loading-list-${index}`} className="h-16 w-full animate-pulse rounded-xl bg-gray-200" />
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={`parceiro-loading-side-${index}`} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
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
        </div>
      </main>
    </div>
  );
}
