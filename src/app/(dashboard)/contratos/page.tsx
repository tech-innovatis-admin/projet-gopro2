"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { NavBar } from "@/components/ui/NavBar";
import {
  ChevronRight,
  Home,
  Plus,
  Search,
  Filter,
  X,
  FileText,
  TrendingUp,
  CheckCircle,
  PauseCircle,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";
import { ResizableTable } from "@/components/ui/resizable-table";
import { MoneyInput } from "./[contratoId]/desembolso/_components/MoneyImput";

// Tipos
type ContratoStatus = "EM_ANDAMENTO" | "CONCLUIDO" | "SUSPENSO" | "DRAFT" | "CANCELADO" | "EM_NEGOCIACAO";
type ContratoTipo = "PROJETO" | "PRODUTO";

type Contrato = {
  id: string;
  codigo: string;
  nome: string;
  govIf: "IF" | "Gov";
  tipo: ContratoTipo;
  cliente: string;
  parceiro: string;
  categoria: string;
  status: ContratoStatus;
  valorTotal: number;
  dataInicio: string;
  dataTermino?: string;
  responsavel: string;
  uf: string;
  orgaoFinanciador: string;
  segmento: string;
};

type Filters = {
  govIf: "TODOS" | "IF" | "Gov";
  status: "TODOS" | ContratoStatus;
  parceiro: string;
  periodoInicio: string;
  periodoFim: string;
  q: string;
  orgaoFinanciador: string;
  segmento: string;
  tipo: "TODOS" | ContratoTipo;
  localidade: string;
  valorMinimo: number;
  valorMaximo: number;
};

type SortConfig = {
  key: keyof Contrato | null;
  direction: "asc" | "desc";
};

// Mock de dados
const mockContratos: Contrato[] = [
  {
    id: "1",
    codigo: "PRJ-001",
    nome: "Sistema de Gestão Integrada",
    govIf: "IF",
    tipo: "PROJETO",
    cliente: "Universidade Federal de São Paulo",
    parceiro: "Fundação de Apoio à Pesquisa",
    categoria: "Desenvolvimento",
    status: "EM_ANDAMENTO",
    valorTotal: 1250000,
    dataInicio: "2025-01-15",
    dataTermino: "2025-12-31",
    responsavel: "João Silva",
    uf: "SP",
    orgaoFinanciador: "CNPq",
    segmento: "Tecnologia da Informação",
  },
  {
    id: "2",
    codigo: "PRD-010",
    nome: "Licença GoPro Enterprise",
    govIf: "Gov",
    tipo: "PRODUTO",
    cliente: "Org Y",
    parceiro: "Fundação XYZ",
    categoria: "Software",
    status: "CONCLUIDO",
    valorTotal: 240000,
    dataInicio: "2025-03-01",
    dataTermino: "2025-09-01",
    responsavel: "Maria Santos",
    uf: "RJ",
    orgaoFinanciador: "FINEP",
    segmento: "Software e Serviços",
  },
  {
    id: "3",
    codigo: "PRJ-015",
    nome: "Portal de Transparência",
    govIf: "IF",
    tipo: "PROJETO",
    cliente: "Fundação Z",
    parceiro: "IFES-MG",
    categoria: "Web",
    status: "SUSPENSO",
    valorTotal: 800000,
    dataInicio: "2025-06-20",
    responsavel: "Carlos Oliveira",
    uf: "MG",
    orgaoFinanciador: "FAPEMIG",
    segmento: "Desenvolvimento Web",
  },
  {
    id: "4",
    codigo: "PRJ-020",
    nome: "Modernização de Infraestrutura",
    govIf: "Gov",
    tipo: "PROJETO",
    cliente: "Instituto Federal do Paraná",
    parceiro: "Fundação Araucária",
    categoria: "Infraestrutura",
    status: "EM_ANDAMENTO",
    valorTotal: 2100000,
    dataInicio: "2025-02-01",
    dataTermino: "2026-06-30",
    responsavel: "Ana Costa",
    uf: "PR",
    orgaoFinanciador: "MEC",
    segmento: "Infraestrutura",
  },
  {
    id: "5",
    codigo: "PRD-025",
    nome: "Suporte Premium Anual",
    govIf: "IF",
    tipo: "PRODUTO",
    cliente: "Universidade Federal do Rio Grande do Sul",
    parceiro: "Fundação UFRGS",
    categoria: "Serviços",
    status: "EM_NEGOCIACAO",
    valorTotal: 180000,
    dataInicio: "2025-04-01",
    responsavel: "Pedro Mendes",
    uf: "RS",
    orgaoFinanciador: "CAPES",
    segmento: "Serviços",
  },
];

const parceiros = [...new Set(mockContratos.map((c) => c.parceiro))];
const orgaosFinanciadores = [...new Set(mockContratos.map((c) => c.orgaoFinanciador))];
const segmentos = [
  "Educação",
  "Saúde",
  "Ciência",
  "Meio Ambiente",
  "Tecnologia",
  "Turismo",
  "Social",
  "Economia",
  "Cultura",
  "Esporte",
  "Agricultura",
  "Outro",
];
const localidades = [...new Set(mockContratos.map((c) => c.uf))];

export default function ContratosPage() {
  const [filters, setFilters] = useState<Filters>({
    govIf: "TODOS",
    status: "TODOS",
    parceiro: "",
    periodoInicio: "",
    periodoFim: "",
    q: "",
    orgaoFinanciador: "",
    segmento: "",
    tipo: "TODOS",
    localidade: "",
    valorMinimo: 0,
    valorMaximo: 0,
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "dataInicio",
    direction: "desc",
  });
  const [loading, setLoading] = useState(false);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  // Simulação de fetch
  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      setContratos(mockContratos);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, []);

  // Listener para quando um contrato for criado (via modal global)
  useEffect(() => {
    const handleContratoCriado = (event: CustomEvent) => {
      const data = event.detail;
      
      // Cria o novo contrato com os dados recebidos
      const novoContrato: Contrato = {
        id: String(Date.now()),
        codigo: data.tipo === "PROJETO" ? `PRJ-${String(contratos.length + 1).padStart(3, "0")}` : `PRD-${String(contratos.length + 1).padStart(3, "0")}`,
        nome: data.titulo,
        govIf: data.govIf || "IF",
        tipo: data.tipo as ContratoTipo,
        cliente: data.localidade,
        parceiro: data.parceiro,
        categoria: "Geral",
        status: data.status === "A_INICIAR" ? "EM_ANDAMENTO" : data.status === "PENDENCIA" ? "SUSPENSO" : data.status as ContratoStatus,
        valorTotal: 0,
        dataInicio: data.dataInicio,
        dataTermino: data.dataFim || undefined,
        responsavel: data.coordenador,
        uf: data.localidade.split(" - ")[1] || "BR",
        orgaoFinanciador: data.orgaoFinanciador || "N/A",
        segmento: data.segmento || "Geral",
      };
      
      setContratos((prev) => [novoContrato, ...prev]);
    };

    window.addEventListener('contrato-criado', handleContratoCriado as EventListener);
    return () => {
      window.removeEventListener('contrato-criado', handleContratoCriado as EventListener);
    };
  }, [contratos.length]);

  // Filtragem e ordenação
  const filtered = useMemo(() => {
    let result = contratos
      .filter((c) => (filters.govIf === "TODOS" ? true : c.govIf === filters.govIf))
      .filter((c) => (filters.status === "TODOS" ? true : c.status === filters.status))
      .filter((c) => (filters.parceiro ? c.parceiro === filters.parceiro : true))
      .filter((c) => (filters.orgaoFinanciador ? c.orgaoFinanciador === filters.orgaoFinanciador : true))
      .filter((c) => (filters.segmento ? c.segmento === filters.segmento : true))
      .filter((c) => (filters.tipo === "TODOS" ? true : c.tipo === filters.tipo))
      .filter((c) => (filters.localidade ? c.uf === filters.localidade : true))
      .filter((c) => {
        // Converter filtros de centavos para reais (MoneyInput trabalha com centavos)
        const valorMinimoReais = filters.valorMinimo / 100;
        const valorMaximoReais = filters.valorMaximo / 100;
        
        if (valorMinimoReais > 0 && c.valorTotal < valorMinimoReais) return false;
        if (valorMaximoReais > 0 && c.valorTotal > valorMaximoReais) return false;
        return true;
      })
      .filter((c) => {
        if (!filters.periodoInicio) return true;
        return new Date(c.dataInicio) >= new Date(filters.periodoInicio);
      })
      .filter((c) => {
        if (!filters.periodoFim || !c.dataTermino) return true;
        return new Date(c.dataTermino) <= new Date(filters.periodoFim);
      })
      .filter((c) =>
        filters.q
          ? `${c.codigo} ${c.nome} ${c.cliente} ${c.responsavel}`
              .toLowerCase()
              .includes(filters.q.toLowerCase())
          : true
      );

    // Ordenação
    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortConfig.key!];
        const bVal = b[sortConfig.key!];
        if (aVal === undefined) return 1;
        if (bVal === undefined) return -1;
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [contratos, filters, sortConfig]);

  // Métricas (baseadas nos dados filtrados)
  const counts = useMemo(() => {
    const total = filtered.length;
    const emExecucao = filtered.filter((c) => c.status === "EM_ANDAMENTO").length;
    const concluidos = filtered.filter((c) => c.status === "CONCLUIDO").length;
    const suspensos = filtered.filter((c) => c.status === "SUSPENSO").length;
    const valorTotal = filtered.reduce((acc, c) => acc + c.valorTotal, 0);
    const valorEmExecucao = filtered
      .filter((c) => c.status === "EM_ANDAMENTO")
      .reduce((acc, c) => acc + c.valorTotal, 0);
    return { total, emExecucao, concluidos, suspensos, valorTotal, valorEmExecucao };
  }, [filtered]);

  // Paginação
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const totalPages = Math.ceil(filtered.length / pageSize);

  // Handlers
  const handleSort = (key: keyof Contrato) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const clearFilters = () => {
    setFilters({
      govIf: "TODOS",
      status: "TODOS",
      parceiro: "",
      periodoInicio: "",
      periodoFim: "",
      q: "",
      orgaoFinanciador: "",
      segmento: "",
      tipo: "TODOS",
      localidade: "",
      valorMinimo: 0,
      valorMaximo: 0,
    });
    setPage(1);
  };

  const hasActiveFilters =
    filters.govIf !== "TODOS" ||
    filters.status !== "TODOS" ||
    filters.tipo !== "TODOS" ||
    filters.parceiro !== "" ||
    filters.orgaoFinanciador !== "" ||
    filters.segmento !== "" ||
    filters.localidade !== "" ||
    filters.valorMinimo > 0 ||
    filters.valorMaximo > 0 ||
    filters.periodoInicio !== "" ||
    filters.periodoFim !== "" ||
    filters.q !== "";

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
          <span className="text-gray-900 font-medium">Contratos</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contratos</h1>
            <p className="text-sm text-gray-500">Gestão unificada de Projetos e Produtos</p>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-modal', { detail: { modalName: 'novo-contrato' } }))}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Contrato
          </button>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Total de Contratos"
            value={counts.total}
            icon={FileText}
            color="#004225"
          />
          <MetricCard
            title="Em Execução"
            value={counts.emExecucao}
            icon={TrendingUp}
            color="#0B7A4B"
            subtitle={`R$ ${counts.valorEmExecucao.toLocaleString("pt-BR")}`}
          />
          <MetricCard
            title="Concluídos"
            value={counts.concluidos}
            icon={CheckCircle}
            color="#6D28D9"
          />
          <MetricCard
            title="Suspensos"
            value={counts.suspensos}
            icon={PauseCircle}
            color="#F59E0B"
          />
        </div>

        {/* Barra de Busca e Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          {/* Linha principal */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por código, nome, cliente ou responsável..."
                className="w-full h-10 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-transparent"
                value={filters.q}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, q: e.target.value }));
                  setPage(1);
                }}
              />
            </div>

            {/* Tabs de Gov/IF */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
              {(["TODOS", "IF", "Gov"] as const).map((govIf) => (
                <button
                  key={govIf}
                  onClick={() => {
                    setFilters((f) => ({ ...f, govIf }));
                    setPage(1);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    filters.govIf === govIf
                      ? "bg-[#004225] text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {govIf === "TODOS" ? "Todos" : govIf}
                </button>
              ))}
            </div>

            {/* Botão de filtros */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                showFilters || hasActiveFilters
                  ? "bg-[#004225] text-white border-[#004225]"
                  : "text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-white text-[#004225] rounded-full">
                  {
                    [
                      filters.govIf !== "TODOS",
                      filters.status !== "TODOS",
                      filters.tipo !== "TODOS",
                      filters.parceiro,
                      filters.orgaoFinanciador,
                      filters.segmento,
                      filters.localidade,
                      filters.valorMinimo > 0,
                      filters.valorMaximo > 0,
                      filters.periodoInicio,
                      filters.periodoFim,
                    ].filter(Boolean).length
                  }
                </span>
              )}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {/* Filtros expandidos */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                <select
                  className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                  value={filters.status}
                  onChange={(e) => {
                    setFilters((f) => ({ ...f, status: e.target.value as Filters["status"] }));
                    setPage(1);
                  }}
                >
                  <option value="TODOS">Todos os status</option>
                  <option value="EM_ANDAMENTO">Em Andamento</option>
                  <option value="CONCLUIDO">Concluído</option>
                  <option value="SUSPENSO">Suspenso</option>
                  <option value="EM_NEGOCIACAO">Em Negociação</option>
                  <option value="DRAFT">Rascunho</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </div>

              {/* Tipo de Contrato */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Tipo de Contrato</label>
                <select
                  className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                  value={filters.tipo}
                  onChange={(e) => {
                    setFilters((f) => ({ ...f, tipo: e.target.value as Filters["tipo"] }));
                    setPage(1);
                  }}
                >
                  <option value="TODOS">Todos os tipos</option>
                  <option value="PROJETO">Projeto</option>
                  <option value="PRODUTO">Produto</option>
                </select>
              </div>

              {/* Parceiro */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Parceiro</label>
                <select
                  className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                  value={filters.parceiro}
                  onChange={(e) => {
                    setFilters((f) => ({ ...f, parceiro: e.target.value }));
                    setPage(1);
                  }}
                >
                  <option value="">Todos os parceiros</option>
                  {parceiros.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Órgão Financiador */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Órgão Financiador</label>
                <select
                  className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                  value={filters.orgaoFinanciador}
                  onChange={(e) => {
                    setFilters((f) => ({ ...f, orgaoFinanciador: e.target.value }));
                    setPage(1);
                  }}
                >
                  <option value="">Todos os órgãos</option>
                  {orgaosFinanciadores.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              {/* Segmento do Contrato */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Segmento</label>
                <select
                  className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                  value={filters.segmento}
                  onChange={(e) => {
                    setFilters((f) => ({ ...f, segmento: e.target.value }));
                    setPage(1);
                  }}
                >
                  <option value="">Todos os segmentos</option>
                  {segmentos.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Localidade */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Localidade (UF)</label>
                <select
                  className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                  value={filters.localidade}
                  onChange={(e) => {
                    setFilters((f) => ({ ...f, localidade: e.target.value }));
                    setPage(1);
                  }}
                >
                  <option value="">Todas as localidades</option>
                  {localidades.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              {/* Valor Mínimo */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Valor mínimo
                </label>
                <MoneyInput
                  valueCents={filters.valorMinimo}
                  onValueChange={(value) => {
                    setFilters((f) => ({ ...f, valorMinimo: value }));
                    setPage(1);
                  }}
                  placeholder="R$ 0,00"
                  className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                />
              </div>

              {/* Valor Máximo */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Valor máximo
                </label>
                <MoneyInput
                  valueCents={filters.valorMaximo}
                  onValueChange={(value) => {
                    setFilters((f) => ({ ...f, valorMaximo: value }));
                    setPage(1);
                  }}
                  placeholder="R$ 0,00"
                  className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                />
              </div>
            </div>
          )}

          {/* Limpar filtros */}
          {hasActiveFilters && (
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X className="h-3 w-3" />
                Limpar filtros
              </button>
              <span className="text-xs text-gray-500">
                {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} encontrado
                {filtered.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <ResizableTable
            columnCount={10}
            defaultWidths={[
              120, // Código
              200, // Nome
              100, // Gov/IF
              100, // Tipo
              220, // Cliente / Parceiro
              140, // Valor Total
              130, // Status
              110, // Início
              110, // Término
              150, // Responsável
            ]}
            minColumnWidth={80}
            className="divide-y divide-gray-200"
          >
            <thead className="bg-gray-50">
              <tr>
                <Th onClick={() => handleSort("codigo")} sortable className="text-center">
                  Código
                  <SortIcon column="codigo" sortConfig={sortConfig} />
                </Th>
                <Th onClick={() => handleSort("nome")} sortable className="text-center">
                  Nome
                  <SortIcon column="nome" sortConfig={sortConfig} />
                </Th>
                <Th onClick={() => handleSort("govIf")} sortable className="text-center">
                  Gov/IF
                  <SortIcon column="govIf" sortConfig={sortConfig} />
                </Th>
                <Th className="text-center">Tipo</Th>
                <Th onClick={() => handleSort("cliente")} sortable className="text-center">
                  Cliente / Parceiro
                  <SortIcon column="cliente" sortConfig={sortConfig} />
                </Th>
                <Th onClick={() => handleSort("valorTotal")} sortable className="text-center">
                  Valor Total
                  <SortIcon column="valorTotal" sortConfig={sortConfig} />
                </Th>
                <Th className="text-center">Status</Th>
                <Th onClick={() => handleSort("dataInicio")} sortable className="text-center">
                  Início
                  <SortIcon column="dataInicio" sortConfig={sortConfig} />
                </Th>
                <Th onClick={() => handleSort("dataTermino")} sortable className="text-center">
                  Término
                  <SortIcon column="dataTermino" sortConfig={sortConfig} />
                </Th>
                <Th className="text-center">Responsável</Th>
              </tr>
            </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#004225]" />
                        <span className="text-sm text-gray-500">Carregando contratos...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <FileText className="h-12 w-12 text-gray-300" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Nenhum contrato encontrado
                          </p>
                          <p className="text-sm text-gray-500">
                            Tente ajustar os filtros ou criar um novo contrato.
                          </p>
                        </div>
                        <div className="flex gap-2 mt-2">
                          {hasActiveFilters && (
                            <button
                              onClick={clearFilters}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              Limpar filtros
                            </button>
                          )}
                          <button
                            onClick={() => window.dispatchEvent(new CustomEvent('open-modal', { detail: { modalName: 'novo-contrato' } }))}
                            className="px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319]"
                          >
                            Criar novo contrato
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((contrato) => (
                    <tr
                      key={contrato.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => (window.location.href = `/contratos/${contrato.id}`)}
                    >
                      <Td className="font-mono text-sm">{contrato.codigo}</Td>
                      <Td className="font-medium text-gray-900 max-w-[200px] truncate">
                        {contrato.nome}
                      </Td>
                      <Td>
                        <GovIfBadge govIf={contrato.govIf} />
                      </Td>
                      <Td>
                        <TipoBadge tipo={contrato.tipo} />
                      </Td>
                      <Td>
                        <div className="max-w-[180px]">
                          <p className="text-sm text-gray-900 truncate">{contrato.cliente}</p>
                          <p className="text-xs text-gray-500 truncate">{contrato.parceiro}</p>
                        </div>
                      </Td>
                      <Td className="text-right font-medium">
                        R$ {contrato.valorTotal.toLocaleString("pt-BR")}
                      </Td>
                      <Td>
                        <StatusBadge status={contrato.status} />
                      </Td>
                      <Td className="text-sm text-gray-600">{formatDate(contrato.dataInicio)}</Td>
                      <Td className="text-sm text-gray-600">
                        {contrato.dataTermino ? formatDate(contrato.dataTermino) : "—"}
                      </Td>
                      <Td className="text-sm text-gray-600">{contrato.responsavel}</Td>
                    </tr>
                  ))
                )}
              </tbody>
          </ResizableTable>

          {/* Paginação */}
          {!loading && filtered.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
              <span className="text-sm text-gray-600">
                Mostrando {(page - 1) * pageSize + 1} a{" "}
                {Math.min(page * pageSize, filtered.length)} de {filtered.length} contratos
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                          page === pageNum
                            ? "bg-[#004225] text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componentes auxiliares
function MetricCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div
          className="p-3 rounded-xl"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="h-6 w-6" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

function Th({
  children,
  className = "",
  onClick,
  sortable = false,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  sortable?: boolean;
}) {
  return (
    <th
      className={`px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider ${
        sortable ? "cursor-pointer hover:bg-gray-100 select-none" : ""
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-center gap-1">{children}</div>
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}

function SortIcon({ column, sortConfig }: { column: string; sortConfig: SortConfig }) {
  if (sortConfig.key !== column) {
    return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
  }
  return (
    <ArrowUpDown
      className={`h-3 w-3 text-[#004225] ${sortConfig.direction === "desc" ? "rotate-180" : ""}`}
    />
  );
}

function StatusBadge({ status }: { status: ContratoStatus }) {
  const config: Record<ContratoStatus, { bg: string; text: string; label: string }> = {
    EM_ANDAMENTO: { bg: "bg-blue-100", text: "text-blue-800", label: "Em Andamento" },
    CONCLUIDO: { bg: "bg-green-100", text: "text-green-800", label: "Concluído" },
    SUSPENSO: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Suspenso" },
    DRAFT: { bg: "bg-gray-100", text: "text-gray-800", label: "Rascunho" },
    CANCELADO: { bg: "bg-red-100", text: "text-red-800", label: "Cancelado" },
    EM_NEGOCIACAO: { bg: "bg-purple-100", text: "text-purple-800", label: "Em Negociação" },
  };

  const { bg, text, label } = config[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}
    >
      {label}
    </span>
  );
}

function GovIfBadge({ govIf }: { govIf: "IF" | "Gov" }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        govIf === "IF"
          ? "bg-blue-100 text-blue-800"
          : "bg-purple-100 text-purple-800"
      }`}
    >
      {govIf}
    </span>
  );
}

function TipoBadge({ tipo }: { tipo: ContratoTipo }) {
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
