"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { NavBar } from "@/components/ui/NavBar";
import {
  ChevronRight,
  Home,
  FileText,
  Download,
  MoreHorizontal,
  Building2,
  User,
  Calendar,
  DollarSign,
  Tag,
} from "lucide-react";

// Mock de dados do contrato (substituir por fetch real)
const mockContrato = {
  id: "1",
  codigo: "PRJ-001",
  nome: "Sistema de Gestão Integrada",
  tipo: "PROJETO" as const,
  status: "EM_ANDAMENTO" as const,
  cliente: "Universidade Federal de São Paulo",
  parceiro: "Fundação de Apoio à Pesquisa",
  responsavel: "João Silva",
  unidade: "IFES-SP",
  valorTotal: 1250000,
  valorExecutado: 812500,
  dataInicio: "2025-01-15",
  dataTermino: "2025-12-31",
};

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

  const percentualExecutado = Math.round(
    (mockContrato.valorExecutado / mockContrato.valorTotal) * 100
  );

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
            {mockContrato.codigo} – {mockContrato.nome}
          </span>
        </nav>

        {/* Header do Contrato */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          {/* Linha principal */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {mockContrato.codigo} – {mockContrato.nome}
                </h1>
                <StatusBadge status={mockContrato.status} />
                <TipoBadge tipo={mockContrato.tipo} />
              </div>
              <p className="text-gray-500 text-sm">
                Contrato ID: {contratoId}
              </p>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="h-4 w-4" />
                Exportar
              </button>
              <button className="inline-flex items-center justify-center w-10 h-10 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Sub-informações em grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Coluna 1 - Cliente/Parceiro */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Parceiro</p>
                  <p className="text-sm font-medium text-gray-900">{mockContrato.cliente}</p>
                  <p className="text-xs text-gray-500">{mockContrato.parceiro}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Coordenador</p>
                  <p className="text-sm font-medium text-gray-900">{mockContrato.responsavel}</p>
                </div>
              </div>
            </div>

            {/* Coluna 2 - Tipo/Unidade */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Tag className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Tipo</p>
                  <p className="text-sm font-medium text-gray-900">
                    {mockContrato.tipo === "PROJETO" ? "Projeto" : "Produto"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Unidade / IFES</p>
                  <p className="text-sm font-medium text-gray-900">{mockContrato.unidade}</p>
                </div>
              </div>
            </div>

            {/* Coluna 3 - Valor */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Valor Total</p>
                  <p className="text-sm font-bold text-gray-900">
                    R$ {mockContrato.valorTotal.toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-5 w-5" /> {/* Spacer */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Situação Financeira</p>
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
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Data de Início</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(mockContrato.dataInicio)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Data de Término</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(mockContrato.dataTermino)}
                  </p>
                </div>
              </div>
            </div>
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
