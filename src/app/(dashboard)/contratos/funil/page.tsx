"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { NavBar } from "@/components/ui/NavBar";
import {
  ChevronRight,
  Home,
  Filter,
  Search,
  FileText,
  Users,
  X,
  Edit2,
} from "lucide-react";
import { 
  buildPipelineColumns, 
  formatCurrency, 
  type PipelineColumn, 
  type PipelineContract,
  MOCK_PIPELINE_CONTRACTS,
} from "./types";
import { PipelineBoard } from "./_components/PipelineBoard";
import { usePipelineStages } from "./context/PipelineStagesContext";

// =============================================================================
// FUNIL DE CONTRATOS - PÁGINA PRINCIPAL
// =============================================================================

export default function FunilContratosPage() {
  const { stages } = usePipelineStages();
  
  // Estado do pipeline
  const [columns, setColumns] = useState<PipelineColumn[]>(() => 
    buildPipelineColumns(stages)
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Filtros (estrutura preparada para expansão futura)
  const [filters, setFilters] = useState({
    type: "TODOS" as "TODOS" | "PROJETO" | "PRODUTO",
    coordinator: "",
    partner: "",
  });

  // Calcula totais agregados
  const allContracts = columns.flatMap(col => col.contracts);
  const totalValue = allContracts.reduce((sum, c) => sum + (c.totalValue || 0), 0);
  const totalContracts = allContracts.length;

  // Filtra contratos baseado na busca
  const filteredColumns = columns.map(col => ({
    ...col,
    contracts: col.contracts.filter(contract => {
      // Filtro de busca
      const matchesSearch = !searchQuery || 
        contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.partnerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.coordinatorName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filtro de tipo
      const matchesType = filters.type === "TODOS" || contract.type === filters.type;
      
      return matchesSearch && matchesType;
    }),
  }));

  // Handler para mover contrato entre colunas
  const handleMoveContract = useCallback(async (contractId: string, fromStageId: string, toStageId: string) => {
    // Atualização otimista do estado local
    setColumns(prevColumns => {
      const newColumns = prevColumns.map(col => ({
        ...col,
        contracts: [...col.contracts],
      }));

      // Encontra a coluna de origem e destino
      const fromColumn = newColumns.find(col => col.stage.id === fromStageId);
      const toColumn = newColumns.find(col => col.stage.id === toStageId);

      if (!fromColumn || !toColumn) return prevColumns;

      // Encontra o contrato
      const contractIndex = fromColumn.contracts.findIndex(c => c.id === contractId);
      if (contractIndex === -1) return prevColumns;

      // Remove da origem
      const [contract] = fromColumn.contracts.splice(contractIndex, 1);

      // Atualiza o contrato com novo estágio
      const updatedContract: PipelineContract = {
        ...contract,
        stageId: toStageId,
        stageEnteredAt: new Date().toISOString(),
        daysInStage: 0,
      };

      // Adiciona ao destino
      toColumn.contracts.push(updatedContract);

      // Recalcula totais
      fromColumn.totalValue = fromColumn.contracts.reduce((sum, c) => sum + (c.totalValue || 0), 0);
      toColumn.totalValue = toColumn.contracts.reduce((sum, c) => sum + (c.totalValue || 0), 0);

      // Verifica se é o estágio final
      if (toColumn.stage.isFinal) {
        // Aqui poderíamos abrir um modal de confirmação para iniciar o projeto
        console.log(`Contrato ${contract.title} está pronto para iniciar execução!`);
      }

      return newColumns;
    });

    // Chamar endpoint para registrar movimentação no histórico
    try {
      const response = await fetch(`/api/contratos/${contractId}/iniciacao/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromStageId, toStageId }),
      });

      if (!response.ok) {
        console.error("Erro ao registrar movimentação:", await response.text());
        // TODO: Em caso de erro, reverter a atualização otimista
      }
    } catch (error) {
      console.error("Erro ao chamar endpoint de movimentação:", error);
      // TODO: Em caso de erro, reverter a atualização otimista
    }
  }, []);


  // Handler para iniciar projeto (quando no estágio final)
  const handleStartProject = useCallback((contractId: string) => {
    setColumns(prevColumns => {
      return prevColumns.map(col => ({
        ...col,
        contracts: col.contracts.map(contract => {
          if (contract.id === contractId) {
            return {
              ...contract,
              executionStatus: "EM_EXECUCAO" as const,
            };
          }
          return contract;
        }).filter(contract => {
          // Remove o contrato do pipeline se iniciou execução
          return !(contract.id === contractId && contract.executionStatus === "EM_EXECUCAO");
        }),
      }));
    });
  }, []);

  // Limpar filtros
  const clearFilters = () => {
    setFilters({ type: "TODOS", coordinator: "", partner: "" });
    setSearchQuery("");
  };

  const hasActiveFilters = filters.type !== "TODOS" || searchQuery !== "";

  return (
    <div className="min-h-screen liquid-glass-bg">
      <NavBar />

      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6">
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
          <span className="text-gray-900 font-medium">Funil</span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Título e Contadores */}
            <div>
              <h1 className="text-2xl font-bold text-[#003319] mb-2">
                Funil de Iniciação de Contratos
              </h1>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span><strong>{totalContracts}</strong> contratos em preparação</span>
                </div>
                <div className="flex items-center gap-2">
                  <span><strong>{formatCurrency(totalValue)}</strong> em valor total</span>
                </div>
              </div>
            </div>

            {/* Busca e Filtros */}
            <div className="flex items-center gap-3">
              {/* Campo de Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar contrato..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Botão de Filtros */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${
                  hasActiveFilters
                    ? "bg-[#004225] text-white border-[#004225]"
                    : "text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Filter className="h-4 w-4" />
                Filtros
                {hasActiveFilters && (
                  <span className="bg-white text-[#004225] text-xs font-bold px-1.5 py-0.5 rounded-full">
                    !
                  </span>
                )}
              </button>

              {/* Botão de Editar Etapas */}
              <Link
                href="/contratos/funil/edit"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Editar etapas"
              >
                <Edit2 className="h-4 w-4" />
              </Link>

              {/* Limpar Filtros */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Painel de Filtros Expandível */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap items-center gap-4">
                {/* Filtro por Tipo */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Tipo:</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as typeof filters.type }))}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#004225]"
                  >
                    <option value="TODOS">Todos</option>
                    <option value="PROJETO">Projetos</option>
                    <option value="PRODUTO">Produtos</option>
                  </select>
                </div>

                {/* Placeholder para filtros futuros */}
                <div className="text-sm text-gray-400 italic">
                  Mais filtros em breve (coordenador, parceiro, período)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Kanban Board */}
        <PipelineBoard
          columns={filteredColumns}
          onMoveContract={handleMoveContract}
          onStartProject={handleStartProject}
        />
      </div>
    </div>
  );
}
