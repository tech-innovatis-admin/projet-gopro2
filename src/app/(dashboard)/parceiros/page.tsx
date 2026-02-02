"use client";

import { useState, useMemo, useCallback } from "react";
import { NavBar } from "@/components/ui/NavBar";
import {
  ParceirosHeader,
  ParceirosFilters,
  ParceirosGrid,
  NovoParceiroModal,
} from "./_components";
import { MOCK_PARCEIROS } from "./mockData";
import { INITIAL_FILTERS_STATE } from "./types";
import type { Parceiro, ParceirosFiltersState } from "./types";

// =============================================================================
// PÁGINA PRINCIPAL DE PARCEIROS
// =============================================================================

// Gera ID mock
const generateMockId = () => `p${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function ParceirosPage() {
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------
  const [parceiros, setParceiros] = useState<Parceiro[]>(MOCK_PARCEIROS);
  const [filters, setFilters] = useState<ParceirosFiltersState>(INITIAL_FILTERS_STATE);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ---------------------------------------------------------------------------
  // FILTRAGEM E ORDENAÇÃO
  // ---------------------------------------------------------------------------
  const filteredParceiros = useMemo(() => {
    let result = [...parceiros];

    // Filtro por busca textual
    if (filters.q) {
      const search = filters.q.toLowerCase();
      result = result.filter(
        (p) =>
          p.nome.toLowerCase().includes(search) ||
          p.sigla?.toLowerCase().includes(search) ||
          p.municipio.toLowerCase().includes(search) ||
          p.uf.toLowerCase().includes(search)
      );
    }

    // Filtro por tipo
    if (filters.tipo) {
      result = result.filter((p) => p.tipo === filters.tipo);
    }

    // Filtro por UF
    if (filters.uf) {
      result = result.filter((p) => p.uf === filters.uf);
    }

    // Filtro por status
    if (filters.status) {
      result = result.filter((p) => p.status === filters.status);
    }

    // Ordenação
    const sortDir = filters.sortDir === "asc" ? 1 : -1;
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case "nome":
          return sortDir * a.nome.localeCompare(b.nome);
        case "municipio":
          return sortDir * a.municipio.localeCompare(b.municipio);
        case "uf":
          return sortDir * a.uf.localeCompare(b.uf);
        case "tipo":
          return sortDir * a.tipo.localeCompare(b.tipo);
        case "contratosAtivos":
          return sortDir * ((b.contratosAtivos ?? 0) - (a.contratosAtivos ?? 0));
        default:
          return 0;
      }
    });

    return result;
  }, [parceiros, filters]);

  // ---------------------------------------------------------------------------
  // CONTADORES
  // ---------------------------------------------------------------------------
  const counts = useMemo(() => {
    const total = parceiros.length;
    const ifes = parceiros.filter((p) => p.tipo === "IFES").length;
    const fundacoes = parceiros.filter((p) => p.tipo === "FUNDACAO").length;
    const ativos = parceiros.filter((p) => p.status === "ATIVO").length;

    return { total, ifes, fundacoes, ativos };
  }, [parceiros]);

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------
  const handleFiltersChange = useCallback((newFilters: ParceirosFiltersState) => {
    setFilters(newFilters);
  }, []);

  const handleAddParceiro = useCallback(
    (data: Omit<Parceiro, "id" | "createdAt" | "contratosAtivos" | "valorTotalContratos">) => {
      const newParceiro: Parceiro = {
        ...data,
        id: generateMockId(),
        createdAt: new Date().toISOString(),
        contratosAtivos: 0,
        valorTotalContratos: 0,
      };
      setParceiros((prev) => [newParceiro, ...prev]);
    },
    []
  );

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen liquid-glass-bg">
      <NavBar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header com título, contadores e ações */}
          <ParceirosHeader
            totalParceiros={counts.total}
            totalIfes={counts.ifes}
            totalFundacoes={counts.fundacoes}
            totalAtivos={counts.ativos}
            totalFiltrados={filteredParceiros.length}
            onNovoParceiro={() => setIsModalOpen(true)}
          />

          {/* Filtros */}
          <ParceirosFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />

          {/* Grid de Cards */}
          <ParceirosGrid
            parceiros={filteredParceiros}
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </div>
      </main>

      {/* Modal de Novo Parceiro */}
      <NovoParceiroModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddParceiro}
      />
    </div>
  );
}