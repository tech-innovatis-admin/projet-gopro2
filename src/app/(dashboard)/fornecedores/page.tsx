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
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                Carregando fornecedores...
              </div>
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

