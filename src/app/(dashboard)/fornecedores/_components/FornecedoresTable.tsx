"use client";

import { useMemo, useCallback } from "react";
import Link from "next/link";
import { ArrowUpDown, ArrowUp, ArrowDown, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResizableTable } from "@/components/ui/resizable-table";
import {
  type Fornecedor,
  type FornecedoresFiltersState,
  STATUS_CONFIG,
} from "../types";
import { getContratosCountByFornecedor, getContratosByFornecedor } from "../mockData";
import { StarRating } from "@/components/ui/StarRating";

interface FornecedoresTableProps {
  fornecedores: Fornecedor[];
  filters: FornecedoresFiltersState;
  onFiltersChange: (filters: FornecedoresFiltersState) => void;
}

export function FornecedoresTable({
  fornecedores,
  filters,
  onFiltersChange,
}: FornecedoresTableProps) {
  const handleSort = useCallback(
    (column: "nome" | "uf" | "municipio" | "status") => {
      if (filters.sortBy === column) {
        onFiltersChange({
          ...filters,
          sortDir: filters.sortDir === "asc" ? "desc" : "asc",
        });
      } else {
        onFiltersChange({
          ...filters,
          sortBy: column,
          sortDir: "asc",
        });
      }
    },
    [filters, onFiltersChange]
  );

  const SortIcon = useCallback(
    ({ column }: { column: "nome" | "uf" | "municipio" | "status" }) => {
      if (filters.sortBy !== column) {
        return <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />;
      }
      return filters.sortDir === "asc" ? (
        <ArrowUp className="h-3.5 w-3.5 text-[#1F4E79]" />
      ) : (
        <ArrowDown className="h-3.5 w-3.5 text-[#1F4E79]" />
      );
    },
    [filters.sortBy, filters.sortDir]
  );

  const paginatedFornecedores = useMemo(() => {
    const start = (filters.page - 1) * filters.pageSize;
    const end = start + filters.pageSize;
    return fornecedores.slice(start, end);
  }, [fornecedores, filters.page, filters.pageSize]);

  const totalPages = Math.ceil(fornecedores.length / filters.pageSize);

  const getInitials = (nome: string): string =>
    nome
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const getMediaAvaliacoes = (fornecedorId: string): number => {
    const contratos = getContratosByFornecedor(fornecedorId);
    const avaliacoes = contratos
      .map((c) => c.avaliacao?.nota)
      .filter((nota): nota is number => nota !== undefined && nota > 0);

    if (avaliacoes.length === 0) return 0;
    return avaliacoes.reduce((sum, nota) => sum + nota, 0) / avaliacoes.length;
  };

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

  const defaultColumnWidths = [280, 120, 170, 130, 110];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="flex-1 overflow-auto custom-scrollbar">
        <ResizableTable
          columnCount={5}
          defaultWidths={defaultColumnWidths}
          minColumnWidth={80}
          className="w-full"
        >
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="text-center px-4 py-3">
                <button
                  onClick={() => handleSort("nome")}
                  className="flex items-center justify-center gap-2 w-full text-xs font-semibold text-gray-600 uppercase tracking-wide hover:text-gray-900"
                >
                  Fornecedor
                  <SortIcon column="nome" />
                </button>
              </th>
              <th className="text-center px-4 py-3">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Avaliação
                </span>
              </th>
              <th className="text-center px-4 py-3">
                <button
                  onClick={() => handleSort("municipio")}
                  className="flex items-center justify-center gap-2 w-full text-xs font-semibold text-gray-600 uppercase tracking-wide hover:text-gray-900"
                >
                  Localização
                  <SortIcon column="municipio" />
                </button>
              </th>
              <th className="text-center px-4 py-3">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Contratos
                </span>
              </th>
              <th className="text-center px-4 py-3">
                <button
                  onClick={() => handleSort("status")}
                  className="flex items-center justify-center gap-2 w-full text-xs font-semibold text-gray-600 uppercase tracking-wide hover:text-gray-900"
                >
                  Status
                  <SortIcon column="status" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedFornecedores.map((fornecedor) => {
              const contratosCount = getContratosCountByFornecedor(fornecedor.id);
              const statusConfig = STATUS_CONFIG[fornecedor.status];

              return (
                <tr key={fornecedor.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/fornecedores/${fornecedor.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#1F4E79]/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-[#1F4E79]">
                          {getInitials(fornecedor.nome)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-[#1F4E79] transition-colors truncate">
                          {fornecedor.nome}
                        </p>
                        {fornecedor.cnpj && (
                          <p className="text-xs text-gray-500 truncate">{fornecedor.cnpj}</p>
                        )}
                      </div>
                    </Link>
                  </td>

                  <td className="px-4 py-3 text-center">
                    {(() => {
                      const media = getMediaAvaliacoes(fornecedor.id);
                      return media > 0 ? (
                        <div className="flex items-center justify-center">
                          <StarRating nota={media} readonly size="sm" showValue />
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Sem avaliação</span>
                      );
                    })()}
                  </td>

                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900">{fornecedor.municipio}</p>
                    <p className="text-xs text-gray-500">{fornecedor.uf}</p>
                  </td>

                  <td className="px-4 py-3 text-center">
                    {contratosCount > 0 ? (
                      <Link
                        href={`/fornecedores/${fornecedor.id}/contratos`}
                        className="inline-flex items-center gap-1 text-sm text-[#1F4E79] hover:underline"
                      >
                        {contratosCount} contrato{contratosCount > 1 ? "s" : ""}
                      </Link>
                    ) : (
                      <span className="text-sm text-gray-400">Nenhum</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        "inline-flex px-2.5 py-1 text-xs font-medium rounded-full",
                        statusConfig.bg,
                        statusConfig.text
                      )}
                    >
                      {statusConfig.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </ResizableTable>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            Página {filters.page} de {totalPages} ({fornecedores.length} registros)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onFiltersChange({ ...filters, page: filters.page - 1 })}
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

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) pageNum = i + 1;
                else if (filters.page <= 3) pageNum = i + 1;
                else if (filters.page >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = filters.page - 2 + i;

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
              onClick={() => onFiltersChange({ ...filters, page: filters.page + 1 })}
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

