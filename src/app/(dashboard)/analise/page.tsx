"use client";

import { useState } from "react";
import { NavBar } from "@/components/ui/NavBar";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FolderOpen,
  Activity,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  Wallet,
  Users,
  FileText,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  MapPin,
  Star,
  RefreshCcw,
  Layers,
  BarChart3,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import {
  mockMetrics,
  mockAttentionProjects,
  mockMonthlyFinancials,
  mockStatusDistribution,
  mockByArea,
  mockThroughput,
  mockBudgetCategories,
  mockBudgetTransfers,
  mockSLAComparison,
  mockOpenActivities,
  mockPartners,
  mockClients,
  mockByRegion,
  mockSupplierRatings,
  mockProjectsBySaldo,
  mockDisbursementSchedule,
  formatCurrency,
  formatCurrencyCompact,
  formatPercent,
  PAGE_LABELS,
} from "./data";

import {
  MetricCard,
  HorizontalBarChart,
  LineChart,
  RankedTable,
  PageNavigation,
  FilterBar,
  StackedBarChart,
  SLAComparisonChart,
  defaultFilters,
} from "./_components";

// =============================================================================
// DASHBOARD DE ANÁLISE EXECUTIVO - 6 PÁGINAS
// =============================================================================

const TOTAL_PAGES = 6;

export default function AnalisePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState(defaultFilters);

  const goToNextPage = () => {
    setCurrentPage((prev) => (prev < TOTAL_PAGES ? prev + 1 : 1));
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : TOTAL_PAGES));
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  // Helpers
  const getVariant = (value: number, thresholds: { warning: number; danger: number }, inverted = false) => {
    if (inverted) {
      if (value >= thresholds.danger) return "danger";
      if (value >= thresholds.warning) return "warning";
      return "success";
    }
    if (value <= thresholds.danger) return "danger";
    if (value <= thresholds.warning) return "warning";
    return "success";
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F5F6F8]">
      <NavBar />

      <div className="flex-1 flex flex-col mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-3 overflow-hidden">
        {/* Header com navegação */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {PAGE_LABELS[currentPage - 1]}
            </h1>
            <p className="text-xs text-gray-500">
              Dashboard Executivo de Projetos
            </p>
          </div>
          
          <PageNavigation
            currentPage={currentPage}
            totalPages={TOTAL_PAGES}
            onPageChange={goToPage}
            pageLabels={PAGE_LABELS}
          />
        </div>

        {/* Barra de Filtros */}
        <FilterBar filters={filters} onFilterChange={setFilters} />

        {/* Conteúdo da página atual */}
        <div className="flex-1 overflow-hidden mt-3">
          
          {/* ================================================================ */}
          {/* PÁGINA 1 - RESUMO EXECUTIVO                                     */}
          {/* ================================================================ */}
          {currentPage === 1 && (
            <div className="h-full flex flex-col gap-3">
              {/* KPIs Principais - Alertas */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <MetricCard
                  title="Projetos em Execução"
                  value={mockMetrics.activeProjects}
                  subtitle={`de ${mockMetrics.totalProjects} projetos`}
                  icon={<FolderOpen className="h-4 w-4" />}
                  variant="info"
                />
                <MetricCard
                  title="% Atrasados"
                  value={`${mockMetrics.percentAtrasados}%`}
                  subtitle="projetos fora do prazo"
                  icon={<Clock className="h-4 w-4" />}
                  variant={getVariant(mockMetrics.percentAtrasados, { warning: 10, danger: 20 }, true)}
                  trend={{ value: 2.3, label: "%", positive: false }}
                  tooltip="Projetos com data fim real > data fim prevista"
                />
                <MetricCard
                  title="% Estouro Orçamento"
                  value={`${mockMetrics.percentEstouro}%`}
                  subtitle="projetos acima do previsto"
                  icon={<AlertTriangle className="h-4 w-4" />}
                  variant={getVariant(mockMetrics.percentEstouro, { warning: 8, danger: 15 }, true)}
                  tooltip="Executado > Planejado"
                />
                <MetricCard
                  title="Caixa Atual"
                  value={formatCurrencyCompact(mockMetrics.caixaAtual)}
                  subtitle="disponível em conta"
                  icon={<Wallet className="h-4 w-4" />}
                  variant="success"
                />
                <MetricCard
                  title="Contratos a Vencer"
                  value={mockMetrics.contratosVencer90Dias.quantidade}
                  subtitle={`${formatCurrencyCompact(mockMetrics.contratosVencer90Dias.valor)} em 90 dias`}
                  icon={<Calendar className="h-4 w-4" />}
                  variant="warning"
                  tooltip="Contratos com data fim nos próximos 90 dias"
                />
              </div>

              {/* Tabela "Atenção Agora" + IEE */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-3 min-h-0">
                {/* Tabela Atenção Agora */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      Atenção Agora
                    </h3>
                    <span className="text-xs text-gray-500">Top 10 projetos críticos</span>
                  </div>
                  <div className="flex-1 overflow-auto min-h-0">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left p-2 font-medium text-gray-600">Projeto</th>
                          <th className="text-center p-2 font-medium text-gray-600">Status</th>
                          <th className="text-right p-2 font-medium text-gray-600">Exec. Fin.</th>
                          <th className="text-right p-2 font-medium text-gray-600">Saldo</th>
                          <th className="text-right p-2 font-medium text-gray-600">Risco</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockAttentionProjects.map((p, i) => (
                          <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer">
                            <td className="p-2">
                              <div className="font-medium text-gray-900 truncate max-w-[180px]">{p.projeto}</div>
                              <div className="text-gray-500">{p.code}</div>
                            </td>
                            <td className="p-2 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                p.status === "Atrasado" ? "bg-red-100 text-red-700" :
                                p.status === "Estouro" ? "bg-orange-100 text-orange-700" :
                                p.status === "Atenção" ? "bg-yellow-100 text-yellow-700" :
                                p.status === "No prazo" ? "bg-green-100 text-green-700" :
                                "bg-gray-100 text-gray-700"
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="p-2 text-right">
                              <span className={p.execucaoFinanceira > 100 ? "text-red-600 font-medium" : ""}>
                                {formatPercent(p.execucaoFinanceira)}
                              </span>
                            </td>
                            <td className="p-2 text-right">
                              <span className={p.saldo < 0 ? "text-red-600" : p.saldo < 100000 ? "text-orange-600" : ""}>
                                {formatCurrencyCompact(p.saldo)}
                              </span>
                            </td>
                            <td className="p-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      p.riskScore >= 60 ? "bg-red-500" :
                                      p.riskScore >= 30 ? "bg-orange-500" : "bg-green-500"
                                    }`}
                                    style={{ width: `${p.riskScore}%` }}
                                  />
                                </div>
                                <span className="text-gray-600 w-6">{p.riskScore}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* IEE + Mini KPIs */}
                <div className="flex flex-col gap-3">
                  {/* IEE Gauge */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex-1 flex flex-col items-center justify-center">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">Índice de Eficiência Executiva</h3>
                    <div className="relative w-28 h-28">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle
                          cx="50" cy="50" r="40"
                          fill="none" stroke="#E5E7EB" strokeWidth="8"
                        />
                        <circle
                          cx="50" cy="50" r="40"
                          fill="none" 
                          stroke={mockMetrics.iee >= 80 ? "#22C55E" : mockMetrics.iee >= 60 ? "#F59E0B" : "#EF4444"}
                          strokeWidth="8"
                          strokeDasharray={`${mockMetrics.iee * 2.51} 251`}
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                        />
                        <text x="50" y="50" textAnchor="middle" dy="0.35em" className="text-xl font-bold fill-gray-900">
                          {mockMetrics.iee}%
                        </text>
                      </svg>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Combina prazo, orçamento e qualidade
                    </p>
                  </div>

                  {/* Mini metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                      <div className="text-xs text-gray-500">Burn Rate</div>
                      <div className="text-lg font-bold text-gray-900">{formatCurrencyCompact(mockMetrics.burnRateMensal)}</div>
                      <div className="text-xs text-gray-500">/mês</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                      <div className="text-xs text-gray-500">Runway</div>
                      <div className="text-lg font-bold text-gray-900">{mockMetrics.runwayMeses.toFixed(1)}</div>
                      <div className="text-xs text-gray-500">meses</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* PÁGINA 2 - PORTFÓLIO                                            */}
          {/* ================================================================ */}
          {currentPage === 2 && (
            <div className="h-full flex flex-col gap-3">
              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <MetricCard
                  title="Projetos Ativos"
                  value={mockMetrics.activeProjects}
                  subtitle={`WIP: ${mockMetrics.wip}`}
                  icon={<Layers className="h-4 w-4" />}
                  variant="info"
                />
                <MetricCard
                  title="Valor em Execução"
                  value={formatCurrencyCompact(mockMetrics.valorAtivos)}
                  subtitle="carteira ativa"
                  icon={<DollarSign className="h-4 w-4" />}
                />
                <MetricCard
                  title="Valor Concluído"
                  value={formatCurrencyCompact(mockMetrics.valorConcluidos)}
                  subtitle="no período"
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  variant="success"
                />
                <MetricCard
                  title="Taxa de Saída"
                  value={`${mockMetrics.taxaSaidaMensal}%`}
                  subtitle="projetos/mês"
                  icon={<ArrowUpRight className="h-4 w-4" />}
                />
                <MetricCard
                  title="Tempo Médio Exec."
                  value={`${mockMetrics.tempoMedioExecucao} m`}
                  subtitle="lead time"
                  icon={<Clock className="h-4 w-4" />}
                />
              </div>

              {/* Gráficos */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-0">
                {/* Status do Portfólio */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex flex-col">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Status do Portfólio</h3>
                  <div className="flex-1 min-h-0">
                    <HorizontalBarChart
                      data={mockStatusDistribution.map(s => ({
                        label: s.label,
                        value: s.value,
                        color: s.color,
                      }))}
                      valueLabel="projetos"
                    />
                  </div>
                </div>

                {/* Por Área/Segmento */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex flex-col">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Por Área/Segmento</h3>
                  <div className="flex-1 min-h-0">
                    <HorizontalBarChart
                      data={mockByArea.map(a => ({
                        label: a.area,
                        value: a.quantidade,
                        secondary: formatCurrencyCompact(a.valor),
                      }))}
                      valueLabel="projetos"
                    />
                  </div>
                </div>

                {/* Throughput */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex flex-col">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Throughput (Projetos Concluídos)</h3>
                  <div className="flex-1 min-h-0">
                    <LineChart
                      data={mockThroughput}
                      lines={[{ key: "concluidos", label: "Concluídos", color: "#22C55E" }]}
                      xKey="month"
                    />
                  </div>
                </div>

                {/* Tipo Projeto vs Produto */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex flex-col">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Valor Médio por Tipo</h3>
                  <div className="flex-1 flex items-center justify-center gap-8">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{formatCurrencyCompact(mockMetrics.valorMedioProjeto)}</div>
                      <div className="text-sm text-gray-500 mt-1">Projeto</div>
                      <div className="text-xs text-gray-400">média por contrato</div>
                    </div>
                    <div className="h-16 w-px bg-gray-200" />
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{formatCurrencyCompact(mockMetrics.valorMedioProduto)}</div>
                      <div className="text-sm text-gray-500 mt-1">Produto</div>
                      <div className="text-xs text-gray-400">média por contrato</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* PÁGINA 3 - FINANCEIRO                                           */}
          {/* ================================================================ */}
          {currentPage === 3 && (
            <div className="h-full flex flex-col gap-3">
              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <MetricCard
                  title="Valor Contratos"
                  value={formatCurrencyCompact(mockMetrics.valorTotalContratos)}
                  subtitle="total contratado"
                  icon={<FileText className="h-4 w-4" />}
                />
                <MetricCard
                  title="Total Recebido"
                  value={formatCurrencyCompact(mockMetrics.totalReceived)}
                  subtitle={`${formatPercent(mockMetrics.totalReceived / mockMetrics.valorTotalContratos * 100)} do contratado`}
                  icon={<ArrowDownRight className="h-4 w-4" />}
                  variant="success"
                />
                <MetricCard
                  title="Total Gasto"
                  value={formatCurrencyCompact(mockMetrics.totalExpenses)}
                  subtitle={`${formatPercent(mockMetrics.execucaoOrcamentaria)} execução`}
                  icon={<ArrowUpRight className="h-4 w-4" />}
                />
                <MetricCard
                  title="Saldo Disponível"
                  value={formatCurrencyCompact(mockMetrics.saldoTotal)}
                  subtitle="em conta"
                  icon={<Wallet className="h-4 w-4" />}
                  variant={mockMetrics.saldoTotal > 0 ? "success" : "danger"}
                />
                <MetricCard
                  title="Acurácia Recebimento"
                  value={`${mockMetrics.acuraciaRecebimento}%`}
                  subtitle="previsto vs real"
                  icon={<Target className="h-4 w-4" />}
                  variant={getVariant(mockMetrics.acuraciaRecebimento, { warning: 85, danger: 70 })}
                />
              </div>

              {/* Gráficos */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-0">
                {/* Recebido vs Gasto (Temporal) */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex flex-col">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Fluxo Financeiro Mensal</h3>
                  <div className="flex-1 min-h-0">
                    <LineChart
                      data={mockMonthlyFinancials}
                      lines={[
                        { key: "received", label: "Recebido", color: "#22C55E" },
                        { key: "spent", label: "Gasto", color: "#EF4444" },
                      ]}
                      xKey="label"
                      formatValue={(v) => formatCurrencyCompact(v)}
                    />
                  </div>
                </div>

                {/* Cronograma Desembolso */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex flex-col">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Cronograma de Desembolso</h3>
                  <div className="flex-1 min-h-0">
                    <LineChart
                      data={mockDisbursementSchedule}
                      lines={[
                        { key: "expected", label: "Previsto", color: "#9CA3AF" },
                        { key: "received", label: "Recebido", color: "#22C55E" },
                      ]}
                      xKey="month"
                      formatValue={(v) => formatCurrencyCompact(v)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* PÁGINA 4 - ORÇAMENTO E REMANEJAMENTOS                           */}
          {/* ================================================================ */}
          {currentPage === 4 && (
            <div className="h-full flex flex-col gap-3">
              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <MetricCard
                  title="Execução Orçamentária"
                  value={`${mockMetrics.execucaoOrcamentaria}%`}
                  subtitle="do previsto"
                  icon={<BarChart3 className="h-4 w-4" />}
                  variant={getVariant(mockMetrics.execucaoOrcamentaria, { warning: 60, danger: 40 })}
                />
                <MetricCard
                  title="Rubricas > 100%"
                  value={`${mockMetrics.percentRubricasAcima100}%`}
                  subtitle="em estouro"
                  icon={<AlertTriangle className="h-4 w-4" />}
                  variant={getVariant(mockMetrics.percentRubricasAcima100, { warning: 10, danger: 20 }, true)}
                />
                <MetricCard
                  title="Valor Remanejado"
                  value={formatCurrencyCompact(mockMetrics.valorRemanejado)}
                  subtitle={`${mockMetrics.taxaRemanejamento}% do orçamento`}
                  icon={<RefreshCcw className="h-4 w-4" />}
                />
                <MetricCard
                  title="Pendentes"
                  value={mockMetrics.remanejamentosPendentes.quantidade}
                  subtitle={formatCurrencyCompact(mockMetrics.remanejamentosPendentes.valor)}
                  icon={<Clock className="h-4 w-4" />}
                  variant="warning"
                />
              </div>

              {/* Gráficos */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-0">
                {/* Execução por Rubrica */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex flex-col">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Execução por Rubrica</h3>
                  <div className="flex-1 overflow-auto min-h-0">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left p-2 font-medium text-gray-600">Rubrica</th>
                          <th className="text-right p-2 font-medium text-gray-600">Previsto</th>
                          <th className="text-right p-2 font-medium text-gray-600">Executado</th>
                          <th className="text-right p-2 font-medium text-gray-600">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockBudgetCategories.map((cat) => {
                          const pct = (cat.executedAmount / cat.plannedAmount) * 100;
                          return (
                            <tr key={cat.id} className="border-t border-gray-100">
                              <td className="p-2 font-medium text-gray-900">{cat.name}</td>
                              <td className="p-2 text-right text-gray-600">{formatCurrencyCompact(cat.plannedAmount)}</td>
                              <td className="p-2 text-right text-gray-900">{formatCurrencyCompact(cat.executedAmount)}</td>
                              <td className="p-2 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${
                                        pct > 100 ? "bg-red-500" : pct > 90 ? "bg-orange-500" : "bg-green-500"
                                      }`}
                                      style={{ width: `${Math.min(pct, 100)}%` }}
                                    />
                                  </div>
                                  <span className={`w-10 text-right ${pct > 100 ? "text-red-600 font-medium" : ""}`}>
                                    {formatPercent(pct)}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Remanejamentos Recentes */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex flex-col">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Remanejamentos Recentes</h3>
                  <div className="flex-1 overflow-auto min-h-0">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left p-2 font-medium text-gray-600">Projeto</th>
                          <th className="text-left p-2 font-medium text-gray-600">De → Para</th>
                          <th className="text-right p-2 font-medium text-gray-600">Valor</th>
                          <th className="text-center p-2 font-medium text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockBudgetTransfers.map((t) => (
                          <tr key={t.id} className="border-t border-gray-100">
                            <td className="p-2 font-medium text-gray-900">{t.projectName}</td>
                            <td className="p-2 text-gray-600">
                              <span className="text-red-600">{t.fromItemName}</span>
                              <span className="mx-1">→</span>
                              <span className="text-green-600">{t.toItemName}</span>
                            </td>
                            <td className="p-2 text-right font-medium">{formatCurrencyCompact(t.amount)}</td>
                            <td className="p-2 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                t.status === 0 ? "bg-yellow-100 text-yellow-700" :
                                t.status === 1 ? "bg-green-100 text-green-700" :
                                "bg-red-100 text-red-700"
                              }`}>
                                {t.status === 0 ? "Pendente" : t.status === 1 ? "Aprovado" : "Rejeitado"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* PÁGINA 5 - TRILHA CONTRATUAL E SLA                              */}
          {/* ================================================================ */}
          {currentPage === 5 && (
            <div className="h-full flex flex-col gap-3">
              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <MetricCard
                  title="Lead Time Médio"
                  value={`${mockMetrics.leadTimeMedio}d`}
                  subtitle="contratação completa"
                  icon={<Clock className="h-4 w-4" />}
                />
                <MetricCard
                  title="Cumprimento SLA"
                  value={`${mockMetrics.cumprimentoSLA}%`}
                  subtitle="dentro do prazo"
                  icon={<Target className="h-4 w-4" />}
                  variant={getVariant(mockMetrics.cumprimentoSLA, { warning: 80, danger: 60 })}
                />
                <MetricCard
                  title="Etapa Gargalo"
                  value={mockMetrics.etapaGargalo}
                  subtitle={`${mockMetrics.tempoMedioPorEtapa}d média/etapa`}
                  icon={<AlertTriangle className="h-4 w-4" />}
                  variant="warning"
                />
                <MetricCard
                  title="Backlog"
                  value={mockMetrics.backlogAtividades}
                  subtitle="atividades abertas"
                  icon={<Layers className="h-4 w-4" />}
                />
                <MetricCard
                  title="Vencidas"
                  value={mockMetrics.atividadesVencidas}
                  subtitle="atividades atrasadas"
                  icon={<AlertCircle className="h-4 w-4" />}
                  variant="danger"
                />
              </div>

              {/* Gráficos */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-0">
                {/* SLA por Etapa */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex flex-col">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">SLA vs Tempo Real por Etapa</h3>
                  <div className="flex-1 min-h-0">
                    <SLAComparisonChart data={mockSLAComparison} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* PÁGINA 6 - PARCEIROS, CLIENTES, FORNECEDORES E RISCO            */}
          {/* ================================================================ */}
          {currentPage === 6 && (
            <div className="h-full flex flex-col gap-3">
              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <MetricCard
                  title="HHI Regional"
                  value={mockMetrics.hhiRegional.toFixed(2)}
                  subtitle="concentração geográfica"
                  icon={<MapPin className="h-4 w-4" />}
                  variant={mockMetrics.hhiRegional > 0.25 ? "warning" : "success"}
                  tooltip="Índice Herfindahl-Hirschman. >0.25 = concentração alta"
                />
                <MetricCard
                  title="HHI Cliente"
                  value={mockMetrics.hhiCliente.toFixed(2)}
                  subtitle="concentração de clientes"
                  icon={<Building2 className="h-4 w-4" />}
                  variant={mockMetrics.hhiCliente > 0.25 ? "warning" : "success"}
                />
                <MetricCard
                  title="Nota Média Fornecedores"
                  value={mockMetrics.notaMediaFornecedores.toFixed(1)}
                  subtitle="de 5.0"
                  icon={<Star className="h-4 w-4" />}
                  variant={mockMetrics.notaMediaFornecedores >= 4 ? "success" : mockMetrics.notaMediaFornecedores >= 3 ? "warning" : "danger"}
                />
                <MetricCard
                  title="Parceiros Ativos"
                  value={mockPartners.length}
                  subtitle={`${mockPartners.reduce((acc, p) => acc + p.projectCount, 0)} projetos`}
                  icon={<Users className="h-4 w-4" />}
                />
              </div>

              {/* Gráficos */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-3 min-h-0">
                {/* Parceiros */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex flex-col">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Top Parceiros</h3>
                  <div className="flex-1 min-h-0">
                    <HorizontalBarChart
                      data={mockPartners.map(p => ({
                        label: p.tradeName,
                        value: p.projectCount,
                        secondary: formatCurrencyCompact(p.totalValue),
                      }))}
                      valueLabel="projetos"
                    />
                  </div>
                </div>

                {/* Clientes */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex flex-col">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Top Clientes</h3>
                  <div className="flex-1 min-h-0">
                    <HorizontalBarChart
                      data={mockClients.slice(0, 6).map(c => ({
                        label: c.sigla,
                        value: c.projectCount,
                        secondary: formatCurrencyCompact(c.totalValue),
                      }))}
                      valueLabel="projetos"
                    />
                  </div>
                </div>

                {/* Distribuição Regional */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex flex-col">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Distribuição Regional</h3>
                  <div className="flex-1 min-h-0">
                    <HorizontalBarChart
                      data={mockByRegion.slice(0, 6).map(r => ({
                        label: r.cidade,
                        value: r.quantidade,
                        secondary: formatCurrencyCompact(r.valor),
                      }))}
                      valueLabel="projetos"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Indicador de página */}
        <div className="flex items-center justify-center py-2">
          <span className="text-xs text-gray-500">
            {PAGE_LABELS[currentPage - 1]} • Página {currentPage} de {TOTAL_PAGES}
          </span>
        </div>
      </div>
    </div>
  );
}
