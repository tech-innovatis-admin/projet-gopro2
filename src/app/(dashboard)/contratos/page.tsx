"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  listAllPublicAgencies,
  listPartners,
  listPeople,
  listProjects,
} from "@/src/lib/api/endpoints";
import { getUserErrorMessage } from "@/src/lib/feedback/user-messages";
import {
  type ProjectResponseDTO,
  type ProjectStatusEnum,
} from "@/src/lib/api/types";
import { compareDateOnly, formatDateOnlyToPtBr, isDateOnly } from "@/src/lib/date-only";

// Tipos
type ContratoTipo = "PROJETO" | "PRODUTO";
type ProjectStatus = ProjectStatusEnum;
type MetricCardToneKey =
  | "TOTAL"
  | "PRE_PROJETO"
  | "PLANEJAMENTO"
  | "EXECUCAO"
  | "FINALIZADO"
  | "SUSPENSO";

// Configuracao centralizada dos status (fonte unica de verdade)
const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; bg: string; text: string }
> = {
  PRE_PROJETO: {
    label: "Pre-Projeto",
    bg: "bg-gray-100",
    text: "text-gray-800",
  },
  PLANEJAMENTO: {
    label: "Planejamento",
    bg: "bg-slate-100",
    text: "text-slate-800",
  },
  EXECUCAO: {
    label: "Execucao",
    bg: "bg-blue-100",
    text: "text-blue-800",
  },
  FINALIZADO: {
    label: "Finalizado",
    bg: "bg-green-100",
    text: "text-green-800",
  },
  SUSPENSO: {
    label: "Suspenso",
    bg: "bg-yellow-100",
    text: "text-yellow-800",
  },
};

// Funcoes auxiliares usando a configuracao centralizada
const getStatusLabel = (status: ProjectStatus): string => {
  return STATUS_CONFIG[status].label;
};

type MetricCardTone = {
  accent: string;
  iconBg: string;
  iconColor: string;
  valueColor: string;
  border: string;
};

const CARD_TONE_BY_STATUS: Record<MetricCardToneKey, MetricCardTone> = {
  PRE_PROJETO: {
    accent: "bg-sky-500",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-700",
    valueColor: "text-sky-800",
    border: "border-sky-100 hover:border-sky-200",
  },
  PLANEJAMENTO: {
    accent: "bg-amber-500",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-700",
    valueColor: "text-amber-800",
    border: "border-amber-100 hover:border-amber-200",
  },
  EXECUCAO: {
    accent: "bg-orange-500",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-700",
    valueColor: "text-orange-800",
    border: "border-orange-100 hover:border-orange-200",
  },
  FINALIZADO: {
    accent: "bg-emerald-500",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
    valueColor: "text-emerald-800",
    border: "border-emerald-100 hover:border-emerald-200",
  },
  SUSPENSO: {
    accent: "bg-rose-500",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-700",
    valueColor: "text-rose-800",
    border: "border-rose-100 hover:border-rose-200",
  },
  TOTAL: {
    accent: "bg-zinc-500",
    iconBg: "bg-zinc-100",
    iconColor: "text-zinc-700",
    valueColor: "text-zinc-800",
    border: "border-zinc-200 hover:border-zinc-300",
  },
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
  dataCriacao: string;
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

type FilterOptions = {
  ignoreStatus?: boolean;
};

// Segmentos alinhados com o formulario de cadastro
const segmentoOptions = [
  "Educacao",
  "Saude",
  "Cidades",
  "Meio Ambiente",
  "Tecnologia",
  "Turismo",
  "Social",
  "Economia",
  "Cultura",
  "Ciencia",
  "Esporte",
  "Agricultura",
  "Outro",
];

const NO_INFO_LABEL = "Não informado";
const API_PAGE_SIZE = 20;

async function fetchAllPages<T>(
  fetchPage: (params: { page: number; size: number }) => Promise<{
    content: T[];
    totalPages: number;
  }>
): Promise<T[]> {
  const firstPage = await fetchPage({ page: 0, size: API_PAGE_SIZE });
  const requests = Array.from({ length: Math.max(0, firstPage.totalPages - 1) }, (_, index) =>
    fetchPage({ page: index + 1, size: API_PAGE_SIZE })
  );
  const otherPages = await Promise.all(requests);

  return [firstPage, ...otherPages].flatMap((pageResponse) => pageResponse.content);
}

function normalizeMoneyValue(value: number | string | null | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function normalizeSegments(value: string | null): string[] {
  if (!value || !value.trim()) {
    return [];
  }

  return value
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function normalizeLocation(
  city: string | null,
  state: string | null,
  executionLocation: string | null
): string {
  if (city && state) {
    return `${city} - ${state}`;
  }
  if (city) {
    return city;
  }
  if (state) {
    return state;
  }
  if (executionLocation && executionLocation.trim()) {
    return executionLocation.trim();
  }
  return NO_INFO_LABEL;
}

function mapProjectToContrato(
  project: ProjectResponseDTO,
  partnersById: Record<number, string>,
  clientsById: Record<number, string>,
  peopleById: Record<number, string>
): Contrato {
  const codigo = project.code || `PROJ-${project.id}`;
  const govIf = project.projectGovIf === "GOV" ? "Gov" : "IF";
  const tipo: ContratoTipo = project.projectType === "PRODUTO" ? "PRODUTO" : "PROJETO";
  const parceiroPrimario = project.primaryPartnerId
    ? (partnersById[project.primaryPartnerId] ?? NO_INFO_LABEL)
    : NO_INFO_LABEL;
  const parceiroSecundario = project.secundaryPartnerId
    ? (partnersById[project.secundaryPartnerId] ?? undefined)
    : undefined;
  const clientePrimario = project.primaryClientId
    ? (clientsById[project.primaryClientId] ?? NO_INFO_LABEL)
    : NO_INFO_LABEL;
  const clienteSecundario = project.secundaryClientId
    ? (clientsById[project.secundaryClientId] ?? undefined)
    : undefined;
  const coordenador = project.cordinatorId
    ? (peopleById[project.cordinatorId] ?? `Pessoa #${project.cordinatorId}`)
    : NO_INFO_LABEL;

  return {
    id: String(project.id),
    codigo,
    nome: project.name,
    govIf,
    tipo,
    clientePrimario,
    clienteSecundario,
    parceiroPrimario,
    parceiroSecundario,
    segmentos: normalizeSegments(project.areaSegmento),
    status: project.projectStatus,
    valorTotal: normalizeMoneyValue(project.contractValue),
    dataCriacao: project.createdAt ?? "",
    dataInicio: project.startDate ?? project.openingDate ?? "",
    dataTermino: project.endDate ?? project.closingDate ?? undefined,
    dataInicioEfetivo: project.openingDate ?? undefined,
    dataFimEfetivo: project.closingDate ?? undefined,
    coordenador,
    localidade: normalizeLocation(project.city, project.state, project.executionLocation),
    scope: project.object,
  };
}

function matchesContratoFilters(
  contrato: Contrato,
  filters: Filters,
  options: FilterOptions = {}
): boolean {
  const { ignoreStatus = false } = options;

  if (filters.govIf !== "TODOS" && contrato.govIf !== filters.govIf) {
    return false;
  }

  if (!ignoreStatus && filters.status !== "TODOS" && contrato.status !== filters.status) {
    return false;
  }

  if (filters.parceiroPrimario && contrato.parceiroPrimario !== filters.parceiroPrimario) {
    return false;
  }

  if (filters.clientePrimario && contrato.clientePrimario !== filters.clientePrimario) {
    return false;
  }

  if (filters.segmento && !contrato.segmentos.includes(filters.segmento)) {
    return false;
  }

  if (filters.tipo !== "TODOS" && contrato.tipo !== filters.tipo) {
    return false;
  }

  if (filters.localidade && contrato.localidade !== filters.localidade) {
    return false;
  }

  if (filters.coordenador && contrato.coordenador !== filters.coordenador) {
    return false;
  }

  const valorMinimoReais = filters.valorMinimo / 100;
  const valorMaximoReais = filters.valorMaximo / 100;
  if (valorMinimoReais > 0 && contrato.valorTotal < valorMinimoReais) {
    return false;
  }
  if (valorMaximoReais > 0 && contrato.valorTotal > valorMaximoReais) {
    return false;
  }

  if (
    filters.periodoInicio &&
    isDateOnly(contrato.dataInicio) &&
    compareDateOnly(contrato.dataInicio, filters.periodoInicio) < 0
  ) {
    return false;
  }

  if (
    filters.periodoFim &&
    contrato.dataTermino &&
    isDateOnly(contrato.dataTermino) &&
    compareDateOnly(contrato.dataTermino, filters.periodoFim) > 0
  ) {
    return false;
  }

  if (filters.q) {
    const haystack =
      `${contrato.codigo} ${contrato.nome} ${contrato.clientePrimario} ${contrato.coordenador} ${contrato.parceiroPrimario} ${contrato.scope}`.toLowerCase();

    if (!haystack.includes(filters.q.toLowerCase())) {
      return false;
    }
  }

  return true;
}

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
    key: "dataCriacao",
    direction: "desc",
  });
  const [loading, setLoading] = useState(false);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [availablePartners, setAvailablePartners] = useState<string[]>([]);
  const [availableClients, setAvailableClients] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const statusParam = params.get("status");
    const nextStatus: Filters["status"] =
      statusParam &&
      ["PRE_PROJETO", "PLANEJAMENTO", "EXECUCAO", "FINALIZADO", "SUSPENSO"].includes(statusParam)
        ? (statusParam as ProjectStatus)
        : "TODOS";

    setFilters((previous) =>
      previous.status === nextStatus ? previous : { ...previous, status: nextStatus }
    );
    setPage(1);
  }, []);

  // Opcoes para os dropdowns de filtros
  const statusDropdownOptions: DropdownOption[] = useMemo(() => [
    { value: "TODOS", label: "Todos os status" },
    { value: "PRE_PROJETO", label: "Pre-Projeto" },
    { value: "PLANEJAMENTO", label: "Planejamento" },
    { value: "EXECUCAO", label: "Execucao" },
    { value: "FINALIZADO", label: "Finalizado" },
    { value: "SUSPENSO", label: "Suspenso" },
  ], []);

  const tipoDropdownOptions: DropdownOption[] = useMemo(() => [
    { value: "TODOS", label: "Todos os tipos" },
    { value: "PROJETO", label: "Projeto" },
    { value: "PRODUTO", label: "Produto" },
  ], []);

  const parceiroDropdownOptions: DropdownOption[] = useMemo(() => [
    { value: "", label: "Todos os parceiros" },
    ...availablePartners.map((name) => ({
      value: name,
      label: name,
    })),
  ], [availablePartners]);

  const clienteDropdownOptions: DropdownOption[] = useMemo(() => [
    { value: "", label: "Todos os clientes" },
    ...availableClients.map((name) => ({
      value: name,
      label: name,
    })),
  ], [availableClients]);

  const segmentoDropdownOptions: DropdownOption[] = useMemo(() => [
    { value: "", label: "Todos os segmentos" },
    ...segmentoOptions.map(seg => ({
      value: seg,
      label: seg,
    })),
  ], []);

  const coordenadores = useMemo(
    () =>
      [...new Set(contratos.map((contrato) => contrato.coordenador).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b)
      ),
    [contratos]
  );

  const localidades = useMemo(
    () =>
      [...new Set(contratos.map((contrato) => contrato.localidade).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b)
      ),
    [contratos]
  );

  const coordenadorDropdownOptions: DropdownOption[] = useMemo(() => [
    { value: "", label: "Todos os coordenadores" },
    ...coordenadores.map(coord => ({
      value: coord,
      label: coord,
    })),
  ], [coordenadores]);

  const localidadeDropdownOptions: DropdownOption[] = useMemo(() => [
    { value: "", label: "Todas as localidades" },
    ...localidades.map(loc => ({
      value: loc,
      label: loc,
    })),
  ], [localidades]);

  const loadContratos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [allProjects, allPartners, clientsPage, allPeople] = await Promise.all([
        fetchAllPages(listProjects),
        fetchAllPages(listPartners),
        listAllPublicAgencies(100),
        fetchAllPages(listPeople),
      ]);

      const partnersById: Record<number, string> = {};
      allPartners.forEach((partner) => {
        partnersById[partner.id] = partner.name;
      });

      const clientsById: Record<number, string> = {};
      clientsPage.forEach((agency) => {
        clientsById[agency.id] = agency.name;
      });

      const peopleById: Record<number, string> = {};
      allPeople.forEach((person) => {
        peopleById[person.id] = person.fullName;
      });

      const mappedProjects = allProjects
        .map((project) => mapProjectToContrato(project, partnersById, clientsById, peopleById))
        .sort((a, b) => {
          if (!a.dataCriacao) return 1;
          if (!b.dataCriacao) return -1;
          return b.dataCriacao.localeCompare(a.dataCriacao);
        });

      setAvailablePartners(
        [...new Set(allPartners.map((partner) => partner.name).filter(Boolean))].sort((a, b) =>
          a.localeCompare(b)
        )
      );
      setAvailableClients(
        [
          ...new Set(
            clientsPage
              .filter((agency) => agency.isClient)
              .map((agency) => agency.name)
              .filter(Boolean)
          ),
        ].sort((a, b) => a.localeCompare(b))
      );
      setContratos(mappedProjects);
    } catch (fetchError) {
      setError(getUserErrorMessage(fetchError, "Não foi possível carregar os contratos."));
      setContratos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContratos();
  }, [loadContratos]);

  const metricBase = useMemo(
    () => contratos.filter((contrato) => matchesContratoFilters(contrato, filters, { ignoreStatus: true })),
    [contratos, filters]
  );

  // Filtragem e ordenacao
  const filtered = useMemo(() => {
    let result = metricBase.filter((contrato) => matchesContratoFilters(contrato, filters));

    // Ordenacao
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
  }, [filters, metricBase, sortConfig]);

  // Metricas baseadas no contexto atual, sem restringir pelo status ativo
  const counts = useMemo(() => {
    const total = metricBase.length;
    const emExecucao = metricBase.filter((c) => c.status === "EXECUCAO").length;
    const concluidos = metricBase.filter((c) => c.status === "FINALIZADO").length;
    const suspensos = metricBase.filter((c) => c.status === "SUSPENSO").length;
    const preProjetos = metricBase.filter((c) => c.status === "PRE_PROJETO").length;
    const emPlanejamento = metricBase.filter((c) => c.status === "PLANEJAMENTO").length;
    const valorTotal = metricBase.reduce((acc, c) => acc + c.valorTotal, 0);
    const valorEmExecucao = metricBase
      .filter((c) => c.status === "EXECUCAO")
      .reduce((acc, c) => acc + c.valorTotal, 0);
    const valorConcluidos = metricBase
      .filter((c) => c.status === "FINALIZADO")
      .reduce((acc, c) => acc + c.valorTotal, 0);
    const valorSuspensos = metricBase
      .filter((c) => c.status === "SUSPENSO")
      .reduce((acc, c) => acc + c.valorTotal, 0);
    const valorPreProjetos = metricBase
      .filter((c) => c.status === "PRE_PROJETO")
      .reduce((acc, c) => acc + c.valorTotal, 0);
    const valorPlanejamento = metricBase
      .filter((c) => c.status === "PLANEJAMENTO")
      .reduce((acc, c) => acc + c.valorTotal, 0);
    return {
      total,
      emExecucao,
      concluidos,
      suspensos,
      preProjetos,
      emPlanejamento,
      valorTotal,
      valorEmExecucao,
      valorConcluidos,
      valorSuspensos,
      valorPreProjetos,
      valorPlanejamento,
    };
  }, [metricBase]);

  // Paginacao
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

  const handleMetricCardFilter = (status: Filters["status"]) => {
    setFilters((previous) => ({
      ...previous,
      status: status === "TODOS" || previous.status === status ? "TODOS" : status,
    }));
    setPage(1);
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

  // Funcao para exportar para Excel
  const exportToExcel = () => {
    // Preparar dados para exportacao
    const exportData = filtered.map((contrato) => ({
      Codigo: contrato.codigo,
      Nome: contrato.nome,
      GovIF: contrato.govIf,
      Tipo: contrato.tipo === "PROJETO" ? "Projeto" : "Produto",
      ClientePrimario: contrato.clientePrimario,
      ClienteSecundario: contrato.clienteSecundario || "-",
      ParceiroPrimario: contrato.parceiroPrimario,
      ParceiroSecundario: contrato.parceiroSecundario || "-",
      ValorTotal: `R$ ${contrato.valorTotal.toLocaleString("pt-BR")}`,
      Status: getStatusLabel(contrato.status),
      Inicio: formatDate(contrato.dataInicio),
      Termino: contrato.dataTermino ? formatDate(contrato.dataTermino) : "-",
      InicioEfetivo: contrato.dataInicioEfetivo ? formatDate(contrato.dataInicioEfetivo) : "-",
      FimEfetivo: contrato.dataFimEfetivo ? formatDate(contrato.dataFimEfetivo) : "-",
      Coordenador: contrato.coordenador,
      Localidade: contrato.localidade,
      Segmentos: contrato.segmentos.join(", "),
    }));

    // Criar workbook e worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 12 }, // Codigo
      { wch: 35 }, // Nome
      { wch: 8 },  // Gov/IF
      { wch: 10 }, // Tipo
      { wch: 40 }, // Cliente Primario
      { wch: 30 }, // Cliente Secundario
      { wch: 35 }, // Parceiro Primario
      { wch: 30 }, // Parceiro Secundario
      { wch: 18 }, // Valor Total
      { wch: 12 }, // Status
      { wch: 12 }, // Inicio
      { wch: 12 }, // Termino
      { wch: 12 }, // Inicio Efetivo
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

        {/* Cards de Metricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <MetricCard
            title="Pré-projetos"
            value={counts.preProjetos}
            icon={Clock}
            tone="PRE_PROJETO"
            subtitle={`R$ ${counts.valorPreProjetos.toLocaleString("pt-BR")}`}
            onClick={() => handleMetricCardFilter("PRE_PROJETO")}
          />
          <MetricCard
            title="Planejamento"
            value={counts.emPlanejamento}
            icon={Clock}
            tone="PLANEJAMENTO"
            subtitle={`R$ ${counts.valorPlanejamento.toLocaleString("pt-BR")}`}
            onClick={() => handleMetricCardFilter("PLANEJAMENTO")}
          />
          <MetricCard
            title="Execução"
            value={counts.emExecucao}
            icon={TrendingUp}
            tone="EXECUCAO"
            subtitle={`R$ ${counts.valorEmExecucao.toLocaleString("pt-BR")}`}
            onClick={() => handleMetricCardFilter("EXECUCAO")}
          />
          <MetricCard
            title="Concluídos"
            value={counts.concluidos}
            icon={CheckCircle}
            tone="FINALIZADO"
            subtitle={`R$ ${counts.valorConcluidos.toLocaleString("pt-BR")}`}
            onClick={() => handleMetricCardFilter("FINALIZADO")}
          />
          <MetricCard
            title="Suspensos"
            value={counts.suspensos}
            icon={PauseCircle}
            tone="SUSPENSO"
            subtitle={`R$ ${counts.valorSuspensos.toLocaleString("pt-BR")}`}
            onClick={() => handleMetricCardFilter("SUSPENSO")}
          />
          <MetricCard
            title="Total de Contratos"
            value={counts.total}
            icon={FileText}
            tone="TOTAL"
            subtitle={`R$ ${counts.valorTotal.toLocaleString("pt-BR")}`}
            onClick={() => handleMetricCardFilter("TODOS")}
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
                placeholder="Buscar por codigo, nome, cliente ou responsavel..."
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

            {/* Botao de filtros */}
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
                  value={filters.status}
                  placeholder="Todos os status"
                  searchable={true}
                  onChange={(value) => {
                    setFilters((f) => ({ 
                      ...f, 
                      status: value === undefined || value === "TODOS" ? "TODOS" : (value as ProjectStatus)
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

              {/* Parceiro Primario */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Parceiro Primario</label>
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

              {/* Cliente Primario */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Cliente Primario</label>
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

              {/* Valor Minimo */}
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

              {/* Valor Maximo */}
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
              120, // Codigo
              290, // Nome
              100, // Gov/IF
              100, // Tipo
              220, // Cliente / Parceiro
              140, // Valor Total
              130, // Status
              110, // Inicio
              110, // Termino
              200, // Responsavel
            ]}
            minColumnWidth={80}
            className="divide-y divide-gray-200"
          >
            <thead className="bg-gray-50">
              <tr>
                <Th onClick={() => handleSort("codigo")} sortable className="text-center">
                  Codigo
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
                  <TableLoadingSkeleton />
                ) : error ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <XCircle className="h-12 w-12 text-red-300" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Falha ao carregar contratos</p>
                          <p className="text-sm text-gray-500">{error}</p>
                        </div>
                        <button
                          onClick={() => void loadContratos()}
                          className="px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319]"
                        >
                          Tentar novamente
                        </button>
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
                        {contrato.dataTermino ? formatDate(contrato.dataTermino) : "-"}
                      </Td>
                      <Td className="text-sm text-gray-600">{contrato.coordenador}</Td>
                    </tr>
                  ))
                )}
              </tbody>
          </ResizableTable>

          {/* Paginacao */}
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
                  Proxima
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
  tone,
  subtitle,
  onClick,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  tone: MetricCardToneKey;
  subtitle?: string;
  onClick?: () => void;
}) {
  const toneStyle = CARD_TONE_BY_STATUS[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${title}: ${value} contratos`}
      className={`group relative h-full w-full overflow-hidden rounded-xl border bg-white p-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none sm:p-4 lg:p-5 ${toneStyle.border}`}
    >
      <span aria-hidden className={`absolute inset-x-0 top-0 h-1 ${toneStyle.accent}`} />

      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3">
          <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneStyle.iconBg}`}>
            <Icon className={`h-5 w-5 ${toneStyle.iconColor}`} />
          </span>
          <p className="line-clamp-2 min-h-10 text-sm font-medium leading-5 text-zinc-700">{title}</p>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <p className="text-2xl font-bold leading-none tracking-tight text-zinc-900 tabular-nums sm:text-3xl">
            {value}
          </p>
          <span className="text-xs font-normal leading-none text-zinc-500">contratos</span>
        </div>

        {subtitle && (
          <p className={`mt-3 break-words text-sm font-semibold leading-tight ${toneStyle.valueColor}`}>
            {subtitle}
          </p>
        )}
      </div>
    </button>
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

function TableLoadingSkeleton({ rows = 8, columns = 10 }: { rows?: number; columns?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={`contracts-loading-row-${rowIndex}`} className="animate-pulse">
          {Array.from({ length: columns }).map((__, colIndex) => (
            <td key={`contracts-loading-cell-${rowIndex}-${colIndex}`} className="px-4 py-3">
              <div className="h-4 w-full rounded bg-gray-200" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
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
  return formatDateOnlyToPtBr(iso);
}


