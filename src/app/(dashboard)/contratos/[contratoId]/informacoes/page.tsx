"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Edit, Save, X, CheckCircle, AlertCircle } from "lucide-react";

// Tipos
export type Contrato = {
  id: string;
  codigo: string;
  titulo: string;
  tipo: "PROJETO" | "PRODUTO";
  status: string;
  coordenador: string;
  parceiro: string;
  orgaoFinanciador: string;
  segmentos: string[];
  localidade: string;
  dataInicio: string;
  dataFim: string;
  valorTotal: number;
  descricao?: string;
};

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

// Mock de dados do contrato
const mockContrato: Contrato = {
  id: "1",
  codigo: "PRJ-001",
  titulo: "Sistema de Gestão Integrada",
  tipo: "PROJETO",
  status: "EM_ANDAMENTO",
  coordenador: "João Silva",
  parceiro: "Fundação de Apoio à Pesquisa",
  orgaoFinanciador: "Ministério da Educação",
  segmentos: ["Educação", "Tecnologia"],
  localidade: "São Paulo - SP",
  dataInicio: "2025-01-15",
  dataFim: "2025-12-31",
  valorTotal: 1250000,
  descricao: "Desenvolvimento de sistema integrado para gestão acadêmica e administrativa.",
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return iso;
  }
}

export default function InformacoesPage() {
  const params = useParams();
  const contratoId = params.contratoId as string;

  const [isEditing, setIsEditing] = useState(false);
  const [contrato, setContrato] = useState<Contrato>(mockContrato);
  const [editContrato, setEditContrato] = useState<Contrato>(mockContrato);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  // Simular carregamento do contrato
  useEffect(() => {
    // TODO: Fetch real do contrato pelo ID
    setContrato({ ...mockContrato, id: contratoId });
    setEditContrato({ ...mockContrato, id: contratoId });
  }, [contratoId]);

  const handleEdit = () => {
    setEditContrato({ ...contrato });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditContrato({ ...contrato });
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Salvar contrato via API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setContrato({ ...editContrato });
    setIsSaving(false);
    setIsEditing(false);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const handleChange = (updates: Partial<Contrato>) => {
    setEditContrato((prev) => ({ ...prev, ...updates }));
  };

  const toggleSegmento = (segmento: string) => {
    const selected = editContrato.segmentos || [];
    const updated = selected.includes(segmento)
      ? selected.filter((s) => s !== segmento)
      : [...selected, segmento];
    handleChange({ segmentos: updated });
  };

  // Modo de visualização (read-only)
  if (!isEditing) {
    return (
      <div className="space-y-6">
        {/* Header com botão Editar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Informações do Contrato
            </h2>
            <p className="text-sm text-gray-500">
              Dados básicos e configurações do contrato
            </p>
          </div>
          <div className="flex items-center gap-3">
            {savedMessage && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                <CheckCircle className="h-4 w-4" />
                Salvo com sucesso!
              </div>
            )}
            <button
              onClick={handleEdit}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
            >
              <Edit className="h-4 w-4" />
              Editar
            </button>
          </div>
        </div>

        {/* Dados em modo leitura */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Código */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Código</p>
            <p className="text-sm text-gray-900">{contrato.codigo}</p>
          </div>

          {/* Título */}
          <div className="space-y-1 md:col-span-2">
            <p className="text-sm font-medium text-gray-500">Título do Contrato</p>
            <p className="text-sm text-gray-900">{contrato.titulo}</p>
          </div>

          {/* Tipo */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Tipo</p>
            <p className="text-sm text-gray-900">
              {tipoOptions.find((o) => o.value === contrato.tipo)?.label || contrato.tipo}
            </p>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Status</p>
            <p className="text-sm text-gray-900">
              {statusOptions.find((o) => o.value === contrato.status)?.label || contrato.status}
            </p>
          </div>

          {/* Coordenador */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Coordenador</p>
            <p className="text-sm text-gray-900">{contrato.coordenador}</p>
          </div>

          {/* Parceiro */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Parceiro</p>
            <p className="text-sm text-gray-900">{contrato.parceiro}</p>
          </div>

          {/* Órgão Financiador */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Órgão Financiador</p>
            <p className="text-sm text-gray-900">{contrato.orgaoFinanciador}</p>
          </div>

          {/* Segmentos */}
          <div className="space-y-1 md:col-span-2">
            <p className="text-sm font-medium text-gray-500">Segmentos</p>
            <div className="flex flex-wrap gap-2">
              {contrato.segmentos.map((segmento) => (
                <span
                  key={segmento}
                  className="px-3 py-1 text-sm bg-[#004225] text-white rounded-full"
                >
                  {segmento}
                </span>
              ))}
            </div>
          </div>

          {/* Localidade */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Localidade</p>
            <p className="text-sm text-gray-900">{contrato.localidade}</p>
          </div>

          {/* Valor Total */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Valor Total</p>
            <p className="text-sm text-gray-900 font-semibold">
              R$ {contrato.valorTotal.toLocaleString("pt-BR")}
            </p>
          </div>

          {/* Data Início */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Data de Início</p>
            <p className="text-sm text-gray-900">{formatDate(contrato.dataInicio)}</p>
          </div>

          {/* Data Fim */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Data de Término</p>
            <p className="text-sm text-gray-900">{formatDate(contrato.dataFim)}</p>
          </div>

          {/* Descrição */}
          <div className="space-y-1 md:col-span-2">
            <p className="text-sm font-medium text-gray-500">Descrição</p>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">
              {contrato.descricao || "—"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Modo de edição
  return (
    <div className="space-y-6">
      {/* Header com botões Salvar/Cancelar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Editar Informações do Contrato
          </h2>
          <p className="text-sm text-gray-500">
            Altere os dados e clique em Salvar para confirmar
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCancel}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X className="h-4 w-4" />
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>

      {/* Formulário de edição */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Código */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Código <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={editContrato.codigo}
            onChange={(e) => handleChange({ codigo: e.target.value })}
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
            value={editContrato.titulo}
            onChange={(e) => handleChange({ titulo: e.target.value })}
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
            value={editContrato.tipo}
            onChange={(e) => handleChange({ tipo: e.target.value as "PROJETO" | "PRODUTO" })}
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
            value={editContrato.status}
            onChange={(e) => handleChange({ status: e.target.value })}
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
            value={editContrato.coordenador}
            onChange={(e) => handleChange({ coordenador: e.target.value })}
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
            value={editContrato.parceiro}
            onChange={(e) => handleChange({ parceiro: e.target.value })}
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
            value={editContrato.orgaoFinanciador}
            onChange={(e) => handleChange({ orgaoFinanciador: e.target.value })}
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
              const isActive = (editContrato.segmentos || []).includes(segmento);
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
          <p className="text-xs text-gray-500">
            Selecione um ou mais segmentos relacionados ao contrato.
          </p>
        </div>

        {/* Localidade */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Localidade <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={editContrato.localidade}
            onChange={(e) => handleChange({ localidade: e.target.value })}
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
              value={editContrato.valorTotal.toLocaleString("pt-BR")}
              onChange={(e) => {
                const value = parseFloat(e.target.value.replace(/\D/g, "")) / 100;
                if (!isNaN(value)) handleChange({ valorTotal: value });
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
          <input
            type="date"
            value={editContrato.dataInicio}
            onChange={(e) => handleChange({ dataInicio: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
          />
        </div>

        {/* Data Fim */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Data de Término <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={editContrato.dataFim}
            onChange={(e) => handleChange({ dataFim: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
          />
        </div>

        {/* Descrição */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Descrição
          </label>
          <textarea
            value={editContrato.descricao || ""}
            onChange={(e) => handleChange({ descricao: e.target.value })}
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
