"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  DollarSign,
  TrendingUp,
  PieChart,
  Eye,
  Edit,
  MoreHorizontal,
  X,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

// Tipos
type Rubrica = {
  id: string;
  codigo: string;
  descricao: string;
  naturezaDespesa: string;
  categoria: string;
  valorPrevisto: number;
  valorEmpenhado: number;
  valorLiquidado: number;
  valorPago: number;
};

// Mock de dados
const mockRubricas: Rubrica[] = [
  {
    id: "1",
    codigo: "3.3.90.30",
    descricao: "Material de Consumo",
    naturezaDespesa: "Custeio",
    categoria: "Materiais",
    valorPrevisto: 150000,
    valorEmpenhado: 142000,
    valorLiquidado: 128000,
    valorPago: 120000,
  },
  {
    id: "2",
    codigo: "3.3.90.35",
    descricao: "Serviços de Consultoria",
    naturezaDespesa: "Custeio",
    categoria: "Serviços",
    valorPrevisto: 350000,
    valorEmpenhado: 350000,
    valorLiquidado: 280000,
    valorPago: 245000,
  },
  {
    id: "3",
    codigo: "3.3.90.39",
    descricao: "Outros Serviços de Terceiros - PJ",
    naturezaDespesa: "Custeio",
    categoria: "Serviços",
    valorPrevisto: 280000,
    valorEmpenhado: 265000,
    valorLiquidado: 198000,
    valorPago: 175000,
  },
  {
    id: "4",
    codigo: "4.4.90.52",
    descricao: "Equipamentos e Material Permanente",
    naturezaDespesa: "Capital",
    categoria: "Equipamentos",
    valorPrevisto: 220000,
    valorEmpenhado: 195000,
    valorLiquidado: 120000,
    valorPago: 110000,
  },
  {
    id: "5",
    codigo: "3.3.90.36",
    descricao: "Outros Serviços de Terceiros - PF",
    naturezaDespesa: "Custeio",
    categoria: "Serviços",
    valorPrevisto: 120000,
    valorEmpenhado: 98000,
    valorLiquidado: 72000,
    valorPago: 65000,
  },
  {
    id: "6",
    codigo: "3.3.90.47",
    descricao: "Obrigações Tributárias e Contributivas",
    naturezaDespesa: "Custeio",
    categoria: "Tributos",
    valorPrevisto: 80000,
    valorEmpenhado: 75000,
    valorLiquidado: 68000,
    valorPago: 62000,
  },
  {
    id: "7",
    codigo: "3.3.90.33",
    descricao: "Passagens e Despesas com Locomoção",
    naturezaDespesa: "Custeio",
    categoria: "Viagens",
    valorPrevisto: 35000,
    valorEmpenhado: 28000,
    valorLiquidado: 22000,
    valorPago: 18000,
  },
  {
    id: "8",
    codigo: "3.3.90.14",
    descricao: "Diárias",
    naturezaDespesa: "Custeio",
    categoria: "Viagens",
    valorPrevisto: 15000,
    valorEmpenhado: 12000,
    valorLiquidado: 9500,
    valorPago: 8000,
  },
];

// Cálculos totais
const totais = mockRubricas.reduce(
  (acc, r) => ({
    previsto: acc.previsto + r.valorPrevisto,
    empenhado: acc.empenhado + r.valorEmpenhado,
    liquidado: acc.liquidado + r.valorLiquidado,
    pago: acc.pago + r.valorPago,
  }),
  { previsto: 0, empenhado: 0, liquidado: 0, pago: 0 }
);

const saldoAExecutar = totais.previsto - totais.liquidado;
const percentualExecutado = Math.round((totais.liquidado / totais.previsto) * 100);

// Agrupa por categoria para o "gráfico"
const porCategoria = mockRubricas.reduce((acc, r) => {
  if (!acc[r.categoria]) {
    acc[r.categoria] = { previsto: 0, liquidado: 0 };
  }
  acc[r.categoria].previsto += r.valorPrevisto;
  acc[r.categoria].liquidado += r.valorLiquidado;
  return acc;
}, {} as Record<string, { previsto: number; liquidado: number }>);

export default function ContratoRubricasPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategoria, setFilterCategoria] = useState<string>("TODOS");
  const [filterNatureza, setFilterNatureza] = useState<string>("TODOS");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Rubrica | null;
    direction: "asc" | "desc";
  }>({ key: "valorPrevisto", direction: "desc" });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Categorias e naturezas únicas
  const categorias = [...new Set(mockRubricas.map((r) => r.categoria))];
  const naturezas = [...new Set(mockRubricas.map((r) => r.naturezaDespesa))];

  // Filtragem
  const filtered = useMemo(() => {
    let result = mockRubricas
      .filter((r) => (filterCategoria === "TODOS" ? true : r.categoria === filterCategoria))
      .filter((r) => (filterNatureza === "TODOS" ? true : r.naturezaDespesa === filterNatureza))
      .filter((r) =>
        searchQuery
          ? `${r.codigo} ${r.descricao} ${r.naturezaDespesa}`
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
  }, [filterCategoria, filterNatureza, searchQuery, sortConfig]);

  const handleSort = (key: keyof Rubrica) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const hasActiveFilters = filterCategoria !== "TODOS" || filterNatureza !== "TODOS" || searchQuery;

  const clearFilters = () => {
    setFilterCategoria("TODOS");
    setFilterNatureza("TODOS");
    setSearchQuery("");
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header da Aba */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Rubricas</h2>
          <p className="text-sm text-gray-500">
            Distribuição orçamentária e execução financeira por rubrica.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors">
          <Plus className="h-4 w-4" />
          Nova Rubrica
        </button>
      </div>

      {/* Cards de Resumo Financeiro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Valor Total Previsto</span>
            <DollarSign className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            R$ {(totais.previsto / 1000000).toFixed(2)}M
          </p>
          <p className="text-xs text-gray-500 mt-1">{mockRubricas.length} rubricas</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Valor Liquidado</span>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            R$ {(totais.liquidado / 1000).toFixed(0)}k
          </p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${percentualExecutado}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-600">{percentualExecutado}%</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Saldo a Executar</span>
            <PieChart className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600">
            R$ {(saldoAExecutar / 1000).toFixed(0)}k
          </p>
          <p className="text-xs text-gray-500 mt-1">{100 - percentualExecutado}% restante</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Status Geral</span>
            {percentualExecutado >= 90 ? (
              <AlertCircle className="h-5 w-5 text-amber-500" />
            ) : (
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            )}
          </div>
          <p
            className={`text-lg font-bold ${
              percentualExecutado >= 90 ? "text-amber-600" : "text-emerald-600"
            }`}
          >
            {percentualExecutado >= 90 ? "Atenção" : "Normal"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {percentualExecutado >= 90 ? "Próximo do limite" : "Dentro do planejado"}
          </p>
        </div>
      </div>

      {/* Gráfico simplificado - Top Rubricas por Categoria */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Categoria</h3>
        <div className="space-y-4">
          {Object.entries(porCategoria)
            .sort((a, b) => b[1].previsto - a[1].previsto)
            .map(([categoria, valores]) => {
              const percent = Math.round((valores.liquidado / valores.previsto) * 100);
              const percentTotal = Math.round((valores.previsto / totais.previsto) * 100);
              return (
                <div key={categoria}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{categoria}</span>
                      <span className="text-gray-400">({percentTotal}% do total)</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500">
                        R$ {(valores.liquidado / 1000).toFixed(0)}k / R${" "}
                        {(valores.previsto / 1000).toFixed(0)}k
                      </span>
                      <span className="font-medium text-gray-900 w-12 text-right">{percent}%</span>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percent >= 90
                          ? "bg-amber-500"
                          : percent >= 70
                          ? "bg-emerald-500"
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código ou descrição..."
              className="w-full h-10 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
          >
            <option value="TODOS">Todas as categorias</option>
            {categorias.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            className="h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
            value={filterNatureza}
            onChange={(e) => setFilterNatureza(e.target.value)}
          >
            <option value="TODOS">Todas as naturezas</option>
            {naturezas.map((nat) => (
              <option key={nat} value={nat}>
                {nat}
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

      {/* Tabela de Rubricas */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-10 px-2 py-3" />
                <Th onClick={() => handleSort("codigo")} sortable>
                  Código
                  <SortIcon column="codigo" sortConfig={sortConfig} />
                </Th>
                <Th onClick={() => handleSort("descricao")} sortable>
                  Descrição
                  <SortIcon column="descricao" sortConfig={sortConfig} />
                </Th>
                <Th>Natureza</Th>
                <Th>Categoria</Th>
                <Th onClick={() => handleSort("valorPrevisto")} sortable className="text-right">
                  Previsto
                  <SortIcon column="valorPrevisto" sortConfig={sortConfig} />
                </Th>
                <Th onClick={() => handleSort("valorEmpenhado")} sortable className="text-right">
                  Empenhado
                  <SortIcon column="valorEmpenhado" sortConfig={sortConfig} />
                </Th>
                <Th onClick={() => handleSort("valorLiquidado")} sortable className="text-right">
                  Liquidado
                  <SortIcon column="valorLiquidado" sortConfig={sortConfig} />
                </Th>
                <Th className="text-right">% Exec.</Th>
                <Th className="text-right">Saldo</Th>
                <Th className="text-center">Ações</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <DollarSign className="h-12 w-12 text-gray-300" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Nenhuma rubrica encontrada
                        </p>
                        <p className="text-sm text-gray-500">
                          Tente ajustar os filtros ou adicione uma nova rubrica.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((rubrica) => {
                  const percentExec = Math.round(
                    (rubrica.valorLiquidado / rubrica.valorPrevisto) * 100
                  );
                  const saldo = rubrica.valorPrevisto - rubrica.valorLiquidado;
                  const isExpanded = expandedRows.has(rubrica.id);

                  return (
                    <>
                      <tr
                        key={rubrica.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => toggleRow(rubrica.id)}
                      >
                        <td className="px-2 py-3">
                          <button className="p-1 hover:bg-gray-100 rounded">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-500" />
                            )}
                          </button>
                        </td>
                        <Td className="font-mono text-sm font-medium">{rubrica.codigo}</Td>
                        <Td>
                          <p className="text-sm font-medium text-gray-900 max-w-[200px] truncate">
                            {rubrica.descricao}
                          </p>
                        </Td>
                        <Td>
                          <NaturezaBadge natureza={rubrica.naturezaDespesa} />
                        </Td>
                        <Td className="text-sm text-gray-600">{rubrica.categoria}</Td>
                        <Td className="text-right font-medium">
                          R$ {rubrica.valorPrevisto.toLocaleString("pt-BR")}
                        </Td>
                        <Td className="text-right text-gray-600">
                          R$ {rubrica.valorEmpenhado.toLocaleString("pt-BR")}
                        </Td>
                        <Td className="text-right text-emerald-600 font-medium">
                          R$ {rubrica.valorLiquidado.toLocaleString("pt-BR")}
                        </Td>
                        <Td className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  percentExec >= 90
                                    ? "bg-amber-500"
                                    : percentExec >= 70
                                    ? "bg-emerald-500"
                                    : "bg-blue-500"
                                }`}
                                style={{ width: `${Math.min(percentExec, 100)}%` }}
                              />
                            </div>
                            <span
                              className={`text-sm font-medium ${
                                percentExec >= 90 ? "text-amber-600" : "text-gray-900"
                              }`}
                            >
                              {percentExec}%
                            </span>
                          </div>
                        </Td>
                        <Td className="text-right text-blue-600 font-medium">
                          R$ {saldo.toLocaleString("pt-BR")}
                        </Td>
                        <Td>
                          <div
                            className="flex items-center justify-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
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
                      {isExpanded && (
                        <tr key={`${rubrica.id}-detail`} className="bg-gray-50">
                          <td colSpan={11} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Detalhe de valores */}
                              <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-gray-900">
                                  Detalhamento Financeiro
                                </h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Valor Previsto</span>
                                    <span className="font-medium">
                                      R$ {rubrica.valorPrevisto.toLocaleString("pt-BR")}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Valor Empenhado</span>
                                    <span className="font-medium text-blue-600">
                                      R$ {rubrica.valorEmpenhado.toLocaleString("pt-BR")}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Valor Liquidado</span>
                                    <span className="font-medium text-emerald-600">
                                      R$ {rubrica.valorLiquidado.toLocaleString("pt-BR")}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Valor Pago</span>
                                    <span className="font-medium text-purple-600">
                                      R$ {rubrica.valorPago.toLocaleString("pt-BR")}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Mini gráfico de barras */}
                              <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-gray-900">
                                  Evolução de Execução
                                </h4>
                                <div className="h-32 flex items-end gap-2">
                                  {[
                                    { label: "Prev", value: rubrica.valorPrevisto, color: "bg-gray-300" },
                                    { label: "Emp", value: rubrica.valorEmpenhado, color: "bg-blue-400" },
                                    { label: "Liq", value: rubrica.valorLiquidado, color: "bg-emerald-400" },
                                    { label: "Pago", value: rubrica.valorPago, color: "bg-purple-400" },
                                  ].map((item) => {
                                    const height = (item.value / rubrica.valorPrevisto) * 100;
                                    return (
                                      <div key={item.label} className="flex-1 flex flex-col items-center gap-1">
                                        <div
                                          className={`w-full ${item.color} rounded-t transition-all`}
                                          style={{ height: `${height}%` }}
                                        />
                                        <span className="text-xs text-gray-500">{item.label}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Lançamentos recentes (placeholder) */}
                              <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-gray-900">
                                  Últimos Lançamentos
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center justify-between p-2 bg-white rounded border">
                                    <span className="text-gray-600">Pagamento NF 1234</span>
                                    <span className="text-emerald-600 font-medium">-R$ 15.000</span>
                                  </div>
                                  <div className="flex items-center justify-between p-2 bg-white rounded border">
                                    <span className="text-gray-600">Empenho 2025NE00456</span>
                                    <span className="text-blue-600 font-medium">R$ 25.000</span>
                                  </div>
                                  <div className="flex items-center justify-between p-2 bg-white rounded border">
                                    <span className="text-gray-600">Liquidação OS-003</span>
                                    <span className="text-purple-600 font-medium">R$ 18.500</span>
                                  </div>
                                </div>
                                <button className="text-sm text-[#004225] hover:underline">
                                  Ver todos os lançamentos →
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
            {/* Footer com totais */}
            {filtered.length > 0 && (
              <tfoot className="bg-gray-100 font-semibold">
                <tr>
                  <td className="px-2 py-3" />
                  <td className="px-4 py-3" colSpan={4}>
                    TOTAL ({filtered.length} rubricas)
                  </td>
                  <td className="px-4 py-3 text-right">
                    R${" "}
                    {filtered
                      .reduce((acc, r) => acc + r.valorPrevisto, 0)
                      .toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    R${" "}
                    {filtered
                      .reduce((acc, r) => acc + r.valorEmpenhado, 0)
                      .toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-600">
                    R${" "}
                    {filtered
                      .reduce((acc, r) => acc + r.valorLiquidado, 0)
                      .toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {Math.round(
                      (filtered.reduce((acc, r) => acc + r.valorLiquidado, 0) /
                        filtered.reduce((acc, r) => acc + r.valorPrevisto, 0)) *
                        100
                    )}
                    %
                  </td>
                  <td className="px-4 py-3 text-right text-blue-600">
                    R${" "}
                    {filtered
                      .reduce((acc, r) => acc + (r.valorPrevisto - r.valorLiquidado), 0)
                      .toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              </tfoot>
            )}
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

function NaturezaBadge({ natureza }: { natureza: string }) {
  const isCapital = natureza === "Capital";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isCapital ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
      }`}
    >
      {natureza}
    </span>
  );
}
