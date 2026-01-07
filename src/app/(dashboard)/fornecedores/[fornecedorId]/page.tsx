"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { FileText } from "lucide-react";
import { getFornecedorById, getContratosByFornecedor } from "../mockData";
import {
  FornecedorSummary,
  FornecedorInfo,
  FornecedorTags,
} from "./_components";

// =============================================================================
// PÁGINA DE VISÃO GERAL DO FORNECEDOR
// =============================================================================

export default function FornecedorPage() {
  const params = useParams();
  const fornecedorId = params.fornecedorId as string;

  const fornecedor = getFornecedorById(fornecedorId);
  const contratos = getContratosByFornecedor(fornecedorId);

  // Se fornecedor não existir, o layout já trata isso
  if (!fornecedor) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Card de resumo */}
      <FornecedorSummary
        fornecedor={fornecedor}
        contratosCount={contratos.length}
      />

      {/* Grid de informações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações cadastrais */}
        <FornecedorInfo fornecedor={fornecedor} />

        {/* Tags (categorias e serviços) */}
        <FornecedorTags fornecedor={fornecedor} />
      </div>

      {/* Preview de contratos */}
      {contratos.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Contratos Vinculados
              </h3>
            </div>
            <Link
              href={`/fornecedores/${fornecedorId}/contratos`}
              className="text-sm font-medium text-[#1F4E79] hover:underline"
            >
              Ver todos ({contratos.length})
            </Link>
          </div>

          {/* Preview dos 3 primeiros contratos */}
          <div className="space-y-3">
            {contratos.slice(0, 3).map((contrato) => (
              <div
                key={contrato.id}
                className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-[#1F4E79]">
                      {contrato.codigo}
                    </span>
                    <span className="text-sm text-gray-900 truncate">
                      {contrato.titulo}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700 ml-4">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(contrato.valorTotal)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
