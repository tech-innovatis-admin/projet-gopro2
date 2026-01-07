"use client";

import { Tag, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type Fornecedor,
  type FornecedorCategoria,
  type FornecedorServico,
  CATEGORIA_LABELS,
  SERVICO_LABELS,
} from "../../types";

// =============================================================================
// COMPONENTE DE TAGS (CATEGORIAS E SERVIÇOS) DO FORNECEDOR
// =============================================================================

interface FornecedorTagsProps {
  fornecedor: Fornecedor;
}

export function FornecedorTags({ fornecedor }: FornecedorTagsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      {/* Categorias */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Tag className="h-5 w-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Categorias</h3>
        </div>

        {fornecedor.categorias.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {fornecedor.categorias.map((cat) => (
              <span
                key={cat}
                className="inline-flex px-3 py-1.5 text-sm font-medium rounded-full bg-gray-100 text-gray-700"
              >
                {CATEGORIA_LABELS[cat as FornecedorCategoria] || cat}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Nenhuma categoria atribuída</p>
        )}
      </div>

      {/* Serviços */}
      <div className="pt-6 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-teal-100 rounded-lg">
            <Wrench className="h-5 w-5 text-teal-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Serviços</h3>
        </div>

        {fornecedor.servicos.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {fornecedor.servicos.map((serv) => (
              <span
                key={serv}
                className="inline-flex px-3 py-1.5 text-sm font-medium rounded-full bg-teal-50 text-teal-700"
              >
                {SERVICO_LABELS[serv as FornecedorServico] || serv}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Nenhum serviço atribuído</p>
        )}
      </div>
    </div>
  );
}
