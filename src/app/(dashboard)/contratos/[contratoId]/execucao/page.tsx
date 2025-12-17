"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Target,
  ChevronDown,
  Eye,
  Edit,
  MoreHorizontal,
  X,
  Flag,
} from "lucide-react";
import { NovoMarcoModal, NovoMarcoForm } from "./_components/NovoMarcoModal";

// Tipos
type MarcoStatus = "PLANEJADO" | "EM_ANDAMENTO" | "CONCLUIDO" | "ATRASADO" | "CANCELADO";

type Marco = {
  id: string;
  nome: string;
  descricao: string;
  responsavel: string;
  dataPlanejada: string;
  dataRealizada?: string;
  status: MarcoStatus;
  percentual: number;
  observacoes?: string;
  fase: string;
};

type Risco = {
  id: string;
  descricao: string;
  severidade: "ALTA" | "MEDIA" | "BAIXA";
  responsavel: string;
  prazoMitigacao: string;
  status: "ABERTO" | "EM_TRATAMENTO" | "RESOLVIDO";
};

// Mock de dados
const mockMarcos: Marco[] = [
  {
    id: "1",
    nome: "Kickoff do Projeto",
    descricao: "Reunião inicial com stakeholders e definição de escopo",
    responsavel: "João Silva",
    dataPlanejada: "2025-01-15",
    dataRealizada: "2025-01-15",
    status: "CONCLUIDO",
    percentual: 100,
    fase: "Iniciação",
  },
  {
    id: "2",
    nome: "Entrega do Módulo de Usuários",
    descricao: "Desenvolvimento completo do módulo de gestão de usuários",
    responsavel: "Maria Santos",
    dataPlanejada: "2025-03-30",
    dataRealizada: "2025-04-05",
    status: "CONCLUIDO",
    percentual: 100,
    observacoes: "Entregue com 5 dias de atraso devido a mudanças de escopo",
    fase: "Desenvolvimento",
  },
  {
    id: "3",
    nome: "Integração com Sistemas Legados",
    descricao: "Integração via API com sistemas existentes da instituição",
    responsavel: "Carlos Oliveira",
    dataPlanejada: "2025-06-15",
    dataRealizada: "2025-06-10",
    status: "CONCLUIDO",
    percentual: 100,
    fase: "Desenvolvimento",
  },
  {
    id: "4",
    nome: "Testes de Homologação",
    descricao: "Execução de testes de aceitação com usuários finais",
    responsavel: "Ana Costa",
    dataPlanejada: "2025-09-30",
    status: "EM_ANDAMENTO",
    percentual: 65,
    observacoes: "Em andamento conforme planejado",
    fase: "Testes",
  },
  {
    id: "5",
    nome: "Treinamento de Usuários",
    descricao: "Capacitação de 50 usuários finais no sistema",
    responsavel: "Pedro Mendes",
    dataPlanejada: "2025-11-15",
    status: "PLANEJADO",
    percentual: 0,
    fase: "Implantação",
  },
  {
    id: "6",
    nome: "Go-Live",
    descricao: "Entrada em produção do sistema",
    responsavel: "João Silva",
    dataPlanejada: "2025-12-15",
    status: "PLANEJADO",
    percentual: 0,
    fase: "Implantação",
  },
  {
    id: "7",
    nome: "Entrega de Documentação",
    descricao: "Documentação técnica e manuais de usuário",
    responsavel: "Maria Santos",
    dataPlanejada: "2025-08-30",
    status: "ATRASADO",
    percentual: 45,
    observacoes: "Atrasado devido a mudanças no escopo técnico",
    fase: "Documentação",
  },
];

const mockRiscos: Risco[] = [
  {
    id: "1",
    descricao: "Atraso na entrega de equipamentos pelo fornecedor",
    severidade: "ALTA",
    responsavel: "João Silva",
    prazoMitigacao: "2025-12-20",
    status: "EM_TRATAMENTO",
  },
  {
    id: "2",
    descricao: "Rotatividade da equipe técnica",
    severidade: "MEDIA",
    responsavel: "Ana Costa",
    prazoMitigacao: "2025-12-31",
    status: "ABERTO",
  },
  {
    id: "3",
    descricao: "Mudanças de requisitos pelo cliente",
    severidade: "BAIXA",
    responsavel: "Maria Santos",
    prazoMitigacao: "2025-11-30",
    status: "RESOLVIDO",
  },
];

export default function ContratoExecucaoPage() {
  const [marcos, setMarcos] = useState<Marco[]>(mockMarcos);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"TODOS" | MarcoStatus>("TODOS");
  const [filterFase, setFilterFase] = useState<string>("TODOS");
  const [showRiscos, setShowRiscos] = useState(false);
  const [isNovoMarcoModalOpen, setIsNovoMarcoModalOpen] = useState(false);

  // Cálculos baseados no estado
  const totalMarcos = marcos.length;
  const marcosConcluidos = marcos.filter((m) => m.status === "CONCLUIDO").length;
  const marcosAtrasados = marcos.filter((m) => m.status === "ATRASADO").length;
  const percentualGeral = totalMarcos > 0 
    ? Math.round(marcos.reduce((acc, m) => acc + m.percentual, 0) / totalMarcos)
    : 0;

  // Fases únicas
  const fases = [...new Set(marcos.map((m) => m.fase))];

  const handleCreateMarco = async (data: NovoMarcoForm) => {
    const novoMarco: Marco = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      status: data.status as MarcoStatus,
    };
    
    setMarcos((prev) => [...prev, novoMarco]);
    setIsNovoMarcoModalOpen(false);
  };

  // Filtragem de marcos
  const filteredMarcos = useMemo(() => {
    return marcos
      .filter((m) => (filterStatus === "TODOS" ? true : m.status === filterStatus))
      .filter((m) => (filterFase === "TODOS" ? true : m.fase === filterFase))
      .filter((m) =>
        searchQuery
          ? `${m.nome} ${m.descricao} ${m.responsavel}`
              .toLowerCase()
              .includes(searchQuery.toLowerCase())
          : true
      );
  }, [marcos, filterStatus, filterFase, searchQuery]);

  const hasActiveFilters = filterStatus !== "TODOS" || filterFase !== "TODOS" || searchQuery;

  const clearFilters = () => {
    setFilterStatus("TODOS");
    setFilterFase("TODOS");
    setSearchQuery("");
  };

  // Próximo marco
  const proximoMarco = marcos
    .filter((m) => m.status === "PLANEJADO" || m.status === "EM_ANDAMENTO")
    .sort((a, b) => new Date(a.dataPlanejada).getTime() - new Date(b.dataPlanejada).getTime())[0];

  return (
    <div className="space-y-6">
      {/* Header da Aba */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Execução</h2>
          <p className="text-sm text-gray-500">
            Acompanhamento da execução física e dos marcos deste contrato.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRiscos(!showRiscos)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              showRiscos
                ? "bg-amber-100 text-amber-800"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            Riscos ({mockRiscos.filter((r) => r.status !== "RESOLVIDO").length})
          </button>
          <button
            onClick={() => setIsNovoMarcoModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Marco
          </button>
        </div>
      </div>

      {/* Cards de Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Execução Física</span>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{percentualGeral}%</p>
          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
              style={{ width: `${percentualGeral}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Entregas</span>
            <CheckCircle className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {marcosConcluidos}/{totalMarcos}
          </p>
          <p className="text-xs text-gray-500 mt-1">marcos concluídos</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Atrasados</span>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <p className={`text-3xl font-bold ${marcosAtrasados > 0 ? "text-red-600" : "text-gray-900"}`}>
            {marcosAtrasados}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {marcosAtrasados > 0 ? "requer atenção" : "nenhum atraso"}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Próximo Marco</span>
            <Target className="h-5 w-5 text-purple-500" />
          </div>
          {proximoMarco ? (
            <>
              <p className="text-sm font-bold text-gray-900 truncate">{proximoMarco.nome}</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDate(proximoMarco.dataPlanejada)}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500">Nenhum marco pendente</p>
          )}
        </div>
      </div>

      {/* Seção de Riscos (condicional) */}
      {showRiscos && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Riscos e Issues</h3>
              <p className="text-sm text-gray-500">Gestão de riscos identificados no projeto</p>
            </div>
            <button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#004225] bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
              <Plus className="h-4 w-4" />
              Novo Risco
            </button>
          </div>

          <div className="space-y-3">
            {mockRiscos.map((risco) => (
              <div
                key={risco.id}
                className={`flex items-start gap-4 p-4 rounded-lg border ${
                  risco.status === "RESOLVIDO"
                    ? "bg-gray-50 border-gray-200"
                    : risco.severidade === "ALTA"
                    ? "bg-red-50 border-red-200"
                    : risco.severidade === "MEDIA"
                    ? "bg-amber-50 border-amber-200"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    risco.status === "RESOLVIDO"
                      ? "bg-gray-200"
                      : risco.severidade === "ALTA"
                      ? "bg-red-200"
                      : risco.severidade === "MEDIA"
                      ? "bg-amber-200"
                      : "bg-blue-200"
                  }`}
                >
                  <Flag
                    className={`h-4 w-4 ${
                      risco.status === "RESOLVIDO"
                        ? "text-gray-600"
                        : risco.severidade === "ALTA"
                        ? "text-red-700"
                        : risco.severidade === "MEDIA"
                        ? "text-amber-700"
                        : "text-blue-700"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${risco.status === "RESOLVIDO" ? "text-gray-500 line-through" : "text-gray-900"}`}>
                    {risco.descricao}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>Responsável: {risco.responsavel}</span>
                    <span>•</span>
                    <span>Prazo: {formatDate(risco.prazoMitigacao)}</span>
                    <span>•</span>
                    <RiscoStatusBadge status={risco.status} />
                  </div>
                </div>
                <SeveridadeBadge severidade={risco.severidade} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barra de Busca e Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, descrição ou responsável..."
              className="w-full h-10 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
          >
            <option value="TODOS">Todos os status</option>
            <option value="PLANEJADO">Planejado</option>
            <option value="EM_ANDAMENTO">Em Andamento</option>
            <option value="CONCLUIDO">Concluído</option>
            <option value="ATRASADO">Atrasado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>

          <select
            className="h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
            value={filterFase}
            onChange={(e) => setFilterFase(e.target.value)}
          >
            <option value="TODOS">Todas as fases</option>
            {fases.map((fase) => (
              <option key={fase} value={fase}>
                {fase}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Timeline de Marcos */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Cronograma de Marcos</h3>

        <div className="relative">
          {/* Linha vertical da timeline */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

          <div className="space-y-6">
            {filteredMarcos.map((marco, index) => (
              <div key={marco.id} className="relative flex items-start gap-6 pl-14">
                {/* Ícone do status */}
                <div
                  className={`absolute left-0 w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-sm ${
                    marco.status === "CONCLUIDO"
                      ? "bg-emerald-500"
                      : marco.status === "EM_ANDAMENTO"
                      ? "bg-blue-500"
                      : marco.status === "ATRASADO"
                      ? "bg-red-500"
                      : marco.status === "CANCELADO"
                      ? "bg-gray-400"
                      : "bg-gray-200"
                  }`}
                >
                  {marco.status === "CONCLUIDO" ? (
                    <CheckCircle className="h-6 w-6 text-white" />
                  ) : marco.status === "EM_ANDAMENTO" ? (
                    <Clock className="h-6 w-6 text-white" />
                  ) : marco.status === "ATRASADO" ? (
                    <AlertTriangle className="h-6 w-6 text-white" />
                  ) : (
                    <Target className="h-6 w-6 text-gray-500" />
                  )}
                </div>

                {/* Conteúdo */}
                <div
                  className={`flex-1 p-4 rounded-lg border ${
                    marco.status === "ATRASADO"
                      ? "bg-red-50 border-red-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900">{marco.nome}</h4>
                        <MarcoStatusBadge status={marco.status} />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{marco.descricao}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-500 hover:text-[#004225] hover:bg-white rounded-lg transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-500 hover:text-[#004225] hover:bg-white rounded-lg transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Planejado: {formatDate(marco.dataPlanejada)}
                    </span>
                    {marco.dataRealizada && (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        Realizado: {formatDate(marco.dataRealizada)}
                      </span>
                    )}
                    <span>Responsável: {marco.responsavel}</span>
                    <span className="px-2 py-0.5 bg-white rounded text-xs font-medium">
                      {marco.fase}
                    </span>
                  </div>

                  {/* Barra de progresso */}
                  {marco.status !== "PLANEJADO" && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">Progresso</span>
                        <span className="font-medium text-gray-900">{marco.percentual}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            marco.status === "CONCLUIDO"
                              ? "bg-emerald-500"
                              : marco.status === "ATRASADO"
                              ? "bg-red-500"
                              : "bg-blue-500"
                          }`}
                          style={{ width: `${marco.percentual}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {marco.observacoes && (
                    <p className="mt-3 text-xs text-gray-500 italic">
                      💬 {marco.observacoes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {filteredMarcos.length === 0 && (
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900">Nenhum marco encontrado</p>
            <p className="text-sm text-gray-500">Tente ajustar os filtros.</p>
          </div>
        )}
      </div>

      <NovoMarcoModal
        isOpen={isNovoMarcoModalOpen}
        onClose={() => setIsNovoMarcoModalOpen(false)}
        onSubmit={handleCreateMarco}
      />
    </div>
  );
}

// Componentes auxiliares
function MarcoStatusBadge({ status }: { status: MarcoStatus }) {
  const config: Record<MarcoStatus, { bg: string; text: string; label: string }> = {
    PLANEJADO: { bg: "bg-gray-100", text: "text-gray-800", label: "Planejado" },
    EM_ANDAMENTO: { bg: "bg-blue-100", text: "text-blue-800", label: "Em Andamento" },
    CONCLUIDO: { bg: "bg-emerald-100", text: "text-emerald-800", label: "Concluído" },
    ATRASADO: { bg: "bg-red-100", text: "text-red-800", label: "Atrasado" },
    CANCELADO: { bg: "bg-gray-100", text: "text-gray-500", label: "Cancelado" },
  };

  const { bg, text, label } = config[status];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
}

function SeveridadeBadge({ severidade }: { severidade: "ALTA" | "MEDIA" | "BAIXA" }) {
  const config = {
    ALTA: { bg: "bg-red-100", text: "text-red-800", label: "Alta" },
    MEDIA: { bg: "bg-amber-100", text: "text-amber-800", label: "Média" },
    BAIXA: { bg: "bg-blue-100", text: "text-blue-800", label: "Baixa" },
  };

  const { bg, text, label } = config[severidade];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
}

function RiscoStatusBadge({ status }: { status: "ABERTO" | "EM_TRATAMENTO" | "RESOLVIDO" }) {
  const config = {
    ABERTO: { text: "text-red-600", label: "Aberto" },
    EM_TRATAMENTO: { text: "text-amber-600", label: "Em Tratamento" },
    RESOLVIDO: { text: "text-emerald-600", label: "Resolvido" },
  };

  const { text, label } = config[status];

  return <span className={`font-medium ${text}`}>{label}</span>;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return iso;
  }
}
