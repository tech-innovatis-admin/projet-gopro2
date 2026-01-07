"use client";

import { useMemo, useCallback } from "react";
import Link from "next/link";
import { ArrowUpDown, ArrowUp, ArrowDown, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResizableTable } from "@/components/ui/resizable-table";
import {
  type Fornecedor,
  type FornecedoresFiltersState,
  CATEGORIA_LABELS,
  CATEGORIA_COLORS,
  STATUS_CONFIG,
  type FornecedorCategoria,
} from "../types";
import { getContratosCountByFornecedor } from "../mockData";

// =============================================================================
// TABELA DE FORNECEDORES
// =============================================================================

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
  // Handler para ordenação
  const handleSort = useCallback(
    (column: "nome" | "uf" | "municipio" | "status") => {
      if (filters.sortBy === column) {
        // Alterna direção
        onFiltersChange({
          ...filters,
          sortDir: filters.sortDir === "asc" ? "desc" : "asc",
        });
      } else {
        // Nova coluna, começa ascendente
        onFiltersChange({
          ...filters,
          sortBy: column,
          sortDir: "asc",
        });
      }
    },
    [filters, onFiltersChange]
  );

  // Ícone de ordenação
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

  // Configuração de larguras padrão das colunas
  const defaultColumnWidths = [
    250, // Fornecedor (nome + CNPJ)
    180, // Categorias
    150, // Localização
    120, // Contratos
    100, // Status
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      {/* Tabela com scroll */}
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
                  Categorias
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
                <tr
                  key={fornecedor.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Nome */}
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
                          <p className="text-xs text-gray-500 truncate">
                            {fornecedor.cnpj}
                          </p>
                        )}
                      </div>
                    </Link>
                  </td>

                  {/* Categorias */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {fornecedor.categorias.slice(0, 2).map((cat) => (
                        <span
                          key={cat}
                          className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700"
                        >
                          {CATEGORIA_LABELS[cat as FornecedorCategoria] || cat}
                        </span>
                      ))}
                      {fornecedor.categorias.length > 2 && (
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                          +{fornecedor.categorias.length - 2}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Localização */}
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900">{fornecedor.municipio}</p>
                    <p className="text-xs text-gray-500">{fornecedor.uf}</p>
                  </td>

                  {/* Contratos */}
                  <td className="px-4 py-3">
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

                  {/* Status */}
                  <td className="px-4 py-3">
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

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
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
