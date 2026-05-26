"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { NavBar } from "@/components/ui/NavBar";
import {
  FornecedoresHeader,
  FornecedoresFilters,
  FornecedoresTable,
  FornecedoresGrid,
  NovoFornecedorModal,
} from "./_components";
import { createCompany, listCompanies } from "@/src/lib/api/endpoints";
import { type Fornecedor, type FornecedoresFiltersState, INITIAL_FILTERS_STATE } from "./types";
import {
  getFriendlyApiError,
  mapCompanyToFornecedor,
  mapFornecedorFormToCompanyRequestDTO,
} from "./mappers";

type ViewMode = "table" | "grid";

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [filters, setFilters] = useState<FornecedoresFiltersState>(INITIAL_FILTERS_STATE);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadFornecedores = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const first = await listCompanies({ page: 0, size: 100 });
      let all = [...first.content];
      for (let page = 1; page < first.totalPages; page += 1) {
        const next = await listCompanies({ page, size: 100 });
        all = all.concat(next.content);
      }
      setFornecedores(all.map(mapCompanyToFornecedor));
    } catch (error) {
      setLoadError(getFriendlyApiError(error));
      setFornecedores([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFornecedores();
  }, [loadFornecedores]);

  const filteredFornecedores = useMemo(() => {
    let result = [...fornecedores];

    if (filters.q) {
      const searchLower = filters.q.toLowerCase();
      result = result.filter(
        (f) =>
          f.nome.toLowerCase().includes(searchLower) ||
          f.razaoSocial?.toLowerCase().includes(searchLower) ||
          f.cnpj?.includes(searchLower)
      );
    }

    if (filters.uf) result = result.filter((f) => f.uf === filters.uf);
    if (filters.municipio) result = result.filter((f) => f.municipio === filters.municipio);
    if (filters.status) result = result.filter((f) => f.status === filters.status);

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

  const totalFornecedores = fornecedores.length;
  const totalAtivos = fornecedores.filter((f) => f.status === "ATIVO").length;
  const totalInativos = fornecedores.filter((f) => f.status === "INATIVO").length;
  const totalFiltrados = filteredFornecedores.length;

  const handleFiltersChange = useCallback((newFilters: FornecedoresFiltersState) => {
    setFilters(newFilters);
  }, []);

  const handleNovoFornecedor = useCallback(
    async (novoFornecedor: Omit<Fornecedor, "id" | "createdAt">) => {
      const created = await createCompany(
        mapFornecedorFormToCompanyRequestDTO(novoFornecedor as Omit<Fornecedor, "id" | "createdAt" | "updatedAt">)
      );
      setFornecedores((prev) => [mapCompanyToFornecedor(created), ...prev]);
      setIsModalOpen(false);
    },
    []
  );

  return (
    <div className="min-h-screen liquid-glass-bg">
      <NavBar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <FornecedoresHeader
            totalFornecedores={totalFornecedores}
            totalAtivos={totalAtivos}
            totalInativos={totalInativos}
            totalFiltrados={totalFiltrados}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onNovoFornecedor={() => setIsModalOpen(true)}
          />

          {loadError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {loadError}
            </div>
          )}

          <FornecedoresFilters filters={filters} onFiltersChange={handleFiltersChange} />

          <div className="h-[calc(100vh-300px)] min-h-[800px]">
            {isLoading ? (
              <FornecedoresLoadingSkeleton viewMode={viewMode} />
            ) : viewMode === "table" ? (
              <FornecedoresTable
                fornecedores={filteredFornecedores}
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
                <FornecedoresGrid
                  fornecedores={filteredFornecedores}
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <NovoFornecedorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => void handleNovoFornecedor(data)}
      />
    </div>
  );
}

function FornecedoresLoadingSkeleton({ viewMode }: { viewMode: "table" | "grid" }) {
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`fornecedores-grid-loading-${index}`}
            className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="h-5 w-2/3 rounded bg-gray-200" />
            <div className="mt-3 h-4 w-1/2 rounded bg-gray-200" />
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="h-12 rounded bg-gray-200" />
              <div className="h-12 rounded bg-gray-200" />
            </div>
            <div className="mt-4 h-4 w-full rounded bg-gray-200" />
            <div className="mt-2 h-4 w-5/6 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="h-4 w-72 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="divide-y divide-gray-200">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={`fornecedores-table-loading-${index}`} className="grid animate-pulse grid-cols-6 gap-4 px-4 py-4">
            <div className="h-4 rounded bg-gray-200" />
            <div className="h-4 rounded bg-gray-200" />
            <div className="h-4 rounded bg-gray-200" />
            <div className="h-4 rounded bg-gray-200" />
            <div className="h-4 rounded bg-gray-200" />
            <div className="h-4 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

