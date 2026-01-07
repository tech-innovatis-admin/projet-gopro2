"use client";

import { useState, useMemo, useCallback } from "react";
import { NavBar } from "@/components/ui/NavBar";
import {
  FornecedoresHeader,
  FornecedoresFilters,
  FornecedoresTable,
  NovoFornecedorModal,
} from "./_components";
import { MOCK_FORNECEDORES } from "./mockData";
import {
  type Fornecedor,
  type FornecedoresFiltersState,
  INITIAL_FILTERS_STATE,
} from "./types";

// =============================================================================
// PÁGINA PRINCIPAL DO MÓDULO DE FORNECEDORES
// =============================================================================

export default function FornecedoresPage() {
  // Estado local dos fornecedores (simula estado da API)
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>(MOCK_FORNECEDORES);

  // Estado dos filtros
  const [filters, setFilters] = useState<FornecedoresFiltersState>(INITIAL_FILTERS_STATE);

  // Estado do modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filtra e ordena fornecedores
  const filteredFornecedores = useMemo(() => {
    let result = [...fornecedores];

    // Filtro por busca (nome)
    if (filters.q) {
      const searchLower = filters.q.toLowerCase();
      result = result.filter(
        (f) =>
          f.nome.toLowerCase().includes(searchLower) ||
          f.razaoSocial?.toLowerCase().includes(searchLower) ||
          f.cnpj?.includes(searchLower)
      );
    }

    // Filtro por UF
    if (filters.uf) {
      result = result.filter((f) => f.uf === filters.uf);
    }

    // Filtro por município
    if (filters.municipio) {
      result = result.filter((f) => f.municipio === filters.municipio);
    }

    // Filtro por status
    if (filters.status) {
      result = result.filter((f) => f.status === filters.status);
    }

    // Filtro por categorias (OR - se fornecedor tem alguma das categorias selecionadas)
    if (filters.categorias.length > 0) {
      result = result.filter((f) =>
        f.categorias.some((cat) => filters.categorias.includes(cat))
      );
    }

    // Filtro por serviços (OR - se fornecedor tem algum dos serviços selecionados)
    if (filters.servicos.length > 0) {
      result = result.filter((f) =>
        f.servicos.some((serv) => filters.servicos.includes(serv))
      );
    }

    // Ordenação
    result.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case "nome":
          comparison = a.nome.localeCompare(b.nome, "pt-BR");
          break;
        case "uf":
          comparison = a.uf.localeCompare(b.uf);
          break;
        case "municipio":
          comparison = a.municipio.localeCompare(b.municipio, "pt-BR");
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return filters.sortDir === "asc" ? comparison : -comparison;
    });

    return result;
  }, [fornecedores, filters]);

  // Contadores
  const totalFornecedores = fornecedores.length;
  const totalAtivos = fornecedores.filter((f) => f.status === "ATIVO").length;
  const totalInativos = fornecedores.filter((f) => f.status === "INATIVO").length;
  const totalFiltrados = filteredFornecedores.length;

  // Handler para mudança de filtros
  const handleFiltersChange = useCallback((newFilters: FornecedoresFiltersState) => {
    setFilters(newFilters);
  }, []);

  // Handler para criar novo fornecedor (mock - adiciona ao estado local)
  const handleNovoFornecedor = useCallback(
    (novoFornecedor: Omit<Fornecedor, "id" | "createdAt">) => {
      const fornecedor: Fornecedor = {
        ...novoFornecedor,
        id: `forn_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };

      setFornecedores((prev) => [fornecedor, ...prev]);
    },
    []
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100">
      <NavBar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <FornecedoresHeader
            totalFornecedores={totalFornecedores}
            totalAtivos={totalAtivos}
            totalInativos={totalInativos}
            totalFiltrados={totalFiltrados}
            onNovoFornecedor={() => setIsModalOpen(true)}
          />

          {/* Filtros */}
          <FornecedoresFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />

          {/* Tabela */}
          <div className="h-[calc(100vh-380px)] min-h-[400px]">
            <FornecedoresTable
              fornecedores={filteredFornecedores}
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </div>
        </div>
      </main>

      {/* Modal Novo Fornecedor */}
      <NovoFornecedorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleNovoFornecedor}
      />
    </div>
  );
}
