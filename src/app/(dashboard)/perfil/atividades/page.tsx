"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { NavBar } from "@/components/ui/NavBar";
import { ResizableTable } from "@/components/ui/resizable-table";
import {
  Home,
  ChevronRight,
  Activity,
  Search,
  Filter,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { mockAtividades, type AtividadeCentralizada } from "./data";

export default function AtividadesPage() {
  const [atividades] = useState<AtividadeCentralizada[]>(mockAtividades);
  const [searchQuery, setSearchQuery] = useState("");
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>("tudo");
  const [selectedAtividades, setSelectedAtividades] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Filtrar apenas atividades não concluídas
  const atividadesFiltradas = useMemo(() => {
    let filtered = atividades.filter(
      (atividade) => atividade.activity.status !== "COMPLETED" && atividade.activity.status !== "CANCELLED"
    );

    // Filtro de busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (atividade) =>
          atividade.activity.title.toLowerCase().includes(query) ||
          atividade.activity.description?.toLowerCase().includes(query) ||
          atividade.projeto.nome.toLowerCase().includes(query) ||
          atividade.organizacao?.nome.toLowerCase().includes(query) ||
          atividade.pessoaContato?.nome.toLowerCase().includes(query) ||
          atividade.atribuidoA?.toLowerCase().includes(query)
      );
    }

    // Filtro de período
    if (filtroPeriodo !== "tudo") {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);
      const fimSemana = new Date(hoje);
      fimSemana.setDate(fimSemana.getDate() + (7 - hoje.getDay()));
      const inicioProximaSemana = new Date(fimSemana);
      inicioProximaSemana.setDate(inicioProximaSemana.getDate() + 1);
      const fimProximaSemana = new Date(inicioProximaSemana);
      fimProximaSemana.setDate(fimProximaSemana.getDate() + 7);

      filtered = filtered.filter((atividade) => {
        if (!atividade.activity.dueAt) return false;
        const dataVenc = new Date(atividade.activity.dueAt);
        dataVenc.setHours(0, 0, 0, 0);

        switch (filtroPeriodo) {
          case "vencido":
            return dataVenc < hoje;
          case "hoje":
            return dataVenc.getTime() === hoje.getTime();
          case "amanha":
            return dataVenc.getTime() === amanha.getTime();
          case "esta-semana":
            return dataVenc >= hoje && dataVenc <= fimSemana;
          case "proxima-semana":
            return dataVenc >= inicioProximaSemana && dataVenc <= fimProximaSemana;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [atividades, searchQuery, filtroPeriodo]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatHorario = (dueAt: string | undefined) => {
    if (!dueAt) return "—";
    const date = new Date(dueAt);
    const horas = date.getHours().toString().padStart(2, "0");
    const minutos = date.getMinutes().toString().padStart(2, "0");
    return `${horas}:${minutos}`;
  };

  const toggleSelectAtividade = (id: number) => {
    setSelectedAtividades((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedAtividades.size === atividadesFiltradas.length) {
      setSelectedAtividades(new Set());
    } else {
      setSelectedAtividades(new Set(atividadesFiltradas.map((a) => a.id)));
    }
  };

  const getStatusData = (dataVencimento?: string): "vencida" | "hoje" | "futura" => {
    if (!dataVencimento) return "futura";
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataVenc = new Date(dataVencimento);
    dataVenc.setHours(0, 0, 0, 0);
    
    if (dataVenc.getTime() < hoje.getTime()) {
      return "vencida";
    } else if (dataVenc.getTime() === hoje.getTime()) {
      return "hoje";
    } else {
      return "futura";
    }
  };

  const getCorTexto = (dataVencimento?: string): string => {
    const status = getStatusData(dataVencimento);
    switch (status) {
      case "vencida":
        return "text-red-600";
      case "hoje":
        return "text-green-600";
      case "futura":
        return "text-gray-900";
      default:
        return "text-gray-900";
    }
  };

  const isVencida = (dataVencimento?: string) => {
    return getStatusData(dataVencimento) === "vencida";
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <NavBar />

      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/home" className="hover:text-gray-700 flex items-center gap-1">
            <Home className="h-4 w-4" />
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/perfil" className="hover:text-gray-700">
            Perfil
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Atividades</span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#004225] rounded-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Atividades</h1>
                <p className="text-sm text-gray-500">
                  Centralize todas as atividades de todos os projetos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {atividadesFiltradas.length} atividade{atividadesFiltradas.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Barra de busca e filtros */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar atividades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtros de período */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
            {[
              { value: "tudo", label: "Tudo" },
              { value: "vencido", label: "Vencido" },
              { value: "hoje", label: "Hoje" },
              { value: "amanha", label: "Amanhã" },
              { value: "esta-semana", label: "Esta semana" },
              { value: "proxima-semana", label: "Próxima semana" },
            ].map((periodo) => (
              <button
                key={periodo.value}
                onClick={() => setFiltroPeriodo(periodo.value)}
                className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                  filtroPeriodo === periodo.value
                    ? "bg-[#004225] text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                }`}
              >
                {periodo.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabela de Atividades */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <ResizableTable
            columnCount={10}
            defaultWidths={[50, 100, 300, 200, 200, 270, 200, 200, 200, 120]}
            minColumnWidth={60}
            className="text-sm"
          >
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedAtividades.size === atividadesFiltradas.length && atividadesFiltradas.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-[#004225] border-gray-300 rounded focus:ring-[#004225]"
                  />
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Concluído</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Assunto</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Contrato</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Pessoa de contato</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">E-mail</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Telefone</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Organização</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Data de vencimento</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Horário</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Atribuído a</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {atividadesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Nenhuma atividade encontrada</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {searchQuery || filtroPeriodo !== "tudo"
                        ? "Tente ajustar os filtros de busca"
                        : "Suas atividades pendentes aparecerão aqui"}
                    </p>
                  </td>
                </tr>
              ) : (
                atividadesFiltradas.map((atividade) => (
                  <tr
                    key={atividade.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      selectedAtividades.has(atividade.id) ? "bg-blue-50" : ""
                    } ${isVencida(atividade.activity.dueAt) ? "bg-red-50/30" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedAtividades.has(atividade.id)}
                        onChange={() => toggleSelectAtividade(atividade.id)}
                        className="w-4 h-4 text-[#004225] border-gray-300 rounded focus:ring-[#004225]"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="radio"
                        checked={atividade.activity.status === "COMPLETED"}
                        onChange={() => {}}
                        className="w-4 h-4 text-[#004225] border-gray-300 focus:ring-[#004225]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${getCorTexto(atividade.activity.dueAt)}`}>{atividade.activity.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className={getCorTexto(atividade.activity.dueAt)}>{atividade.projeto.nome}</span>
                        {atividade.projeto.codigo && (
                          <span className="text-xs text-gray-500 ml-1">({atividade.projeto.codigo})</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {atividade.pessoaContato ? (
                        <span className={getCorTexto(atividade.activity.dueAt)}>{atividade.pessoaContato.nome}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {atividade.pessoaContato?.email ? (
                        <a
                          href={`mailto:${atividade.pessoaContato.email}`}
                          className={`${getCorTexto(atividade.activity.dueAt)} hover:underline`}
                        >
                          {atividade.pessoaContato.email}
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {atividade.pessoaContato?.telefone ? (
                        <a
                          href={`tel:${atividade.pessoaContato.telefone}`}
                          className={`${getCorTexto(atividade.activity.dueAt)} hover:underline`}
                        >
                          {atividade.pessoaContato.telefone}
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {atividade.organizacao ? (
                        <span className={getCorTexto(atividade.activity.dueAt)}>{atividade.organizacao.nome}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {atividade.activity.dueAt ? (
                        <span className={`${getCorTexto(atividade.activity.dueAt)} font-medium`}>
                          {formatDate(atividade.activity.dueAt)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={getCorTexto(atividade.activity.dueAt)}>{formatHorario(atividade.activity.dueAt)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {atividade.atribuidoA ? (
                        <span className={getCorTexto(atividade.activity.dueAt)}>{atividade.atribuidoA}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </ResizableTable>
        </div>
      </div>
    </div>
  );
}
