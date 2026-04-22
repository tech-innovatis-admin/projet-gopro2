"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Users,
  MapPin,
  FileText,
  ExternalLink,
  Mail,
  Globe,
  GraduationCap,
  Building,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type Parceiro,
  type ParceirosFiltersState,
  TIPO_COLORS,
  TIPO_SHORT_LABELS,
  STATUS_CONFIG,
} from "../types";

// =============================================================================
// GRID DE PARCEIROS EM CARDS
// =============================================================================

interface ParceirosGridProps {
  parceiros: Parceiro[];
  filters: ParceirosFiltersState;
  onFiltersChange: (filters: ParceirosFiltersState) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function ParceirosGrid({
  parceiros,
  filters,
  onFiltersChange,
}: ParceirosGridProps) {
  // Paginação
  const paginatedParceiros = useMemo(() => {
    const start = (filters.page - 1) * filters.pageSize;
    const end = start + filters.pageSize;
    return parceiros.slice(start, end);
  }, [parceiros, filters.page, filters.pageSize]);

  const totalPages = Math.ceil(parceiros.length / filters.pageSize);

  // Gera iniciais do nome
  const getInitials = (nome: string, sigla?: string): string => {
    if (sigla) return sigla.slice(0, 3);
    return nome
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Ícone do tipo
  const TipoIcon = ({ tipo }: { tipo: "IFES" | "FUNDACAO" }) => {
    return tipo === "IFES" ? (
      <GraduationCap className="h-4 w-4" />
    ) : (
      <Building className="h-4 w-4" />
    );
  };

  // Estado vazio
  if (parceiros.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Nenhum parceiro encontrado
        </h3>
        <p className="text-sm text-gray-500">
          Tente ajustar os filtros ou adicione um novo parceiro.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginatedParceiros.map((parceiro) => {
          const tipoConfig = TIPO_COLORS[parceiro.tipo];
          const statusConfig = STATUS_CONFIG[parceiro.status];
          const totalContratos = parceiro.totalContratos ?? parceiro.contratosAtivos ?? 0;
          const contratosAtivos = parceiro.contratosAtivos ?? 0;

          return (
            <Link
              key={parceiro.id}
              href={`/parceiros/${parceiro.id}`}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-[#004225]/30 transition-all duration-200 overflow-hidden"
            >
              {/* Header do Card com cor do tipo */}
              <div
                className={cn(
                  "px-4 py-3 border-b",
                  tipoConfig.bg,
                  tipoConfig.border
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TipoIcon tipo={parceiro.tipo} />
                    <span className={cn("text-xs font-semibold", tipoConfig.text)}>
                      {TIPO_SHORT_LABELS[parceiro.tipo]}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "inline-flex px-2 py-0.5 text-xs font-medium rounded-full",
                      statusConfig.bgColor,
                      statusConfig.textColor
                    )}
                  >
                    {statusConfig.label}
                  </span>
                </div>
              </div>

              {/* Conteúdo do Card */}
              <div className="p-4 space-y-3">
                {/* Avatar e Nome */}
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center",
                      parceiro.tipo === "IFES"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-blue-100 text-blue-700"
                    )}
                  >
                    <span className="text-sm font-bold">
                      {getInitials(parceiro.nome, parceiro.sigla)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#004225] transition-colors line-clamp-2">
                      {parceiro.sigla ? `${parceiro.sigla} - ` : ""}
                      {parceiro.nome}
                    </h3>
                    {parceiro.cnpj && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {parceiro.cnpj}
                      </p>
                    )}
                  </div>
                </div>

                {/* Localização */}
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                  <span className="truncate">
                    {parceiro.municipio}, {parceiro.uf}
                  </span>
                </div>

                {/* Contatos */}
                <div className="space-y-1.5">
                  {parceiro.email && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Mail className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                      <span className="truncate">{parceiro.email}</span>
                    </div>
                  )}
                  {parceiro.site && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Globe className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                      <span className="truncate">{parceiro.site.replace("https://", "")}</span>
                    </div>
                  )}
                </div>

                {/* Métricas */}
                <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-gray-400" />
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-600">
                        <span className="font-semibold text-gray-900">
                          {totalContratos}
                        </span>{" "}
                        contratos
                      </span>
                      {contratosAtivos > 0 && contratosAtivos !== totalContratos && (
                        <span className="text-[11px] text-gray-400">
                          {contratosAtivos} ativos
                        </span>
                      )}
                    </div>
                  </div>
                  {parceiro.valorTotalContratos && parceiro.valorTotalContratos > 0 && (
                    <span className="text-xs font-medium text-[#004225]">
                      {formatCurrency(parceiro.valorTotalContratos)}
                    </span>
                  )}
                </div>

                {/* Hover indicator */}
                <div className="flex items-center justify-end gap-1 text-xs text-gray-400 group-hover:text-[#004225] transition-colors">
                  <span>Ver detalhes</span>
                  <ExternalLink className="h-3 w-3" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-3">
          <p className="text-sm text-gray-600">
            Mostrando{" "}
            <span className="font-medium">
              {(filters.page - 1) * filters.pageSize + 1}
            </span>{" "}
            a{" "}
            <span className="font-medium">
              {Math.min(filters.page * filters.pageSize, parceiros.length)}
            </span>{" "}
            de <span className="font-medium">{parceiros.length}</span> parceiros
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                onFiltersChange({ ...filters, page: filters.page - 1 })
              }
              disabled={filters.page === 1}
              className={cn(
                "p-2 rounded-lg border transition-colors",
                filters.page === 1
                  ? "border-gray-200 text-gray-300 cursor-not-allowed"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (filters.page <= 3) {
                  pageNum = i + 1;
                } else if (filters.page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = filters.page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => onFiltersChange({ ...filters, page: pageNum })}
                    className={cn(
                      "min-w-[32px] h-8 px-2 text-sm font-medium rounded-lg transition-colors",
                      filters.page === pageNum
                        ? "bg-[#004225] text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() =>
                onFiltersChange({ ...filters, page: filters.page + 1 })
              }
              disabled={filters.page === totalPages}
              className={cn(
                "p-2 rounded-lg border transition-colors",
                filters.page === totalPages
                  ? "border-gray-200 text-gray-300 cursor-not-allowed"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
