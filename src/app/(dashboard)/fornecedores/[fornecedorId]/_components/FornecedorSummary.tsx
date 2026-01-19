"use client";

import { Building2, Mail, Phone, MapPin, Calendar } from "lucide-react";
import { type Fornecedor, STATUS_CONFIG } from "../../types";
import { StarRating } from "@/components/ui/StarRating";
import { cn } from "@/lib/utils";
import { getContratosByFornecedor } from "../../mockData";

// =============================================================================
// COMPONENTE DE RESUMO/CARD DO FORNECEDOR
// =============================================================================

interface FornecedorSummaryProps {
  fornecedor: Fornecedor;
  contratosCount: number;
}

export function FornecedorSummary({ fornecedor, contratosCount }: FornecedorSummaryProps) {
  const statusConfig = STATUS_CONFIG[fornecedor.status];

  // Calcula média de avaliações
  const contratos = getContratosByFornecedor(fornecedor.id);
  const avaliacoes = contratos
    .map((c) => c.avaliacao?.nota)
    .filter((nota): nota is number => nota !== undefined && nota > 0);
  
  const mediaAvaliacoes = avaliacoes.length > 0
    ? avaliacoes.reduce((sum, nota) => sum + nota, 0) / avaliacoes.length
    : 0;

  // Formata data
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0 h-20 w-20 rounded-xl bg-[#1F4E79]/10 flex items-center justify-center">
          <span className="text-2xl font-bold text-[#1F4E79]">
            {fornecedor.nome
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </span>
        </div>

        {/* Info principal */}
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-semibold text-gray-900">
                {fornecedor.nome}
              </h2>
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
            {fornecedor.razaoSocial && fornecedor.razaoSocial !== fornecedor.nome && (
              <p className="text-sm text-gray-500 mt-0.5">{fornecedor.razaoSocial}</p>
            )}
          </div>

          {/* Dados rápidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>
                {fornecedor.municipio}, {fornecedor.uf}
              </span>
            </div>

            {fornecedor.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4 text-gray-400" />
                <a
                  href={`mailto:${fornecedor.email}`}
                  className="hover:text-[#1F4E79] hover:underline"
                >
                  {fornecedor.email}
                </a>
              </div>
            )}

            {fornecedor.telefone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{fornecedor.telefone}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>Cadastrado em {formatDate(fornecedor.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Métricas rápidas */}
        <div className="hidden lg:flex flex-col items-end gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-[#1F4E79]">{contratosCount}</p>
            <p className="text-xs text-gray-500">
              contrato{contratosCount !== 1 ? "s" : ""} vinculado{contratosCount !== 1 ? "s" : ""}
            </p>
          </div>
          {mediaAvaliacoes > 0 && (
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 mb-1">
                <StarRating nota={mediaAvaliacoes} readonly size="sm" />
              </div>
              <p className="text-xs text-gray-500">
                {mediaAvaliacoes.toFixed(1)} ({avaliacoes.length} avaliação{avaliacoes.length !== 1 ? "ões" : ""})
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
