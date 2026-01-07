"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Building2, MapPin, FileText, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type Fornecedor,
  type FornecedoresFiltersState,
  CATEGORIA_LABELS,
  STATUS_CONFIG,
  type FornecedorCategoria,
} from "../types";
import { getContratosCountByFornecedor } from "../mockData";

// =============================================================================
// GRID DE FORNECEDORES EM CARDS
// =============================================================================

interface FornecedoresGridProps {
  fornecedores: Fornecedor[];
  filters: FornecedoresFiltersState;
  onFiltersChange: (filters: FornecedoresFiltersState) => void;
}

export function FornecedoresGrid({
  fornecedores,
  filters,
  onFiltersChange,
}: FornecedoresGridProps) {
  // Paginação
  const paginatedFornecedores = useMemo(() => {
    const start = (filters.page - 1) * filters.pageSize;
    const end = start + filters.pageSize;
    return fornecedores.slice(start, end);
  }, [fornecedores, filters.page, filters.pageSize]);

  const totalPages = Math.ceil(fornecedores.length / filters.pageSize);

  // Gera iniciais do nome
  const getInitials = (nome: string): string => {
    return nome
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Estado vazio
  if (fornecedores.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Nenhum fornecedor encontrado
        </h3>
        <p className="text-sm text-gray-500">
          Tente ajustar os filtros ou adicione um novo fornecedor.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Grid de Cards */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
          {paginatedFornecedores.map((fornecedor) => {
            const contratosCount = getContratosCountByFornecedor(fornecedor.id);
            const statusConfig = STATUS_CONFIG[fornecedor.status];

            return (
              <div
                key={fornecedor.id}
                className="liquid-glass-card rounded-lg group"
              >
                {/* Header do Card */}
                <div className="p-4 border-b border-white/20">
                  <Link
                    href={`/fornecedores/${fornecedor.id}`}
                    className="flex items-start gap-3 group/link"
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-[#1F4E79]/10 flex items-center justify-center group-hover/link:bg-[#1F4E79]/20 transition-colors">
                      <span className="text-base font-semibold text-[#1F4E79]">
                        {getInitials(fornecedor.nome)}
                      </span>
                    </div>

                    {/* Nome e CNPJ */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 group-hover/link:text-[#1F4E79] transition-colors line-clamp-2 mb-1">
                        {fornecedor.nome}
                      </h3>
                      {fornecedor.cnpj && (
                        <p className="text-xs text-gray-500 truncate">
                          {fornecedor.cnpj}
                        </p>
                      )}
                    </div>
                  </Link>
                </div>

                {/* Conteúdo do Card */}
                <div className="p-4 space-y-3">
                  {/* Status */}
                  <div className="flex items-center justify-between">
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

                  {/* Localização */}
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                    <span className="truncate">
                      {fornecedor.municipio}, {fornecedor.uf}
                    </span>
                  </div>

                  {/* Categorias */}
                  {fornecedor.categorias.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-gray-500">Categorias:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {fornecedor.categorias.slice(0, 3).map((cat) => (
                          <span
                            key={cat}
                            className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700"
                          >
                            {CATEGORIA_LABELS[cat as FornecedorCategoria] || cat}
                          </span>
                        ))}
                        {fornecedor.categorias.length > 3 && (
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                            +{fornecedor.categorias.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contratos */}
                  <div className="flex items-center gap-2 text-xs text-gray-600 pt-2 border-t border-white/20">
                    <FileText className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                    {contratosCount > 0 ? (
                      <Link
                        href={`/fornecedores/${fornecedor.id}/contratos`}
                        className="text-[#1F4E79] hover:underline font-medium"
                      >
                        {contratosCount} contrato{contratosCount > 1 ? "s" : ""}
                      </Link>
                    ) : (
                      <span className="text-gray-400">Nenhum contrato</span>
                    )}
                  </div>
                </div>

                {/* Footer do Card */}
                <div className="px-4 pb-4 pt-0">
                  <Link
                    href={`/fornecedores/${fornecedor.id}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#1F4E79] bg-[#1F4E79]/5 rounded-lg hover:bg-[#1F4E79]/10 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Ver detalhes
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="text-sm text-gray-500">
            Página {filters.page} de {totalPages} ({fornecedores.length} registros)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                onFiltersChange({ ...filters, page: filters.page - 1 })
              }
              disabled={filters.page === 1}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors",
                filters.page === 1
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              )}
            >
              Anterior
            </button>

            {/* Números de página */}
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
                      "h-8 w-8 text-sm font-medium rounded-lg transition-colors",
                      filters.page === pageNum
                        ? "bg-[#1F4E79] text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
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
                "px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors",
                filters.page === totalPages
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              )}
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

