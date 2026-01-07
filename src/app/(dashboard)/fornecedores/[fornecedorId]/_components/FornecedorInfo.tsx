"use client";

import { Building2, FileText, MapPin, Hash, Clock } from "lucide-react";
import { type Fornecedor } from "../../types";

// =============================================================================
// COMPONENTE DE INFORMAÇÕES CADASTRAIS DO FORNECEDOR
// =============================================================================

interface FornecedorInfoProps {
  fornecedor: Fornecedor;
}

export function FornecedorInfo({ fornecedor }: FornecedorInfoProps) {
  // Formata data
  const formatDate = (dateString?: string): string => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const infoItems = [
    {
      label: "Nome/Razão Social",
      value: fornecedor.nome,
      icon: Building2,
    },
    {
      label: "CNPJ",
      value: fornecedor.cnpj || "Não informado",
      icon: Hash,
    },
    {
      label: "Endereço",
      value: fornecedor.endereco || "Não informado",
      icon: MapPin,
    },
    {
      label: "Localização",
      value: `${fornecedor.municipio}, ${fornecedor.uf}`,
      icon: MapPin,
    },
    {
      label: "Data de Cadastro",
      value: formatDate(fornecedor.createdAt),
      icon: Clock,
    },
    {
      label: "Última Atualização",
      value: formatDate(fornecedor.updatedAt),
      icon: Clock,
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-[#1F4E79]/10 rounded-lg">
          <FileText className="h-5 w-5 text-[#1F4E79]" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          Informações Cadastrais
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {infoItems.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center gap-2">
              <item.icon className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {item.label}
              </span>
            </div>
            <p className="text-sm text-gray-900 pl-6">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Observações */}
      {fornecedor.observacoes && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Observações
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">
            {fornecedor.observacoes}
          </p>
        </div>
      )}
    </div>
  );
}
