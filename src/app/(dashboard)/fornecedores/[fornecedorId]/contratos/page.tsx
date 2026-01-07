"use client";

import { useParams } from "next/navigation";
import { getFornecedorById, getContratosByFornecedor } from "../../mockData";
import { FornecedorContractsTable } from "../_components";

// =============================================================================
// PÁGINA DE CONTRATOS VINCULADOS AO FORNECEDOR
// =============================================================================

export default function FornecedorContratosPage() {
  const params = useParams();
  const fornecedorId = params.fornecedorId as string;

  const fornecedor = getFornecedorById(fornecedorId);
  const contratos = getContratosByFornecedor(fornecedorId);

  // Se fornecedor não existir, o layout já trata isso
  if (!fornecedor) {
    return null;
  }

  // Calcula totais
  const totalValor = contratos.reduce((sum, c) => sum + c.valorTotal, 0);
  const emAndamento = contratos.filter((c) => c.status === "EM_ANDAMENTO").length;
  const concluidos = contratos.filter((c) => c.status === "CONCLUIDO").length;

  return (
    <div className="space-y-6">
      {/* Header */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Contratos Vinculados
          </h2>
          <p className="text-sm text-gray-500">
            Todos os contratos associados a {fornecedor.nome}
          </p>
      </div>

      {/* Métricas */}
      {contratos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Total de Contratos</p>
            <p className="text-2xl font-bold text-gray-900">{contratos.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Valor Total</p>
            <p className="text-2xl font-bold text-[#1F4E79]">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
                notation: "compact",
              }).format(totalValor)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-sm font-medium text-gray-700">
                  {emAndamento} em andamento
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-gray-700">
                  {concluidos} concluído{concluidos !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de contratos */}
      <FornecedorContractsTable contratos={contratos} fornecedor={fornecedor} />
    </div>
  );
}
