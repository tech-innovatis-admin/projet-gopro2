"use client";

import { AlertCircle } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import type { Contrato } from "../page";

interface InformacoesContratoTabProps {
  contrato: Contrato;
  onChange: (updates: Partial<Contrato>) => void;
}

const statusOptions = [
  { value: "EM_ANDAMENTO", label: "Em Andamento" },
  { value: "CONCLUIDO", label: "Concluído" },
  { value: "SUSPENSO", label: "Suspenso" },
  { value: "CANCELADO", label: "Cancelado" },
  { value: "DRAFT", label: "Rascunho" },
  { value: "EM_NEGOCIACAO", label: "Em Negociação" },
];

const tipoOptions = [
  { value: "PROJETO", label: "Projeto" },
  { value: "PRODUTO", label: "Produto" },
];

const parceirosOptions = [
  "Fundação de Apoio à Pesquisa",
  "Fapto",
  "Fadex",
  "IFMA",
  "Fundação Araucária",
  "Fundação UFRGS",
];

const segmentoOptions = [
  "Educação",
  "Saúde",
  "Cidades",
  "Meio Ambiente",
  "Tecnologia",
  "Turismo",
  "Social",
  "Economia",
  "Cultura",
  "Ciência",
  "Esporte",
  "Agricultura",
  "Outro",
];

export function InformacoesContratoTab({ contrato, onChange }: InformacoesContratoTabProps) {
  const selectedSegmentos = contrato.segmentos || [];

  const toggleSegmento = (segmento: string) => {
    const updated = selectedSegmentos.includes(segmento)
      ? selectedSegmentos.filter((s) => s !== segmento)
      : [...selectedSegmentos, segmento];
    onChange({ segmentos: updated });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Informações do Contrato
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Código */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Código <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={contrato.codigo}
            onChange={(e) => onChange({ codigo: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
            placeholder="Ex: PRJ-001"
          />
        </div>

        {/* Título */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Título do Contrato <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={contrato.titulo}
            onChange={(e) => onChange({ titulo: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
            placeholder="Ex: Sistema de Gestão Integrada"
          />
        </div>

        {/* Tipo */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Tipo <span className="text-red-500">*</span>
          </label>
          <select
            value={contrato.tipo}
            onChange={(e) => onChange({ tipo: e.target.value as "PROJETO" | "PRODUTO" })}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
          >
            {tipoOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            value={contrato.status}
            onChange={(e) => onChange({ status: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Coordenador */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Coordenador <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={contrato.coordenador}
            onChange={(e) => onChange({ coordenador: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
            placeholder="Nome do coordenador"
          />
        </div>

        {/* Parceiro */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Parceiro <span className="text-red-500">*</span>
          </label>
          <select
            value={contrato.parceiro}
            onChange={(e) => onChange({ parceiro: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
          >
            <option value="">Selecione...</option>
            {parceirosOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Órgão Financiador */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Órgão Financiador <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={contrato.orgaoFinanciador}
            onChange={(e) => onChange({ orgaoFinanciador: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
            placeholder="Nome do órgão financiador"
          />
        </div>

        {/* Segmentos */}
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Segmentos <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {segmentoOptions.map((segmento) => {
              const isActive = selectedSegmentos.includes(segmento);
              return (
                <button
                  key={segmento}
                  type="button"
                  onClick={() => toggleSegmento(segmento)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    isActive
                      ? "bg-[#004225] text-white border-[#004225]"
                      : "bg-white text-gray-700 border-gray-300 hover:border-[#004225]"
                  }`}
                >
                  {segmento}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500">Selecione um ou mais segmentos relacionados ao contrato.</p>
        </div>

        {/* Localidade */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Localidade <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={contrato.localidade}
            onChange={(e) => onChange({ localidade: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
            placeholder="Ex: São Paulo - SP"
          />
        </div>

        {/* Valor Total */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Valor Total
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
              R$
            </span>
            <input
              type="text"
              value={contrato.valorTotal.toLocaleString("pt-BR")}
              onChange={(e) => {
                const value = parseFloat(e.target.value.replace(/\D/g, "")) / 100;
                if (!isNaN(value)) onChange({ valorTotal: value });
              }}
              className="w-full pl-12 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
              placeholder="0,00"
            />
          </div>
          <p className="text-xs text-gray-500">
            Valor calculado automaticamente pelas rubricas.
          </p>
        </div>

        {/* Data Início */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Data de Início <span className="text-red-500">*</span>
          </label>
          <DatePicker
            value={contrato.dataInicio}
            onChange={(value) => onChange({ dataInicio: value })}
          />
        </div>

        {/* Data Fim */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Data de Término <span className="text-red-500">*</span>
          </label>
          <DatePicker
            value={contrato.dataFim}
            onChange={(value) => onChange({ dataFim: value })}
          />
        </div>

        {/* Descrição */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Descrição
          </label>
          <textarea
            value={contrato.descricao || ""}
            onChange={(e) => onChange({ descricao: e.target.value })}
            rows={4}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225] resize-none"
            placeholder="Descrição detalhada do contrato..."
          />
        </div>
      </div>

      {/* Aviso */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Dica</p>
          <p>
            Para editar valores detalhados do orçamento, utilize a aba "Rubricas".
            O valor total será calculado automaticamente com base nos itens cadastrados.
          </p>
        </div>
      </div>
    </div>
  );
}
