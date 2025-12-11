"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { NavBar } from "@/components/ui/NavBar";
import { ResizableTable } from "@/components/ui/resizable-table";
import {
  ChevronRight,
  Home,
  Plus,
  Search,
  Filter,
  X,
  FileText,
  TrendingUp,
  FolderOpen,
  ChevronDown,
  ArrowUpDown,
  Eye,
  Edit,
  Download,
  MoreHorizontal,
  FileCheck,
} from "lucide-react";

// Tipos
type PreProjetoTipo = "PROJETO" | "PRODUTO";

type PreProjeto = {
  id: string;
  titulo: string;
  govIf: "IF" | "Gov";
  tipo: PreProjetoTipo;
  parceiro: string;
  localidade: string;
  valorTotal: number;
  dataCriacao: string;
  documentos?: {
    contrato?: string;
    tr?: string;
    planoTrabalho?: string;
    outro?: string;
  };
};

type Filters = {
  govIf: "TODOS" | "IF" | "Gov";
  parceiro: string;
  q: string;
};

type SortConfig = {
  key: keyof PreProjeto | null;
  direction: "asc" | "desc";
};

// Mock de dados
const mockPreProjetos: PreProjeto[] = [
  {
    id: "1",
    titulo: "Sistema de Gestão Acadêmica Integrado",
    govIf: "IF",
    tipo: "PROJETO",
    parceiro: "Fapto",
    localidade: "Campina Grande - PB",
    valorTotal: 850000,
    dataCriacao: "2025-12-01",
    documentos: {
      tr: "tr_sistema_gestao.pdf",
      planoTrabalho: "plano_trabalho_v1.pdf",
    },
  },
  {
    id: "2",
    titulo: "Licença Software GoPro Enterprise Premium",
    govIf: "Gov",
    tipo: "PRODUTO",
    parceiro: "Fadex",
    localidade: "Estado do Rio de Janeiro",
    valorTotal: 320000,
    dataCriacao: "2025-12-03",
    documentos: {
      contrato: "contrato_proposta.pdf",
    },
  },
  {
    id: "3",
    titulo: "Portal de Transparência e Controle Social",
    govIf: "IF",
    tipo: "PROJETO",
    parceiro: "IFMA",
    localidade: "São Luís - MA",
    valorTotal: 1200000,
    dataCriacao: "2025-12-05",
    documentos: {
      tr: "termo_referencia_portal.pdf",
      planoTrabalho: "plano_trabalho_portal.pdf",
      outro: "especificacoes_tecnicas.pdf",
    },
  },
  {
    id: "4",
    titulo: "Modernização Infraestrutura TI",
    govIf: "Gov",
    tipo: "PROJETO",
    parceiro: "Fundação Araucária",
    localidade: "Curitiba - PR",
    valorTotal: 2500000,
    dataCriacao: "2025-12-07",
  },
];

const parceiros = ["Fapto", "Fadex", "IFMA", "Fundação Araucária", "Fundação UFRGS", "Fundação XYZ"];

export default function PreProjetosPage() {
  const [filters, setFilters] = useState<Filters>({
    govIf: "TODOS",
    parceiro: "",
    q: "",
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "dataCriacao",
    direction: "desc",
  });
  const [loading, setLoading] = useState(false);
  const [preProjetos, setPreProjetos] = useState<PreProjeto[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  // Simulação de fetch
  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      setPreProjetos(mockPreProjetos);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, []);

  // Listener para quando um pré-projeto for criado (via modal global)
  useEffect(() => {
    const handlePreProjetoCriado = (event: CustomEvent) => {
      const data = event.detail;

      // Converter valorTotal de string formatada para número
      const valorTotalNumero = typeof data.valorTotal === "string"
        ? parseFloat(data.valorTotal.replace(/\./g, "").replace(",", ".")) || 0
        : data.valorTotal || 0;

      const novoPreProjeto: PreProjeto = {
        id: String(Date.now()),
        titulo: data.titulo,
        govIf: data.govIf || "IF",
        tipo: data.tipo,
        parceiro: data.parceiro,
        localidade: data.localidade,
        valorTotal: valorTotalNumero,
        dataCriacao: new Date().toISOString().split("T")[0],
        documentos: data.documentos,
      };

      setPreProjetos((prev) => [novoPreProjeto, ...prev]);
    };

    window.addEventListener("pre-projeto-criado", handlePreProjetoCriado as EventListener);
    return () => {
      window.removeEventListener("pre-projeto-criado", handlePreProjetoCriado as EventListener);
    };
  }, []);

  // Filtragem e ordenação
  const filtered = useMemo(() => {
    let result = preProjetos
      .filter((p) => (filters.govIf === "TODOS" ? true : p.govIf === filters.govIf))
      .filter((p) => (filters.parceiro ? p.parceiro === filters.parceiro : true))
      .filter((p) =>
        filters.q
          ? `${p.titulo} ${p.parceiro} ${p.localidade}`
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
  }, [preProjetos, filters, sortConfig]);

  // Métricas
  const counts = useMemo(() => {
    const total = preProjetos.length;
    const projetos = preProjetos.filter((p) => p.tipo === "PROJETO").length;
    const produtos = preProjetos.filter((p) => p.tipo === "PRODUTO").length;
    const valorTotal = preProjetos.reduce((acc, p) => acc + p.valorTotal, 0);
    return { total, projetos, produtos, valorTotal };
  }, [preProjetos]);

  // Paginação
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const totalPages = Math.ceil(filtered.length / pageSize);

  // Handlers
  const handleSort = (key: keyof PreProjeto) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const clearFilters = () => {
    setFilters({
      govIf: "TODOS",
      parceiro: "",
      q: "",
    });
    setPage(1);
  };

  const hasActiveFilters =
    filters.govIf !== "TODOS" || filters.parceiro !== "" || filters.q !== "";

  const handleOpenModal = () => {
    window.dispatchEvent(
      new CustomEvent("open-modal", { detail: { modalName: "novo-pre-projeto" } })
    );
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
          <Link href="/contratos" className="hover:text-gray-700">
            Contratos
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Pré-Projetos</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pré-Projetos</h1>
            <p className="text-sm text-gray-500">
              Gerenciamento de propostas antes da formalização
            </p>
          </div>
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Pré-Projeto
          </button>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard title="Total de Pré-Projetos" value={counts.total} icon={FolderOpen} color="#004225" />
          <MetricCard title="Projetos" value={counts.projetos} icon={FileText} color="#0B7A4B" />
          <MetricCard title="Produtos" value={counts.produtos} icon={FileCheck} color="#00B894" />
          <MetricCard
            title="Valor Total Estimado"
            value={`R$ ${counts.valorTotal.toLocaleString("pt-BR")}`}
            icon={TrendingUp}
            color="#6D28D9"
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
                placeholder="Buscar por título, parceiro ou localidade..."
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
                  {[filters.govIf !== "TODOS", filters.parceiro].filter(Boolean).length}
                </span>
              )}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {/* Filtros expandidos */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
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
            columnCount={9}
            defaultWidths={[
              250, // Título
              100, // Gov/IF
              100, // Tipo
              150, // Parceiro
              180, // Localidade
              140, // Valor Estimado
              120, // Documentos
              130, // Data de Criação
              140, // Ações
            ]}
            minColumnWidth={80}
            className="divide-y divide-gray-200"
          >
            <thead className="bg-gray-50">
              <tr>
                <Th onClick={() => handleSort("titulo")} sortable className="text-center">
                  Título
                  <SortIcon column="titulo" sortConfig={sortConfig} />
                </Th>
                <Th onClick={() => handleSort("govIf")} sortable className="text-center">
                  Gov/IF
                  <SortIcon column="govIf" sortConfig={sortConfig} />
                </Th>
                <Th className="text-center">Tipo</Th>
                <Th onClick={() => handleSort("parceiro")} sortable className="text-center">
                  Parceiro
                  <SortIcon column="parceiro" sortConfig={sortConfig} />
                </Th>
                <Th onClick={() => handleSort("localidade")} sortable className="text-center">
                  Localidade
                  <SortIcon column="localidade" sortConfig={sortConfig} />
                </Th>
                <Th onClick={() => handleSort("valorTotal")} sortable className="text-center">
                  Valor Estimado
                  <SortIcon column="valorTotal" sortConfig={sortConfig} />
                </Th>
                <Th className="text-center">Documentos</Th>
                <Th onClick={() => handleSort("dataCriacao")} sortable className="text-center">
                  Data de Criação
                  <SortIcon column="dataCriacao" sortConfig={sortConfig} />
                </Th>
                <Th className="text-center">Ações</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#004225]" />
                      <span className="text-sm text-gray-500">Carregando pré-projetos...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FolderOpen className="h-12 w-12 text-gray-300" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Nenhum pré-projeto encontrado
                        </p>
                        <p className="text-sm text-gray-500">
                          Crie seu primeiro pré-projeto para começar.
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
                          onClick={handleOpenModal}
                          className="px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319]"
                        >
                          Criar pré-projeto
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((preProjeto) => (
                  <tr key={preProjeto.id} className="hover:bg-gray-50 transition-colors">
                    <Td className="font-medium text-gray-900 max-w-[250px]">
                      <div className="truncate" title={preProjeto.titulo}>
                        {preProjeto.titulo}
                      </div>
                    </Td>
                    <Td>
                      <GovIfBadge govIf={preProjeto.govIf} />
                    </Td>
                    <Td>
                      <TipoBadge tipo={preProjeto.tipo} />
                    </Td>
                    <Td className="text-sm text-gray-600">{preProjeto.parceiro}</Td>
                    <Td className="text-sm text-gray-600 max-w-[180px]">
                      <div className="truncate" title={preProjeto.localidade}>
                        {preProjeto.localidade}
                      </div>
                    </Td>
                    <Td className="text-right font-medium">
                      R$ {preProjeto.valorTotal.toLocaleString("pt-BR")}
                    </Td>
                    <Td>
                      <DocumentosBadge documentos={preProjeto.documentos} />
                    </Td>
                    <Td className="text-sm text-gray-600">{formatDate(preProjeto.dataCriacao)}</Td>
                    <Td>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          className="p-2 text-gray-500 hover:text-[#004225] hover:bg-gray-100 rounded-lg transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 text-gray-500 hover:text-[#004225] hover:bg-gray-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 text-gray-500 hover:text-[#004225] hover:bg-gray-100 rounded-lg transition-colors"
                          title="Exportar"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 text-gray-500 hover:text-[#004225] hover:bg-gray-100 rounded-lg transition-colors"
                          title="Mais opções"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </Td>
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
                {Math.min(page * pageSize, filtered.length)} de {filtered.length} pré-projetos
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
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}15` }}>
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

function TipoBadge({ tipo }: { tipo: PreProjetoTipo }) {
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

function DocumentosBadge({ documentos }: { documentos?: PreProjeto["documentos"] }) {
  if (!documentos) {
    return <span className="text-xs text-gray-400">—</span>;
  }

  const count = Object.values(documentos).filter(Boolean).length;

  if (count === 0) {
    return <span className="text-xs text-gray-400">—</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
      <FileText className="h-3 w-3" />
      {count} doc{count !== 1 ? "s" : ""}
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
