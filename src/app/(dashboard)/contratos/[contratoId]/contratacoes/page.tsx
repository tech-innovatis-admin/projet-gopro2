"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  FileText,
  DollarSign,
  Calendar,
  ChevronDown,
  Eye,
  Edit,
  MoreHorizontal,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpDown,
} from "lucide-react";

// Tipos
type ContratacaoTipo = "ADITIVO" | "ORDEM_SERVICO" | "TERMO_REFERENCIA" | "SUBCONTRATO";
type ContratacaoStatus = "ATIVA" | "ENCERRADA" | "PLANEJADA" | "CANCELADA";

type Contratacao = {
  id: string;
  codigo: string;
  tipo: ContratacaoTipo;
  descricao: string;
  valor: number;
  dataInicio: string;
  dataFim?: string;
  status: ContratacaoStatus;
  fornecedor?: string;
  objeto: string;
};

// Mock de dados
const mockContratacoes: Contratacao[] = [
  {
    id: "1",
    codigo: "ADT-001",
    tipo: "ADITIVO",
    descricao: "Aditivo de prazo e valor - Fase 2",
    valor: 350000,
    dataInicio: "2025-04-01",
    dataFim: "2025-12-31",
    status: "ATIVA",
    fornecedor: "Próprio contrato",
    objeto: "Extensão do prazo de execução e acréscimo de valor para desenvolvimento adicional",
  },
  {
    id: "2",
    codigo: "OS-001",
    tipo: "ORDEM_SERVICO",
    descricao: "Ordem de Serviço - Desenvolvimento Módulo A",
    valor: 180000,
    dataInicio: "2025-01-15",
    dataFim: "2025-05-30",
    status: "ENCERRADA",
    fornecedor: "Tech Solutions Ltda",
    objeto: "Desenvolvimento e implantação do módulo de gestão de usuários",
  },
  {
    id: "3",
    codigo: "OS-002",
    tipo: "ORDEM_SERVICO",
    descricao: "Ordem de Serviço - Integração API",
    valor: 95000,
    dataInicio: "2025-06-01",
    dataFim: "2025-09-30",
    status: "ATIVA",
    fornecedor: "DataBridge Sistemas",
    objeto: "Integração com sistemas legados via API REST",
  },
  {
    id: "4",
    codigo: "TR-001",
    tipo: "TERMO_REFERENCIA",
    descricao: "Termo de Referência - Equipamentos TI",
    valor: 220000,
    dataInicio: "2025-07-01",
    status: "PLANEJADA",
    objeto: "Aquisição de servidores e equipamentos de infraestrutura",
  },
  {
    id: "5",
    codigo: "OS-003",
    tipo: "ORDEM_SERVICO",
    descricao: "Ordem de Serviço - Treinamento",
    valor: 45000,
    dataInicio: "2025-10-01",
    dataFim: "2025-11-30",
    status: "PLANEJADA",
    fornecedor: "Capacita Brasil",
    objeto: "Capacitação de 50 usuários finais no sistema",
  },
];

// Cálculos do resumo
const valorOriginal = 1250000;
const valorTotal = mockContratacoes.reduce((acc, c) => acc + c.valor, 0);
const valorAtivo = mockContratacoes
  .filter((c) => c.status === "ATIVA")
  .reduce((acc, c) => acc + c.valor, 0);

export default function ContratoContratacoesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTipo, setFilterTipo] = useState<"TODOS" | ContratacaoTipo>("TODOS");
  const [filterStatus, setFilterStatus] = useState<"TODOS" | ContratacaoStatus>("TODOS");
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Contratacao | null;
    direction: "asc" | "desc";
  }>({ key: "dataInicio", direction: "desc" });

  // Filtragem
  const filtered = useMemo(() => {
    let result = mockContratacoes
      .filter((c) => (filterTipo === "TODOS" ? true : c.tipo === filterTipo))
      .filter((c) => (filterStatus === "TODOS" ? true : c.status === filterStatus))
      .filter((c) =>
        searchQuery
          ? `${c.codigo} ${c.descricao} ${c.fornecedor || ""} ${c.objeto}`
              .toLowerCase()
              .includes(searchQuery.toLowerCase())
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
  }, [filterTipo, filterStatus, searchQuery, sortConfig]);

  const handleSort = (key: keyof Contratacao) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const hasActiveFilters = filterTipo !== "TODOS" || filterStatus !== "TODOS" || searchQuery;

  const clearFilters = () => {
    setFilterTipo("TODOS");
    setFilterStatus("TODOS");
    setSearchQuery("");
  };

  // Status de conformidade
  const percentualAdicional = ((valorTotal / valorOriginal - 1) * 100).toFixed(1);
  const isConformidade = valorTotal <= valorOriginal * 1.25; // até 25% de aditivo

  return (
    <div className="space-y-6">
      {/* Header da Aba */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Contratações</h2>
          <p className="text-sm text-gray-500">
            Aditivos, ordens de serviço e outras contratações vinculadas a este contrato.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors">
          <Plus className="h-4 w-4" />
          Nova Contratação
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-500">Total de Contratações</span>
            <FileText className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{mockContratacoes.length}</p>
        </div>

      {/* Card de Valor Total */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-500">Valor Total</span>
            <DollarSign className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            R$ {(valorTotal / 1000).toFixed(0)}k
          </p>
          <p className="text-xs text-gray-500 mt-1">
            +{percentualAdicional}% do valor original
          </p>
        </div>

      {/* Card de Valor em Execução */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-500">Valor em Execução</span>
            <Clock className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600">
            R$ {(valorAtivo / 1000).toFixed(0)}k
          </p>
        </div>

      {/* Card de Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-500">Status</span>
            {isConformidade ? (
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-500" />
            )}
          </div>
          <p
            className={`text-lg font-bold ${
              isConformidade ? "text-emerald-600" : "text-amber-600"
            }`}
          >
            {isConformidade ? "Em Conformidade" : "Atenção Necessária"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {isConformidade ? "Dentro do limite de 25%" : "Acima do limite de 25%"}
          </p>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Busca */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código, descrição ou fornecedor..."
              className="w-full h-10 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filtro de Tipo */}
          <select
            className="h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value as typeof filterTipo)}
          >
            <option value="TODOS">Todos os tipos</option>
            <option value="ADITIVO">Aditivo</option>
            <option value="ORDEM_SERVICO">Ordem de Serviço</option>
            <option value="TERMO_REFERENCIA">Termo de Referência</option>
            <option value="SUBCONTRATO">Subcontrato</option>
          </select>

          {/* Filtro de Status */}
          <select
            className="h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
          >
            <option value="TODOS">Todos os status</option>
            <option value="ATIVA">Ativa</option>
            <option value="ENCERRADA">Encerrada</option>
            <option value="PLANEJADA">Planejada</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <Th onClick={() => handleSort("codigo")} sortable>
                  Código
                  <SortIcon column="codigo" sortConfig={sortConfig} />
                </Th>
                <Th>Tipo</Th>
                <Th onClick={() => handleSort("descricao")} sortable>
                  Descrição
                  <SortIcon column="descricao" sortConfig={sortConfig} />
                </Th>
                <Th onClick={() => handleSort("valor")} sortable className="text-right">
                  Valor
                  <SortIcon column="valor" sortConfig={sortConfig} />
                </Th>
                <Th onClick={() => handleSort("dataInicio")} sortable>
                  Início
                  <SortIcon column="dataInicio" sortConfig={sortConfig} />
                </Th>
                <Th onClick={() => handleSort("dataFim")} sortable>
                  Fim
                  <SortIcon column="dataFim" sortConfig={sortConfig} />
                </Th>
                <Th>Status</Th>
                <Th className="text-center">Ações</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="h-12 w-12 text-gray-300" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Nenhuma contratação encontrada
                        </p>
                        <p className="text-sm text-gray-500">
                          Tente ajustar os filtros ou adicione uma nova contratação.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((contratacao) => (
                  <tr
                    key={contratacao.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <Td className="font-mono text-sm font-medium">{contratacao.codigo}</Td>
                    <Td>
                      <TipoBadge tipo={contratacao.tipo} />
                    </Td>
                    <Td>
                      <div className="max-w-[250px]">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {contratacao.descricao}
                        </p>
                        {contratacao.fornecedor && (
                          <p className="text-xs text-gray-500 truncate">
                            {contratacao.fornecedor}
                          </p>
                        )}
                      </div>
                    </Td>
                    <Td className="text-right font-medium">
                      R$ {contratacao.valor.toLocaleString("pt-BR")}
                    </Td>
                    <Td className="text-sm text-gray-600">
                      {formatDate(contratacao.dataInicio)}
                    </Td>
                    <Td className="text-sm text-gray-600">
                      {contratacao.dataFim ? formatDate(contratacao.dataFim) : "—"}
                    </Td>
                    <Td>
                      <StatusBadge status={contratacao.status} />
                    </Td>
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
          </table>
        </div>
      </div>
    </div>
  );
}

// Componentes auxiliares
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
      className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${
        sortable ? "cursor-pointer hover:bg-gray-100 select-none" : ""
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-1">{children}</div>
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}

function SortIcon({
  column,
  sortConfig,
}: {
  column: string;
  sortConfig: { key: string | null; direction: string };
}) {
  if (sortConfig.key !== column) {
    return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
  }
  return (
    <ArrowUpDown
      className={`h-3 w-3 text-[#004225] ${sortConfig.direction === "desc" ? "rotate-180" : ""}`}
    />
  );
}

function TipoBadge({ tipo }: { tipo: ContratacaoTipo }) {
  const config: Record<ContratacaoTipo, { bg: string; text: string; label: string }> = {
    ADITIVO: { bg: "bg-purple-100", text: "text-purple-800", label: "Aditivo" },
    ORDEM_SERVICO: { bg: "bg-blue-100", text: "text-blue-800", label: "OS" },
    TERMO_REFERENCIA: { bg: "bg-amber-100", text: "text-amber-800", label: "TR" },
    SUBCONTRATO: { bg: "bg-teal-100", text: "text-teal-800", label: "Subcontrato" },
  };

  const { bg, text, label } = config[tipo];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}
    >
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: ContratacaoStatus }) {
  const config: Record<ContratacaoStatus, { bg: string; text: string; label: string }> = {
    ATIVA: { bg: "bg-green-100", text: "text-green-800", label: "Ativa" },
    ENCERRADA: { bg: "bg-gray-100", text: "text-gray-800", label: "Encerrada" },
    PLANEJADA: { bg: "bg-blue-100", text: "text-blue-800", label: "Planejada" },
    CANCELADA: { bg: "bg-red-100", text: "text-red-800", label: "Cancelada" },
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

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return iso;
  }
}
