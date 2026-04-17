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
    return <div className="p-6">Carregando...</div>;
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