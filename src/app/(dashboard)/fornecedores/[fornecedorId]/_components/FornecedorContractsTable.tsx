"use client";

import { Fragment, useState, useEffect } from "react";
import Link from "next/link";
import { FileText, ExternalLink, ChevronDown, ChevronRight, Tag, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { StarRating } from "@/components/ui/StarRating";
import { type FornecedorContratoVinculado, type Fornecedor, CONTRATO_STATUS_CONFIG } from "../../types";
import { getRubricasByFornecedor, type ItemRubricaVinculado } from "../../mockData";

// =============================================================================
// TABELA DE CONTRATOS VINCULADOS AO FORNECEDOR
// =============================================================================

interface FornecedorContractsTableProps {
  contratos: FornecedorContratoVinculado[];
  fornecedor: Fornecedor;
  onAvaliacaoChange?: (contratoId: string, nota: number) => void;
}

export function FornecedorContractsTable({ 
  contratos, 
  fornecedor,
  onAvaliacaoChange 
}: FornecedorContractsTableProps) {
  const [expandedContratos, setExpandedContratos] = useState<Set<string>>(new Set());
  const [localContratos, setLocalContratos] = useState<FornecedorContratoVinculado[]>(contratos);

  // Sincroniza estado local quando contratos mudam
  useEffect(() => {
    setLocalContratos(contratos);
  }, [contratos]);

  // Atualiza avaliação localmente e chama callback se fornecido
  const handleAvaliacaoChange = (contratoId: string, nota: number) => {
    setLocalContratos((prev) =>
      prev.map((c) =>
        c.id === contratoId
          ? {
              ...c,
              avaliacao: {
                nota,
                avaliadoPor: "Admin",
                dataAvaliacao: new Date().toISOString(),
              },
            }
          : c
      )
    );
    
    if (onAvaliacaoChange) {
      onAvaliacaoChange(contratoId, nota);
    }
  };

  const toggleExpand = (contratoId: string) => {
    setExpandedContratos((prev) => {
      const next = new Set(prev);
      if (next.has(contratoId)) {
        next.delete(contratoId);
      } else {
        next.add(contratoId);
      }
      return next;
    });
  };

  const getRubricasVinculadas = (contratoId: string): ItemRubricaVinculado[] => {
    const rubricas = getRubricasByFornecedor(contratoId, fornecedor);
    // Debug: descomente para verificar no console
    // console.log(`Contrato ${contratoId}:`, rubricas.length, 'rubricas encontradas');
    return rubricas;
  };
  // Formata valor em BRL
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Formata data
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  // Estado vazio
  if (contratos.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Nenhum contrato vinculado
        </h3>
        <p className="text-sm text-gray-500">
          Este fornecedor ainda não possui contratos associados.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Código
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Título
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Avaliação
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Valor Total
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Período
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {localContratos.map((contrato) => {
              const statusConfig = CONTRATO_STATUS_CONFIG[contrato.status];
              const rubricasVinculadas = getRubricasVinculadas(contrato.id);
              const hasRubricas = rubricasVinculadas.length > 0;
              const isExpanded = expandedContratos.has(contrato.id);
              const avaliacaoNota = contrato.avaliacao?.nota || 0;

              return (
                <Fragment key={contrato.id}>
                  <tr
                    className={cn(
                      "hover:bg-gray-50 transition-colors",
                      hasRubricas && "cursor-pointer"
                    )}
                    onClick={() => hasRubricas && toggleExpand(contrato.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {hasRubricas && (
                          <span className="text-gray-400">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </span>
                        )}
                        <span className="text-sm font-medium text-[#1F4E79]">
                          {contrato.codigo}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900 line-clamp-1">
                        {contrato.titulo}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex px-2.5 py-1 text-xs font-medium rounded-full",
                          statusConfig?.bg || "bg-gray-100",
                          statusConfig?.text || "text-gray-700"
                        )}
                      >
                        {statusConfig?.label || contrato.status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div onClick={(e) => e.stopPropagation()}>
                        <StarRating
                          nota={avaliacaoNota}
                          onRatingChange={(nota) => handleAvaliacaoChange(contrato.id, nota)}
                          size="sm"
                          showValue={avaliacaoNota > 0}
                        />
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(contrato.valorTotal)}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600">
                        <span>{formatDate(contrato.dataInicio)}</span>
                        {contrato.dataFim && (
                          <span> — {formatDate(contrato.dataFim)}</span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/contratos/${contrato.id}`}
                        className="inline-flex items-center gap-1 text-sm text-[#1F4E79] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Ver
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>

                  {/* Linha expandida com rubricas */}
                  {isExpanded && hasRubricas && (
                    <tr>
                      <td colSpan={7} className="px-4 py-4 bg-gray-50">
                        <RubricasVinculadas rubricas={rubricasVinculadas} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Resumo */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            {contratos.length} contrato{contratos.length !== 1 ? "s" : ""} vinculado
            {contratos.length !== 1 ? "s" : ""}
          </span>
          <span className="font-medium text-gray-900">
            Total:{" "}
            {formatCurrency(
              contratos.reduce((sum, c) => sum + c.valorTotal, 0)
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// COMPONENTE PARA EXIBIR RUBRICAS VINCULADAS
// =============================================================================

interface RubricasVinculadasProps {
  rubricas: ItemRubricaVinculado[];
}

function RubricasVinculadas({ rubricas }: RubricasVinculadasProps) {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  if (rubricas.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-2">
        Nenhuma rubrica vinculada a este fornecedor neste contrato.
      </div>
    );
  }

  // Calcula total geral
  const totalGeral = rubricas.reduce((sum, rubrica) => {
    const totalSubitens = rubrica.subitens?.reduce((subSum, subitem) => {
      const totalLancamentos = Object.values(subitem.lancamentos || {}).reduce(
        (lanSum, lancamento) => lanSum + (lancamento?.valor || 0),
        0
      );
      return subSum + totalLancamentos;
    }, 0) || 0;
    return sum + totalSubitens;
  }, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Tag className="h-4 w-4 text-[#1F4E79]" />
        <h4 className="text-sm font-semibold text-gray-900">
          Rubricas Vinculadas ({rubricas.length})
        </h4>
      </div>

      {rubricas.map((item) => {
        const totalSubitens = item.subitens?.reduce((sum, subitem) => {
          return (
            sum +
            Object.values(subitem.lancamentos || {}).reduce(
              (lanSum, lancamento) => lanSum + (lancamento?.valor || 0),
              0
            )
          );
        }, 0) || 0;

        return (
          <div
            key={item.id}
            className="bg-white rounded-lg border border-gray-200 p-4 space-y-3"
          >
            {/* Header do item */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-500">
                    {item.rubricaCodigo}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-600">{item.rubricaNome}</span>
                </div>
                <h5 className="text-sm font-medium text-gray-900">
                  {item.codigo && `${item.codigo} - `}
                  {item.descricao}
                </h5>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                  <span>Qtd: {item.quantidade}</span>
                  <span>Meses: {item.meses}</span>
                  <span>Valor Unit.: {formatCurrency(item.valorUnitario)}</span>
                  <span className="font-medium">
                    Valor Total: {formatCurrency(item.valorTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Subitens */}
            {item.subitens && item.subitens.length > 0 && (
              <div className="pl-4 border-l-2 border-gray-200 space-y-2">
                <div className="text-xs font-medium text-gray-500 mb-2">
                  Subitens vinculados:
                </div>
                {item.subitens.map((subitem) => {
                  const lancamentos = Object.entries(subitem.lancamentos || {})
                    .filter(([_, lancamento]) => lancamento !== undefined)
                    .map(([parcelaId, lancamento]) => ({
                      parcelaId,
                      ...lancamento!,
                    }));

                  const totalLancamentos = lancamentos.reduce(
                    (sum, l) => sum + l.valor,
                    0
                  );

                  return (
                    <div
                      key={subitem.id}
                      className="bg-gray-50 rounded p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700">
                          {subitem.empresaRh}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <DollarSign className="h-3 w-3" />
                          <span className="font-medium">
                            Total: {formatCurrency(totalLancamentos)}
                          </span>
                        </div>
                      </div>

                      {lancamentos.length > 0 && (
                        <div className="pl-3 space-y-1">
                          {lancamentos.map((lancamento) => (
                            <div
                              key={lancamento.parcelaId}
                              className="flex items-center justify-between text-xs text-gray-600"
                            >
                              <span>Parcela {lancamento.parcelaId}</span>
                              <div className="flex items-center gap-2">
                                <span>{formatCurrency(lancamento.valor)}</span>
                                <span className="text-gray-400">
                                  {formatDate(lancamento.dataPag)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Total do item */}
            {totalSubitens > 0 && (
              <div className="pt-2 border-t border-gray-200 flex items-center justify-end">
                <span className="text-xs font-semibold text-[#1F4E79]">
                  Total vinculado: {formatCurrency(totalSubitens)}
                </span>
              </div>
            )}
          </div>
        );
      })}

      {/* Total geral */}
      {totalGeral > 0 && (
        <div className="pt-3 border-t-2 border-gray-300 flex items-center justify-end">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-[#1F4E79]" />
            <span className="text-sm font-bold text-[#1F4E79]">
              Total Geral: {formatCurrency(totalGeral)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
