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
  Clock,
  XCircle,
  Download,
} from "lucide-react";
import { ResizableTable } from "@/components/ui/resizable-table";
import { MoneyInput } from "./[contratoId]/desembolso/_components/MoneyImput";
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";
import * as XLSX from "xlsx";
import type { ProjectStatus } from "../../../types/api_gopro_java/projects";
import { getOrganizationsParceiras, getOrganizationsFinanciadoras } from "./mockData";

// Tipos
type ContratoTipo = "PROJETO" | "PRODUTO";

// Configuração centralizada dos status (fonte única de verdade)
const STATUS_CONFIG = {
  0: {
    label: "Pré-Projeto",
    stringKeys: ["PRE_PROJETO"],
    bg: "bg-gray-100",
    text: "text-gray-800",
  },
  1: {
    label: "Execução",
    stringKeys: ["EM_EXECUCAO", "EM_ANDAMENTO"],
    bg: "bg-blue-100",
    text: "text-blue-800",
  },
  2: {
    label: "Concluído",
    stringKeys: ["CONCLUIDO"],
    bg: "bg-green-100",
    text: "text-green-800",
  },
  3: {
    label: "Suspenso",
    stringKeys: ["SUSPENSO"],
    bg: "bg-yellow-100",
    text: "text-yellow-800",
  },
  4: {
    label: "Cancelado",
    stringKeys: ["CANCELADO"],
    bg: "bg-red-100",
    text: "text-red-800",
  },
} as const;

// Funções auxiliares usando a configuração centralizada
const getStatusLabel = (status: ProjectStatus): string => {
  return STATUS_CONFIG[status].label;
};

const getStatusFromString = (status: string): ProjectStatus | null => {
  for (const [key, config] of Object.entries(STATUS_CONFIG)) {
    if ((config.stringKeys as readonly string[]).includes(status)) {
      return Number(key) as ProjectStatus;
    }
  }
  return null;
};

type Contrato = {
  id: string;
  codigo: string;
  nome: string;
  govIf: "IF" | "Gov";
  tipo: ContratoTipo;
  clientePrimario: string;
  clienteSecundario?: string;
  parceiroPrimario: string;
  parceiroSecundario?: string;
  segmentos: string[];
  status: ProjectStatus;
  valorTotal: number;
  dataInicio: string;
  dataTermino?: string;
  dataInicioEfetivo?: string;
  dataFimEfetivo?: string;
  coordenador: string;
  localidade: string;
  scope: string;
};

type Filters = {
  govIf: "TODOS" | "IF" | "Gov";
  status: "TODOS" | ProjectStatus;
  parceiroPrimario: string;
  clientePrimario: string;
  periodoInicio: string;
  periodoFim: string;
  q: string;
  segmento: string;
  tipo: "TODOS" | ContratoTipo;
  localidade: string;
  valorMinimo: number;
  valorMaximo: number;
  coordenador: string;
};

type SortConfig = {
  key: keyof Contrato | null;
  direction: "asc" | "desc";
};

// Segmentos alinhados com o formulário de cadastro
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

// Mock de dados atualizado com nova estrutura
const mockContratos: Contrato[] = [
  {
    id: "1",
    codigo: "PRJ-001",
    nome: "Sistema de Gestão Integrada",
    govIf: "IF",
    tipo: "PROJETO",
    clientePrimario: "CNPq - Conselho Nacional de Desenvolvimento Científico e Tecnológico",
    clienteSecundario: "CAPES - Coordenação de Aperfeiçoamento de Pessoal de Nível Superior",
    parceiroPrimario: "Fundação de Apoio à Pesquisa",
    parceiroSecundario: "FAPTO - Fundação de Apoio à Pesquisa do Tocantins",
    segmentos: ["Tecnologia", "Ciência"],
    status: 1, // EM_EXECUCAO
    valorTotal: 1250000,
    dataInicio: "2025-01-15",
    dataTermino: "2025-12-31",
    dataInicioEfetivo: "2025-02-01",
    coordenador: "João Silva",
    localidade: "São Paulo - SP",
    scope: "Desenvolvimento de sistema integrado de gestão para pesquisas científicas",
  },
  {
    id: "2",
    codigo: "PRD-010",
    nome: "Licença GoPro Enterprise",
    govIf: "Gov",
    tipo: "PRODUTO",
    clientePrimario: "Prefeitura de São Paulo",
    parceiroPrimario: "Fundação XYZ",
    segmentos: ["Tecnologia", "Cidades"],
    status: 2, // CONCLUIDO
    valorTotal: 240000,
    dataInicio: "2025-03-01",
    dataTermino: "2025-09-01",
    dataInicioEfetivo: "2025-03-15",
    dataFimEfetivo: "2025-08-30",
    coordenador: "Maria Santos",
    localidade: "Rio de Janeiro - RJ",
    scope: "Licenciamento e implantação do sistema GoPro Enterprise para gestão municipal",
  },
  {
    id: "3",
    codigo: "PRJ-015",
    nome: "Portal de Transparência",
    govIf: "IF",
    tipo: "PROJETO",
    clientePrimario: "MEC - Ministério da Educação",
    parceiroPrimario: "IFES-MG - Instituto Federal de Educação, Ciência e Tecnologia de Minas Gerais",
    parceiroSecundario: "Fundação Araucária",
    segmentos: ["Educação", "Tecnologia"],
    status: 3, // SUSPENSO
    valorTotal: 800000,
    dataInicio: "2025-06-20",
    coordenador: "Carlos Oliveira",
    localidade: "Belo Horizonte - MG",
    scope: "Desenvolvimento de portal web para transparência de dados educacionais",
  },
  {
    id: "4",
    codigo: "PRJ-020",
    nome: "Modernização de Infraestrutura",
    govIf: "Gov",
    tipo: "PROJETO",
    clientePrimario: "Governo do Estado de São Paulo",
    clienteSecundario: "MEC - Ministério da Educação",
    parceiroPrimario: "Fundação Araucária",
    segmentos: ["Tecnologia", "Educação"],
    status: 1, // EM_EXECUCAO
    valorTotal: 2100000,
    dataInicio: "2025-02-01",
    dataTermino: "2026-06-30",
    dataInicioEfetivo: "2025-02-15",
    coordenador: "Ana Costa",
    localidade: "Curitiba - PR",
    scope: "Projeto de modernização da infraestrutura tecnológica de instituições de ensino",
  },
  {
    id: "5",
    codigo: "PRD-025",
    nome: "Suporte Premium Anual",
    govIf: "IF",
    tipo: "PRODUTO",
    clientePrimario: "CAPES - Coordenação de Aperfeiçoamento de Pessoal de Nível Superior",
    parceiroPrimario: "Fundação UFRGS",
    segmentos: ["Educação", "Ciência"],
    status: 0, // PRE_PROJETO
    valorTotal: 180000,
    dataInicio: "2025-04-01",
    coordenador: "Pedro Mendes",
    localidade: "Porto Alegre - RS",
    scope: "Contrato de suporte técnico premium para sistemas acadêmicos",
  },
];

// Extrair lista de coordenadores e localidades dos contratos
const coordenadores = [...new Set(mockContratos.map((c) => c.coordenador))];
const localidades = [...new Set(mockContratos.map((c) => c.localidade))];

export default function ContratosPage() {
  const [filters, setFilters] = useState<Filters>({
    govIf: "TODOS",
    status: "TODOS",
    parceiroPrimario: "",
    clientePrimario: "",
    periodoInicio: "",
    periodoFim: "",
    q: "",
    segmento: "",
    tipo: "TODOS",
    localidade: "",
    valorMinimo: 0,
    valorMaximo: 0,
    coordenador: "",
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

  // Opções para os dropdowns de filtros
  const statusDropdownOptions: DropdownOption[] = useMemo(() => [
    { value: "TODOS", label: "Todos os status" },
    { value: "0", label: "Pré-Projeto" },
    { value: "1", label: "Execução" },
    { value: "2", label: "Concluído" },
    { value: "3", label: "Suspenso" },
    { value: "4", label: "Cancelado" },
  ], []);

  const tipoDropdownOptions: DropdownOption[] = useMemo(() => [
    { value: "TODOS", label: "Todos os tipos" },
    { value: "PROJETO", label: "Projeto" },
    { value: "PRODUTO", label: "Produto" },
  ], []);

  const parceiroDropdownOptions: DropdownOption[] = useMemo(() => [
    { value: "", label: "Todos os parceiros" },
    ...getOrganizationsParceiras().map(org => ({
      value: org.name,
      label: org.name,
    })),
  ], []);

  const clienteDropdownOptions: DropdownOption[] = useMemo(() => [
    { value: "", label: "Todos os clientes" },
    ...getOrganizationsFinanciadoras().map(org => ({
      value: org.name,
      label: org.name,
    })),
  ], []);

  const segmentoDropdownOptions: DropdownOption[] = useMemo(() => [
    { value: "", label: "Todos os segmentos" },
    ...segmentoOptions.map(seg => ({
      value: seg,
      label: seg,
    })),
  ], []);

  const coordenadorDropdownOptions: DropdownOption[] = useMemo(() => [
    { value: "", label: "Todos os coordenadores" },
    ...coordenadores.map(coord => ({
      value: coord,
      label: coord,
    })),
  ], []);

  const localidadeDropdownOptions: DropdownOption[] = useMemo(() => [
    { value: "", label: "Todas as localidades" },
    ...localidades.map(loc => ({
      value: loc,
      label: loc,
    })),
  ], []);

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
      
      // Buscar nomes das organizações
      const parceiros = getOrganizationsParceiras();
      const clientes = getOrganizationsFinanciadoras();
      const parceiroPrimario = parceiros.find(p => p.id === data.parceiroId)?.name || "";
      const parceiroSecundario = data.parceiroSecundarioId ? parceiros.find(p => p.id === data.parceiroSecundarioId)?.name : undefined;
      const clientePrimario = clientes.find(c => c.id === data.clientePrimarioId)?.name || "";
      const clienteSecundario = data.clienteSecundarioId ? clientes.find(c => c.id === data.clienteSecundarioId)?.name : undefined;
      
      // Cria o novo contrato com os dados recebidos
      const novoContrato: Contrato = {
        id: String(Date.now()),
        codigo: data.tipo === "PROJETO" ? `PRJ-${String(contratos.length + 1).padStart(3, "0")}` : `PRD-${String(contratos.length + 1).padStart(3, "0")}`,
        nome: data.titulo,
        govIf: data.govIf || "IF",
        tipo: data.tipo as ContratoTipo,
        clientePrimario,
        clienteSecundario,
        parceiroPrimario,
        parceiroSecundario,
        segmentos: typeof data.segmentos === "string" ? data.segmentos.split(", ") : data.segmentos || [],
        status: getStatusFromString(data.status) ?? 0, // Default para PRE_PROJETO se não encontrar
        valorTotal: data.contract_value || 0,
        dataInicio: data.dataInicio,
        dataTermino: data.dataFim || undefined,
        dataInicioEfetivo: data.dataInicioEfetivo || undefined,
        dataFimEfetivo: data.dataFimEfetivo || undefined,
        coordenador: data.coordenador,
        localidade: data.localidade,
        scope: data.scope || "",
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
      .filter((c) => (filters.parceiroPrimario ? c.parceiroPrimario === filters.parceiroPrimario : true))
      .filter((c) => (filters.clientePrimario ? c.clientePrimario === filters.clientePrimario : true))
      .filter((c) => (filters.segmento ? c.segmentos.includes(filters.segmento) : true))
      .filter((c) => (filters.tipo === "TODOS" ? true : c.tipo === filters.tipo))
      .filter((c) => (filters.localidade ? c.localidade === filters.localidade : true))
      .filter((c) => (filters.coordenador ? c.coordenador === filters.coordenador : true))
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
          ? `${c.codigo} ${c.nome} ${c.clientePrimario} ${c.coordenador} ${c.parceiroPrimario} ${c.scope}`
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
    const emExecucao = filtered.filter((c) => c.status === 1).length; // EM_EXECUCAO
    const concluidos = filtered.filter((c) => c.status === 2).length; // CONCLUIDO
    const suspensos = filtered.filter((c) => c.status === 3).length; // SUSPENSO
    const preProjetos = filtered.filter((c) => c.status === 0).length; // PRE_PROJETO
    const cancelados = filtered.filter((c) => c.status === 4).length; // CANCELADO
    const valorTotal = filtered.reduce((acc, c) => acc + c.valorTotal, 0);
    const valorEmExecucao = filtered
      .filter((c) => c.status === 1) // EM_EXECUCAO
      .reduce((acc, c) => acc + c.valorTotal, 0);
    const valorConcluidos = filtered
      .filter((c) => c.status === 2) // CONCLUIDO
      .reduce((acc, c) => acc + c.valorTotal, 0);
    const valorSuspensos = filtered
      .filter((c) => c.status === 3) // SUSPENSO
      .reduce((acc, c) => acc + c.valorTotal, 0);
    const valorPreProjetos = filtered
      .filter((c) => c.status === 0) // PRE_PROJETO
      .reduce((acc, c) => acc + c.valorTotal, 0);
    const valorCancelados = filtered
      .filter((c) => c.status === 4) // CANCELADO
      .reduce((acc, c) => acc + c.valorTotal, 0);
    return { total, emExecucao, concluidos, suspensos, preProjetos, cancelados, valorTotal, valorEmExecucao, valorConcluidos, valorSuspensos, valorPreProjetos, valorCancelados };
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
      parceiroPrimario: "",
      clientePrimario: "",
      periodoInicio: "",
      periodoFim: "",
      q: "",
      segmento: "",
      tipo: "TODOS",
      localidade: "",
      valorMinimo: 0,
      valorMaximo: 0,
      coordenador: "",
    });
    setPage(1);
  };

  const hasActiveFilters =
    filters.govIf !== "TODOS" ||
    filters.status !== "TODOS" ||
    filters.tipo !== "TODOS" ||
    filters.parceiroPrimario !== "" ||
    filters.clientePrimario !== "" ||
    filters.segmento !== "" ||
    filters.localidade !== "" ||
    filters.coordenador !== "" ||
    filters.valorMinimo > 0 ||
    filters.valorMaximo > 0 ||
    filters.periodoInicio !== "" ||
    filters.periodoFim !== "" ||
    filters.q !== "";

  // Função para exportar para Excel
  const exportToExcel = () => {
    // Preparar dados para exportação
    const exportData = filtered.map((contrato) => ({
      Código: contrato.codigo,
      Nome: contrato.nome,
      "Gov/IF": contrato.govIf,
      Tipo: contrato.tipo === "PROJETO" ? "Projeto" : "Produto",
      "Cliente Primário": contrato.clientePrimario,
      "Cliente Secundário": contrato.clienteSecundario || "—",
      "Parceiro Primário": contrato.parceiroPrimario,
      "Parceiro Secundário": contrato.parceiroSecundario || "—",
      "Valor Total": `R$ ${contrato.valorTotal.toLocaleString("pt-BR")}`,
      Status: getStatusLabel(contrato.status),
      Início: formatDate(contrato.dataInicio),
      Término: contrato.dataTermino ? formatDate(contrato.dataTermino) : "—",
      "Início Efetivo": contrato.dataInicioEfetivo ? formatDate(contrato.dataInicioEfetivo) : "—",
      "Fim Efetivo": contrato.dataFimEfetivo ? formatDate(contrato.dataFimEfetivo) : "—",
      Coordenador: contrato.coordenador,
      Localidade: contrato.localidade,
      Segmentos: contrato.segmentos.join(", "),
    }));

    // Criar workbook e worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 12 }, // Código
      { wch: 35 }, // Nome
      { wch: 8 },  // Gov/IF
      { wch: 10 }, // Tipo
      { wch: 40 }, // Cliente Primário
      { wch: 30 }, // Cliente Secundário
      { wch: 35 }, // Parceiro Primário
      { wch: 30 }, // Parceiro Secundário
      { wch: 18 }, // Valor Total
      { wch: 12 }, // Status
      { wch: 12 }, // Início
      { wch: 12 }, // Término
      { wch: 12 }, // Início Efetivo
      { wch: 12 }, // Fim Efetivo
      { wch: 25 }, // Coordenador
      { wch: 20 }, // Localidade
      { wch: 30 }, // Segmentos
    ];
    ws["!cols"] = colWidths;

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, "Contratos");

    // Salvar arquivo
    XLSX.writeFile(wb, "Planilha de Contratos.xlsx");
  };

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
          <div className="flex flex-wrap gap-2">
            <Link
              href="/contratos/novo-contrato"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Novo Contrato
            </Link>
          </div>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <MetricCard
            title="Total"
            value={counts.total}
            icon={FileText}
            color="#004225"
            subtitle={`R$ ${counts.valorTotal.toLocaleString("pt-BR")}`}
          />
          <MetricCard
            title="Pré-Projetos"
            value={counts.preProjetos}
            icon={Clock}
            color="#3B82F6"
            subtitle={`R$ ${counts.valorPreProjetos.toLocaleString("pt-BR")}`}
          />
          <MetricCard
            title="Execução"
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
            subtitle={`R$ ${counts.valorConcluidos.toLocaleString("pt-BR")}`}
          />
          <MetricCard
            title="Suspensos"
            value={counts.suspensos}
            icon={PauseCircle}
            color="#F59E0B"
            subtitle={`R$ ${counts.valorSuspensos.toLocaleString("pt-BR")}`}
          />
          <MetricCard
            title="Cancelados"
            value={counts.cancelados}
            icon={XCircle}
            color="#EF4444"
            subtitle={`R$ ${counts.valorCancelados.toLocaleString("pt-BR")}`}
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
                      filters.parceiroPrimario,
                      filters.clientePrimario,
                      filters.segmento,
                      filters.localidade,
                      filters.coordenador,
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
                <Dropdown
                  options={statusDropdownOptions}
                  value={filters.status === "TODOS" ? "TODOS" : String(filters.status)}
                  placeholder="Todos os status"
                  searchable={true}
                  onChange={(value) => {
                    setFilters((f) => ({ 
                      ...f, 
                      status: value === undefined || value === "TODOS" ? "TODOS" : (Number(value) as ProjectStatus)
                    }));
                    setPage(1);
                  }}
                />
              </div>

              {/* Tipo de Contrato */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Tipo de Contrato</label>
                <Dropdown
                  options={tipoDropdownOptions}
                  value={filters.tipo}
                  placeholder="Todos os tipos"
                  searchable={true}
                  onChange={(value) => {
                    setFilters((f) => ({ 
                      ...f, 
                      tipo: (value || "TODOS") as Filters["tipo"]
                    }));
                    setPage(1);
                  }}
                />
              </div>

              {/* Parceiro Primário */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Parceiro Primário</label>
                <Dropdown
                  options={parceiroDropdownOptions}
                  value={filters.parceiroPrimario || undefined}
                  placeholder="Todos os parceiros"
                  searchable={true}
                  onChange={(value) => {
                    setFilters((f) => ({ ...f, parceiroPrimario: value || "" }));
                    setPage(1);
                  }}
                />
              </div>

              {/* Cliente Primário */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Cliente Primário</label>
                <Dropdown
                  options={clienteDropdownOptions}
                  value={filters.clientePrimario || undefined}
                  placeholder="Todos os clientes"
                  searchable={true}
                  onChange={(value) => {
                    setFilters((f) => ({ ...f, clientePrimario: value || "" }));
                    setPage(1);
                  }}
                />
              </div>

              {/* Segmento do Contrato */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Segmento</label>
                <Dropdown
                  options={segmentoDropdownOptions}
                  value={filters.segmento || undefined}
                  placeholder="Todos os segmentos"
                  searchable={true}
                  onChange={(value) => {
                    setFilters((f) => ({ ...f, segmento: value || "" }));
                    setPage(1);
                  }}
                />
              </div>

              {/* Coordenador */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Coordenador</label>
                <Dropdown
                  options={coordenadorDropdownOptions}
                  value={filters.coordenador || undefined}
                  placeholder="Todos os coordenadores"
                  searchable={true}
                  onChange={(value) => {
                    setFilters((f) => ({ ...f, coordenador: value || "" }));
                    setPage(1);
                  }}
                />
              </div>

              {/* Localidade */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Localidade</label>
                <Dropdown
                  options={localidadeDropdownOptions}
                  value={filters.localidade || undefined}
                  placeholder="Todas as localidades"
                  searchable={true}
                  onChange={(value) => {
                    setFilters((f) => ({ ...f, localidade: value || "" }));
                    setPage(1);
                  }}
                />
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-h-[800px] overflow-y-auto">
          <ResizableTable
            columnCount={10}
            defaultWidths={[
              120, // Código
              290, // Nome
              100, // Gov/IF
              100, // Tipo
              220, // Cliente / Parceiro
              140, // Valor Total
              130, // Status
              110, // Início
              110, // Término
              200, // Responsável
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
                <Th onClick={() => handleSort("clientePrimario")} sortable className="text-center">
                  Cliente / Parceiro
                  <SortIcon column="clientePrimario" sortConfig={sortConfig} />
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
                <Th onClick={() => handleSort("coordenador")} sortable className="text-center">
                  Coordenador
                  <SortIcon column="coordenador" sortConfig={sortConfig} />
                </Th>
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
                          <Link
                            href="/contratos/novo-contrato"
                            className="px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319]"
                          >
                            Criar novo contrato
                          </Link>
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
                      <Td className="font-mono text-sm text-center">{contrato.codigo}</Td>
                      <Td className="font-medium text-gray-900 max-w-[200px] truncate">
                        {contrato.nome}
                      </Td>
                      <Td className="text-center">
                        <GovIfBadge govIf={contrato.govIf} />
                      </Td>
                      <Td className="text-center">
                        <TipoBadge tipo={contrato.tipo} />
                      </Td>
                      <Td>
                        <div className="max-w-[180px]">
                          <p className="text-sm text-gray-900 truncate">{contrato.clientePrimario}</p>
                          <p className="text-xs text-gray-500 truncate">{contrato.parceiroPrimario}</p>
                        </div>
                      </Td>
                      <Td className="text-center font-medium">
                        R$ {contrato.valorTotal.toLocaleString("pt-BR")}
                      </Td>
                      <Td className="text-center">
                        <StatusBadge status={contrato.status} />
                      </Td>
                      <Td className="text-sm text-gray-600 text-center">{formatDate(contrato.dataInicio)}</Td>
                      <Td className="text-sm text-gray-600 text-center">
                        {contrato.dataTermino ? formatDate(contrato.dataTermino) : "—"}
                      </Td>
                      <Td className="text-sm text-gray-600">{contrato.coordenador}</Td>
                    </tr>
                  ))
                )}
              </tbody>
          </ResizableTable>

          {/* Paginação */}
          {!loading && filtered.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={exportToExcel}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                Exportar Excel
              </button>
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <Icon className="h-6 w-6" style={{ color }} />
          <p className="text-base font-semibold text-gray-600">{title}</p>
        </div>
        <p className="text-4xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-base font-medium text-gray-600">{subtitle}</p>}
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

function StatusBadge({ status }: { status: ProjectStatus }) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
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
