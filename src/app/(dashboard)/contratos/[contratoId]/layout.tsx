"use client";

import { useState, useEffect } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { NavBar } from "@/components/ui/NavBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import {
  ChevronRight,
  Home,
  Download,
  MoreHorizontal,
  Building2,
  User,
  Calendar,
  DollarSign,
  Tag,
  MapPin,
  FileText,
  ChevronDown,
  ChevronUp,
  Edit,
  Save,
  X,
  CheckCircle,
} from "lucide-react";
import { mockContrato, type Contrato } from "./types";

type TabItem = {
  label: string;
  href: string;
  description: string;
};

export default function ContratoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const contratoId = params.contratoId as string;
  const [isDescricaoExpanded, setIsDescricaoExpanded] = useState(false);
  const [isInfoComplementarExpanded, setIsInfoComplementarExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContrato, setEditContrato] = useState<Contrato>({ ...mockContrato, id: contratoId });
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Garantir que o componente está montado no cliente para evitar problemas de hidratação
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // TODO: Substituir por fetch real do contrato
  const contratoBase: Contrato = { ...mockContrato, id: contratoId };
  const contrato: Contrato = isEditing ? editContrato : contratoBase;

  const tabs: TabItem[] = [
    {
      label: "Visão Geral",
      href: `/contratos/${contratoId}`,
      description: "Resumo e informações principais",
    },
    {
      label: "Contratações",
      href: `/contratos/${contratoId}/contratacoes`,
      description: "Aditivos, OS e contratos vinculados",
    },
    {
      label: "Execução",
      href: `/contratos/${contratoId}/execucao`,
      description: "Cronograma, marcos e entregas",
    },
    {
      label: "Rubricas",
      href: `/contratos/${contratoId}/rubricas`,
      description: "Orçamento e execução financeira",
    },
    {
      label: "Informações",
      href: `/contratos/${contratoId}/informacoes`,
      description: "Dados básicos do contrato",
    },
    {
      label: "Metas",
      href: `/contratos/${contratoId}/meta-etapa-fase`,
      description: "Estrutura de metas e entregas",
    },
    {
      label: "Equipe",
      href: `/contratos/${contratoId}/equipe-tecnica`,
      description: "Membros e papéis",
    },
    {
      label: "Incubadas",
      href: `/contratos/${contratoId}/incubadas`,
      description: "Empresas vinculadas",
    },
    {
      label: "Desembolso",
      href: `/contratos/${contratoId}/desembolso`,
      description: "Cronograma de pagamentos",
    },
    {
      label: "Arquivos",
      href: `/contratos/${contratoId}/arquivos`,
      description: "Documentos anexados",
    },
  ];

  const isActiveTab = (href: string) => {
    if (href === `/contratos/${contratoId}`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const currentContrato = isEditing ? editContrato : contrato;
  const percentualExecutado = currentContrato.valorExecutado
    ? Math.round((currentContrato.valorExecutado / currentContrato.valorTotal) * 100)
    : 0;
  
  // Truncar descrição para preview
  const currentDescricao = isEditing ? editContrato.descricao : contrato.descricao;
  const descricaoPreview = currentDescricao
    ? currentDescricao.length > 150
      ? currentDescricao.substring(0, 150) + "..."
      : currentDescricao
    : null;

  // Funções de edição
  const handleEdit = () => {
    setEditContrato({ ...mockContrato, id: contratoId });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditContrato({ ...mockContrato, id: contratoId });
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Salvar contrato via API
    await new Promise((resolve) => setTimeout(resolve, 1000));
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

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <NavBar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/home" className="hover:text-gray-700 flex items-center gap-1">
            <Home className="h-4 w-4" />
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/contratos" className="hover:text-gray-700">
            Contratos
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">
            {(isEditing ? editContrato : contrato).codigo} – {(isEditing ? editContrato : contrato).titulo}
          </span>
        </nav>

        {/* Header do Contrato */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          {/* Linha principal */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      value={editContrato.codigo}
                      onChange={(e) => handleChange({ codigo: e.target.value })}
                      className="px-2 py-1 text-2xl font-bold text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
                      placeholder="Código"
                    />
                    <span className="text-2xl font-bold text-gray-900">–</span>
                    <input
                      type="text"
                      value={editContrato.titulo}
                      onChange={(e) => handleChange({ titulo: e.target.value })}
                      className="px-2 py-1 text-2xl font-bold text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225] flex-1 min-w-[200px]"
                      placeholder="Título do contrato"
                    />
                  </div>
                ) : (
                  <h1 className="text-2xl font-bold text-gray-900">
                    {contrato.codigo} – {contrato.titulo}
                  </h1>
                )}
                {!isEditing && (
                  <>
                    <TipoBadge tipo={contrato.tipo} />
                    <StatusBadge status={contrato.status} />
                  </>
                )}
                {isEditing && (
                  <div className="flex items-center gap-2">
                    <select
                      value={editContrato.tipo}
                      onChange={(e) => handleChange({ tipo: e.target.value as "PROJETO" | "PRODUTO" })}
                      className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                    >
                      <option value="PROJETO">Projeto</option>
                      <option value="PRODUTO">Produto</option>
                    </select>
                    <select
                      value={editContrato.status}
                      onChange={(e) => handleChange({ status: e.target.value })}
                      className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                    >
                      <option value="EM_ANDAMENTO">Em Andamento</option>
                      <option value="CONCLUIDO">Concluído</option>
                      <option value="SUSPENSO">Suspenso</option>
                      <option value="CANCELADO">Cancelado</option>
                      <option value="DRAFT">Rascunho</option>
                      <option value="EM_NEGOCIACAO">Em Negociação</option>
                    </select>
                  </div>
                )}
              </div>
              <p className="text-gray-500 text-sm">
                Contrato ID: {contratoId}
              </p>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2">
              {savedMessage && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                  <CheckCircle className="h-4 w-4" />
                  Salvo com sucesso!
                </div>
              )}
              {isEditing ? (
                <>
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
                </>
                ) : (
                  <>
                    {isMounted ? (
                      <div className="relative">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button 
                              type="button"
                              className="inline-flex items-center justify-center w-10 h-10 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            sideOffset={5}
                            className="bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px] z-50"
                          >
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                handleEdit();
                              }}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer focus:bg-gray-50 outline-none"
                            >
                              <Edit className="h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                // TODO: Implementar exportação
                                console.log("Exportar clicado");
                              }}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer focus:bg-gray-50 outline-none"
                            >
                              <Download className="h-4 w-4" />
                              Exportar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ) : (
                      <button 
                        type="button"
                        className="inline-flex items-center justify-center w-10 h-10 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    )}
                  </>
                )}
            </div>
          </div>

          {/* Sub-informações em grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Coluna 1 - Cliente/Parceiro */}
            <div className="space-y-3">
              {contrato.cliente && (
                <div className="flex items-start gap-3 group">
                  <Building2 className="h-5 w-5 text-gray-400 mt-0.5 group-hover:text-[#003319] transition-colors" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide group-hover:text-[#003319] transition-colors cursor-default">Cliente</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editContrato.cliente || ""}
                        onChange={(e) => handleChange({ cliente: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900">{contrato.cliente}</p>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 group">
                <Building2 className="h-5 w-5 text-gray-400 mt-0.5 group-hover:text-[#003319] transition-colors" />
                <div className="flex-1">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide group-hover:text-[#003319] transition-colors cursor-default">Parceiro</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editContrato.parceiro}
                      onChange={(e) => handleChange({ parceiro: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{contrato.parceiro}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Coluna 2 - Órgão Financiador/Tipo */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 group">
                <Building2 className="h-5 w-5 text-gray-400 mt-0.5 group-hover:text-[#003319] transition-colors" />
                <div className="flex-1">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide group-hover:text-[#003319] transition-colors cursor-default">Órgão Financiador</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editContrato.orgaoFinanciador}
                      onChange={(e) => handleChange({ orgaoFinanciador: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{contrato.orgaoFinanciador}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3 group">
                <Tag className="h-5 w-5 text-gray-400 mt-0.5 group-hover:text-[#003319] transition-colors" />
                <div className="flex-1">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide group-hover:text-[#003319] transition-colors cursor-default">Tipo</p>
                  {isEditing ? (
                    <select
                      value={editContrato.tipo}
                      onChange={(e) => handleChange({ tipo: e.target.value as "PROJETO" | "PRODUTO" })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
                    >
                      <option value="PROJETO">Projeto</option>
                      <option value="PRODUTO">Produto</option>
                    </select>
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {contrato.tipo === "PROJETO" ? "Projeto" : "Produto"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Coluna 3 - Valor Total/Situação Financeira */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 group">
                <DollarSign className="h-5 w-5 text-gray-400 mt-0.5 group-hover:text-[#003319] transition-colors" />
                <div className="flex-1">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide group-hover:text-[#003319] transition-colors cursor-default">Valor Total</p>
                  {isEditing ? (
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">R$</span>
                      <input
                        type="text"
                        value={editContrato.valorTotal.toLocaleString("pt-BR")}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value.replace(/\D/g, "")) / 100;
                          if (!isNaN(value)) handleChange({ valorTotal: value });
                        }}
                        className="w-full pl-8 pr-2 py-1 text-sm font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
                        placeholder="0,00"
                      />
                    </div>
                  ) : (
                    <p className="text-sm font-bold text-gray-900">
                      R$ {contrato.valorTotal.toLocaleString("pt-BR")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3 group">
                <div className="h-5 w-5" /> {/* Spacer */}
                <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide group-hover:text-[#003319] transition-colors cursor-default">Situação Financeira</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full w-24">
                      <div
                        className="h-2 bg-[#004225] rounded-full"
                        style={{ width: `${percentualExecutado}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {percentualExecutado}% executado
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna 4 - Datas */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 group">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5 group-hover:text-[#003319] transition-colors" />
                <div className="flex-1">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide group-hover:text-[#003319] transition-colors cursor-default">Data de Início</p>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editContrato.dataInicio}
                      onChange={(e) => handleChange({ dataInicio: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(contrato.dataInicio)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3 group">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5 group-hover:text-[#003319] transition-colors" />
                <div className="flex-1">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide group-hover:text-[#003319] transition-colors cursor-default">Data de Término</p>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editContrato.dataFim}
                      onChange={(e) => handleChange({ dataFim: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(contrato.dataFim)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Informações Complementares - Seção Expansível */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => setIsInfoComplementarExpanded(!isInfoComplementarExpanded)}
              className="w-full flex items-center justify-between text-left hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
            >
              <span className="text-xs font-medium text-gray-700">
                Informações Complementares
              </span>
              {isInfoComplementarExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>

            {isInfoComplementarExpanded && (
              <>
                {/* Grid de 4 colunas */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                  {/* Coluna 1 - Coordenador */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 group">
                      <User className="h-5 w-5 text-gray-400 mt-0.5 group-hover:text-[#003319] transition-colors" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wide group-hover:text-[#003319] transition-colors cursor-default">Coordenador</p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editContrato.coordenador}
                            onChange={(e) => handleChange({ coordenador: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900">{contrato.coordenador}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Coluna 2 - Localidade */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 group">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5 group-hover:text-[#003319] transition-colors" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wide group-hover:text-[#003319] transition-colors cursor-default">Localidade</p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editContrato.localidade}
                            onChange={(e) => handleChange({ localidade: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900">{contrato.localidade}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Coluna 3 - Segmentos */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 group">
                      <Tag className="h-5 w-5 text-gray-400 mt-0.5 group-hover:text-[#003319] transition-colors" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-2 group-hover:text-[#003319] transition-colors cursor-default">Segmentos</p>
                        {isEditing ? (
                          <div className="flex flex-wrap gap-2">
                            {segmentoOptions.map((segmento) => {
                              const isActive = (editContrato.segmentos || []).includes(segmento);
                              return (
                                <button
                                  key={segmento}
                                  type="button"
                                  onClick={() => toggleSegmento(segmento)}
                                  className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
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
                        ) : (
                          contrato.segmentos && contrato.segmentos.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {contrato.segmentos.map((segmento) => (
                                <span
                                  key={segmento}
                                  className="px-3 py-1 text-xs bg-[#004225] text-white rounded-full"
                                >
                                  {segmento}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400">Nenhum segmento selecionado</p>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Coluna 4 - Vazia */}
                  <div className="space-y-3">
                  </div>
                </div>

                {/* Objeto - abaixo do grid, ocupando toda a largura */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-start gap-3 group">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5 group-hover:text-[#003319] transition-colors" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-2 group-hover:text-[#003319] transition-colors cursor-default">Objeto</p>
                      {isEditing ? (
                        <textarea
                          value={editContrato.descricao || ""}
                          onChange={(e) => handleChange({ descricao: e.target.value })}
                          rows={4}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225] resize-none"
                          placeholder="Descrição do objeto do contrato..."
                        />
                      ) : contrato.descricao ? (
                        <>
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">
                            {isDescricaoExpanded ? contrato.descricao : descricaoPreview}
                          </p>
                          {contrato.descricao.length > 150 && (
                            <button
                              onClick={() => setIsDescricaoExpanded(!isDescricaoExpanded)}
                              className="mt-2 text-sm text-[#004225] hover:text-[#003319] font-medium flex items-center gap-1"
                            >
                              {isDescricaoExpanded ? (
                                <>
                                  <ChevronUp className="h-4 w-4" />
                                  Ver menos
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4" />
                                  Ver mais
                                </>
                              )}
                            </button>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Nenhum objeto cadastrado</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tabs de navegação */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {tabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`
                    flex-shrink-0 px-6 py-4 text-sm font-medium border-b-2 transition-colors
                    ${
                      isActiveTab(tab.href)
                        ? "border-[#004225] text-[#004225]"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }
                  `}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Conteúdo da aba */}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

// Componentes auxiliares
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    EM_ANDAMENTO: { bg: "bg-blue-100", text: "text-blue-800", label: "Em Andamento" },
    CONCLUIDO: { bg: "bg-green-100", text: "text-green-800", label: "Concluído" },
    SUSPENSO: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Suspenso" },
    DRAFT: { bg: "bg-gray-100", text: "text-gray-800", label: "Rascunho" },
    CANCELADO: { bg: "bg-red-100", text: "text-red-800", label: "Cancelado" },
    EM_NEGOCIACAO: { bg: "bg-purple-100", text: "text-purple-800", label: "Em Negociação" },
  };

  const { bg, text, label } = config[status] || config.DRAFT;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
}

function TipoBadge({ tipo }: { tipo: "PROJETO" | "PRODUTO" }) {
  const isProjeto = tipo === "PROJETO";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isProjeto ? "bg-emerald-100 text-emerald-800" : "bg-teal-100 text-teal-800"
      }`}
    >
      {isProjeto ? "Projeto" : "Produto"}
    </span>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return iso;
  }
}
