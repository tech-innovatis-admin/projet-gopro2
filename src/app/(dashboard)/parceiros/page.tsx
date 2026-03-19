"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { NavBar } from "@/components/ui/NavBar";
import { createPartner, listPartners, listProjects } from "@/src/lib/api/endpoints";
import type { ProjectResponseDTO } from "@/src/lib/api/types";
import {
  ParceirosHeader,
  ParceirosFilters,
  ParceirosGrid,
  NovoParceiroModal,
} from "./_components";
import {
  getFriendlyApiError,
  mapParceiroFormToPartnerRequestDTO,
  mapPartnerToParceiro,
} from "./mappers";
import { INITIAL_FILTERS_STATE } from "./types";
import type { Parceiro, ParceirosFiltersState } from "./types";

// =============================================================================
// PAGINA PRINCIPAL DE PARCEIROS
// =============================================================================

export default function ParceirosPage() {
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [projects, setProjects] = useState<ProjectResponseDTO[]>([]);
  const [filters, setFilters] = useState<ParceirosFiltersState>(INITIAL_FILTERS_STATE);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadParceiros = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [partnersResponse, projectsResponse] = await Promise.all([
        listPartners({ page: 0, size: 20 }),
        listProjects({ page: 0, size: 20 }),
      ]);

      setProjects(projectsResponse.content);
      setParceiros(
        partnersResponse.content.map((partner) =>
          mapPartnerToParceiro(partner, projectsResponse.content)
        )
      );
    } catch (loadError) {
      setError(getFriendlyApiError(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadParceiros();
  }, [loadParceiros]);

  const filteredParceiros = useMemo(() => {
    let result = [...parceiros];

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

    if (filters.tipo) {
      result = result.filter((p) => p.tipo === filters.tipo);
    }

    if (filters.uf) {
      result = result.filter((p) => p.uf === filters.uf);
    }

    if (filters.status) {
      result = result.filter((p) => p.status === filters.status);
    }

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

  const counts = useMemo(() => {
    const total = parceiros.length;
    const ifes = parceiros.filter((p) => p.tipo === "IFES").length;
    const fundacoes = parceiros.filter((p) => p.tipo === "FUNDACAO").length;
    const ativos = parceiros.filter((p) => p.status === "ATIVO").length;

    return { total, ifes, fundacoes, ativos };
  }, [parceiros]);

  const handleFiltersChange = useCallback((newFilters: ParceirosFiltersState) => {
    setFilters(newFilters);
  }, []);

  const handleAddParceiro = useCallback(
    async (data: Omit<Parceiro, "id" | "createdAt" | "contratosAtivos" | "valorTotalContratos">) => {
      const cnpjDigits = (data.cnpj ?? "").replace(/\D/g, "");
      if (cnpjDigits.length !== 14) {
        throw new Error("Informe um CNPJ válido com 14 dígitos.");
      }

      try {
        const created = await createPartner(mapParceiroFormToPartnerRequestDTO(data));
        const mapped = mapPartnerToParceiro(created, projects);
        setParceiros((prev) => [mapped, ...prev]);
        setError(null);
      } catch (createError) {
        throw new Error(getFriendlyApiError(createError));
      }
    },
    [projects]
  );

  return (
    <div className="min-h-screen liquid-glass-bg">
      <NavBar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <ParceirosHeader
            totalParceiros={counts.total}
            totalIfes={counts.ifes}
            totalFundacoes={counts.fundacoes}
            totalAtivos={counts.ativos}
            totalFiltrados={filteredParceiros.length}
            onNovoParceiro={() => setIsModalOpen(true)}
          />

          <ParceirosFilters filters={filters} onFiltersChange={handleFiltersChange} />

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div className="flex items-center justify-between gap-3">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => void loadParceiros()}
                  className="rounded-md bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200 transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#004225]" />
              <p className="mt-4 text-sm text-gray-500">Carregando parceiros...</p>
            </div>
          ) : (
            <ParceirosGrid
              parceiros={filteredParceiros}
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          )}
        </div>
      </main>

      <NovoParceiroModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddParceiro}
      />
    </div>
  );
}

