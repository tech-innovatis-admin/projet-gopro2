"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building,
  MapPin,
  Mail,
  Phone,
  Globe,
  FileText,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  ExternalLink,
  Users,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPartnerById, listProjects } from "@/src/lib/api/endpoints";
import { getFriendlyApiError, isProjectLinkedToPartner, mapPartnerToParceiro, mapProjectToParceiroContrato } from "../mappers";
import { TIPO_CONFIG, STATUS_CONFIG, type ParceiroContratoVinculado } from "../types";
import type { Parceiro } from "../types";

// =============================================================================
// PÃGINA DE DETALHES DO PARCEIRO
// =============================================================================

export default function ParceiroDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const [parceiro, setParceiro] = useState<Parceiro | null>(null);
  const [contratos, setContratos] = useState<ParceiroContratoVinculado[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Carrega dados do parceiro
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const partnerId = params.parceiroId as string;
        const [partnerResponse, projectsResponse] = await Promise.all([
          getPartnerById(partnerId),
          listProjects({ page: 0, size: 20 }),
        ]);

        if (!isMounted) {
          return;
        }

        setParceiro(mapPartnerToParceiro(partnerResponse, projectsResponse.content));
        setContratos(
          projectsResponse.content
            .filter((project) => isProjectLinkedToPartner(project, partnerResponse.id))
            .map(mapProjectToParceiroContrato)
        );
      } catch (loadError) {
        if (!isMounted) {
          return;
        }
        setParceiro(null);
        setContratos([]);
        setError(getFriendlyApiError(loadError));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [params.parceiroId]);

  // Config de tipo
  const tipoConfig = parceiro ? TIPO_CONFIG[parceiro.tipo] : null;
  const statusConfig = parceiro ? STATUS_CONFIG[parceiro.status] : null;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  // Not found
  if (!parceiro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center gap-4">
        <div className="p-4 bg-red-100 rounded-full">
          <Users className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900">
          Parceiro nÃ£o encontrado
        </h1>
        <p className="text-gray-500">
          {error || "O parceiro que voce esta procurando nao existe ou foi removido."}
        </p>
        <Button
          onClick={() => router.push("/parceiros")}
          className="mt-4 bg-[#004225] hover:bg-[#003319]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Parceiros
        </Button>
      </div>
    );
  }

  const TipoIcon = tipoConfig?.icon || Building;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link
            href="/parceiros"
            className="hover:text-[#004225] transition-colors"
          >
            Parceiros
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">
            {parceiro.sigla || parceiro.nome}
          </span>
        </nav>

        {/* Header do Parceiro */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Banner colorido */}
          <div
            className={cn(
              "h-2",
              tipoConfig?.bgColor || "bg-gray-200"
            )}
          />

          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {/* Ãcone */}
                <div
                  className={cn(
                    "p-4 rounded-xl",
                    tipoConfig?.bgColor || "bg-gray-100"
                  )}
                >
                  <TipoIcon
                    className={cn(
                      "h-8 w-8",
                      tipoConfig?.textColor || "text-gray-600"
                    )}
                  />
                </div>

                {/* Info */}
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {parceiro.nome}
                    </h1>
                    {parceiro.sigla && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-sm font-medium rounded">
                        {parceiro.sigla}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-2">
                    {/* Badge de tipo */}
                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium",
                        tipoConfig?.bgColor,
                        tipoConfig?.textColor
                      )}
                    >
                      {tipoConfig?.label}
                    </span>

                    {/* Badge de status */}
                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium",
                        statusConfig?.bgColor,
                        statusConfig?.textColor
                      )}
                    >
                      {statusConfig?.label}
                    </span>

                    {/* LocalizaÃ§Ã£o */}
                    <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {parceiro.municipio}, {parceiro.uf}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AÃ§Ãµes */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="col-span-2 space-y-6">
            {/* Contratos Vinculados */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  Contratos Vinculados
                </h2>
              </div>

              <div className="p-6">
                {contratos.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      Nenhum contrato vinculado a este parceiro.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contratos.map((contrato) => (
                      <Link
                        key={contrato.id}
                        href={`/contratos/${contrato.id}`}
                        className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-[#004225]/30 hover:bg-[#004225]/5 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-[#004225]/10 transition-colors">
                            <FileText className="h-5 w-5 text-gray-500 group-hover:text-[#004225]" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 group-hover:text-[#004225]">
                              {contrato.titulo}
                            </p>
                            <p className="text-sm text-gray-500">
                              ID: {contrato.id}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(contrato.valor)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {contrato.dataInicio} {contrato.dataFim ? `atÃ© ${contrato.dataFim}` : ""}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "px-2 py-1 text-xs font-medium rounded",
                              contrato.status === "EM_ANDAMENTO"
                                ? "bg-green-100 text-green-700"
                                : contrato.status === "CONCLUIDO"
                                ? "bg-gray-100 text-gray-600"
                                : "bg-yellow-100 text-yellow-700"
                            )}
                          >
                            {contrato.status === "EM_ANDAMENTO" ? "Em Andamento" : contrato.status === "CONCLUIDO" ? "ConcluÃ­do" : contrato.status}
                          </span>
                          <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-[#004225]" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ObservaÃ§Ãµes */}
            {parceiro.observacoes && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">
                    ObservaÃ§Ãµes
                  </h2>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {parceiro.observacoes}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Resumo Financeiro */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  Resumo
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">Contratos Ativos</span>
                  </div>
                  <span className="text-lg font-semibold text-[#004225]">
                    {parceiro.contratosAtivos ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Valor Total</span>
                  </div>
                  <span className="text-lg font-semibold text-[#004225]">
                    {formatCurrency(parceiro.valorTotalContratos ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Cadastrado em</span>
                  </div>
                  <span className="text-sm text-gray-700">
                    {new Date(parceiro.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            </div>

            {/* InformaÃ§Ãµes de Contato */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  Contato
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {parceiro.email && (
                  <a
                    href={`mailto:${parceiro.email}`}
                    className="flex items-center gap-3 text-gray-600 hover:text-[#004225] transition-colors"
                  >
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{parceiro.email}</span>
                  </a>
                )}
                {parceiro.telefone && (
                  <a
                    href={`tel:${parceiro.telefone}`}
                    className="flex items-center gap-3 text-gray-600 hover:text-[#004225] transition-colors"
                  >
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{parceiro.telefone}</span>
                  </a>
                )}
                {parceiro.site && (
                  <a
                    href={parceiro.site}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-600 hover:text-[#004225] transition-colors"
                  >
                    <Globe className="h-4 w-4 text-gray-400" />
                    <span className="text-sm truncate">{parceiro.site}</span>
                    <ExternalLink className="h-3 w-3 text-gray-400" />
                  </a>
                )}
                {!parceiro.email && !parceiro.telefone && !parceiro.site && (
                  <p className="text-sm text-gray-400 italic">
                    Nenhuma informaÃ§Ã£o de contato cadastrada.
                  </p>
                )}
              </div>
            </div>

            {/* EndereÃ§o */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  EndereÃ§o
                </h2>
              </div>
              <div className="p-6">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    {parceiro.endereco && (
                      <p>{parceiro.endereco}</p>
                    )}
                    <p className="font-medium text-gray-900">
                      {parceiro.municipio} - {parceiro.uf}
                    </p>
                    {parceiro.cnpj && (
                      <p className="mt-2 text-xs text-gray-400">
                        CNPJ: {parceiro.cnpj}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

