"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, CheckCircle2, Clock3, ListChecks, PauseCircle, PlayCircle, type LucideIcon } from "lucide-react";
import { NavBar } from "@/components/ui/NavBar";
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";
import { getProjectDashboard } from "@/src/lib/api/endpoints";
import { HttpError, type ProjectDashboardResponseDTO, type ProjectGovIfEnum, type ProjectStatusEnum } from "@/src/lib/api/types";
import { CategoryPieChart } from "./_components/CategoryPieChart";
import { ContractsLineChart } from "./_components/ContractsLineChart";
import { ContractsMap } from "./_components/ContractsMap";
import { ExpiringContractsCard } from "./_components/ExpiringContractsCard";
import { PartnerBarChart } from "./_components/PartnerBarChart";

type SummaryCard = {
  key: ProjectStatusEnum | "TOTAL";
  title: string;
  contracts: number;
  totalValue: number;
  icon: LucideIcon;
};

type CardTone = {
  iconBg: string;
  iconColor: string;
  valueColor: string;
};

const statusLabels: Record<ProjectStatusEnum, string> = {
  PRE_PROJETO: "Pré-Projetos",
  PLANEJAMENTO: "Planejamento",
  EXECUCAO: "Execução",
  FINALIZADO: "Finalizados",
  SUSPENSO: "Suspensos",
};

const CURRENT_YEAR = new Date().getFullYear();
const govIfFilterOptions: Array<{ label: string; value: ProjectGovIfEnum | null }> = [
  { label: "Todos", value: null },
  { label: "IF", value: "IF" },
  { label: "Gov", value: "GOV" },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const formatNumber = (value: number) =>
  new Intl.NumberFormat("pt-BR").format(value);

const cardToneByStatus: Record<ProjectStatusEnum | "TOTAL", CardTone> = {
  PRE_PROJETO: {
    iconBg: "bg-sky-100",
    iconColor: "text-sky-700",
    valueColor: "text-sky-800",
  },
  PLANEJAMENTO: {
    iconBg: "bg-amber-100",
    iconColor: "text-amber-700",
    valueColor: "text-amber-800",
  },
  EXECUCAO: {
    iconBg: "bg-orange-100",
    iconColor: "text-orange-700",
    valueColor: "text-orange-800",
  },
  FINALIZADO: {
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
    valueColor: "text-emerald-800",
  },
  SUSPENSO: {
    iconBg: "bg-rose-100",
    iconColor: "text-rose-700",
    valueColor: "text-rose-800",
  },
  TOTAL: {
    iconBg: "bg-zinc-100",
    iconColor: "text-zinc-700",
    valueColor: "text-zinc-800",
  },
};

const neutralTone: CardTone = {
  iconBg: "bg-zinc-100",
  iconColor: "text-zinc-500",
  valueColor: "text-zinc-600",
};

function getErrorMessage(error: unknown): string {
  if (error instanceof HttpError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Falha ao carregar dashboard.";
}

export default function HomePage() {
  const [dashboard, setDashboard] = useState<ProjectDashboardResponseDTO | null>(null);
  const [expiringContracts, setExpiringContracts] = useState<ProjectDashboardResponseDTO["expiringContracts"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [expiringLoading, setExpiringLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedGovIf, setSelectedGovIf] = useState<ProjectGovIfEnum | null>(null);
  const [yearOptions, setYearOptions] = useState<number[]>([]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getProjectDashboard({
        year: selectedYear ?? undefined,
        projectGovIf: selectedGovIf ?? undefined,
      });
      setDashboard(response);
      const availableYears = (response.availableYears ?? [])
        .filter((year) => Number.isFinite(year))
        .sort((first, second) => second - first);
      setYearOptions(
        availableYears.length > 0 ? availableYears : [CURRENT_YEAR]
      );
    } catch (fetchError) {
      setDashboard(null);
      setYearOptions([CURRENT_YEAR]);
      setError(getErrorMessage(fetchError));
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedGovIf]);

  const loadExpiringContracts = useCallback(async () => {
    setExpiringLoading(true);
    try {
      const response = await getProjectDashboard();
      setExpiringContracts(response.expiringContracts ?? null);
    } catch {
      setExpiringContracts(null);
    } finally {
      setExpiringLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    void loadExpiringContracts();
  }, [loadExpiringContracts]);

  const statusMetricMap = useMemo(() => {
    const byStatus = dashboard?.byStatus ?? [];
    return new Map(byStatus.map((metric) => [metric.status, metric]));
  }, [dashboard?.byStatus]);

  const categoryData = useMemo(() => {
    const byType = dashboard?.byType ?? [];
    const projeto = byType.find((item) => item.type === "PROJETO");
    const produto = byType.find((item) => item.type === "PRODUTO");
    return [
      {
        name: "Projetos",
        quantidade: projeto?.contracts ?? 0,
        percentual: projeto?.percentageOfTypeTotal ?? 0,
        valor: projeto?.totalValue ?? 0,
      },
      {
        name: "Produtos",
        quantidade: produto?.contracts ?? 0,
        percentual: produto?.percentageOfTypeTotal ?? 0,
        valor: produto?.totalValue ?? 0,
      },
    ];
  }, [dashboard?.byType]);

  const partnerData = useMemo(
    () =>
      (dashboard?.byPartner ?? [])
        .slice(0, 7)
        .map((item) => ({
          name: item.partnerAcronym?.trim() || item.partnerName,
          contratos: item.contracts,
          valor: item.totalValue,
        })),
    [dashboard?.byPartner]
  );

  const locationData = useMemo(
    () =>
      (dashboard?.byLocation ?? []).map((item) => ({
        location: item.location,
        city: item.city,
        state: item.state,
        contracts: item.contracts,
        totalValue: item.totalValue,
      })),
    [dashboard?.byLocation]
  );

  const monthlyData = useMemo(
    () =>
      (dashboard?.byMonth ?? []).map((item) => ({
        month: item.label.replace(".", ""),
        contratos: item.contracts,
      })),
    [dashboard?.byMonth]
  );

  const yearDropdownOptions = useMemo<DropdownOption[]>(
    () =>
      yearOptions.map((year) => ({
        value: String(year),
        label: String(year),
      })),
    [yearOptions]
  );

  const cards: SummaryCard[] = [
    {
      key: "PRE_PROJETO",
      title: statusLabels.PRE_PROJETO,
      contracts: statusMetricMap.get("PRE_PROJETO")?.contracts ?? 0,
      totalValue: statusMetricMap.get("PRE_PROJETO")?.totalValue ?? 0,
      icon: Clock3,
    },
    {
      key: "PLANEJAMENTO",
      title: statusLabels.PLANEJAMENTO,
      contracts: statusMetricMap.get("PLANEJAMENTO")?.contracts ?? 0,
      totalValue: statusMetricMap.get("PLANEJAMENTO")?.totalValue ?? 0,
      icon: ListChecks,
    },
    {
      key: "EXECUCAO",
      title: statusLabels.EXECUCAO,
      contracts: statusMetricMap.get("EXECUCAO")?.contracts ?? 0,
      totalValue: statusMetricMap.get("EXECUCAO")?.totalValue ?? 0,
      icon: PlayCircle,
    },
    {
      key: "FINALIZADO",
      title: statusLabels.FINALIZADO,
      contracts: statusMetricMap.get("FINALIZADO")?.contracts ?? 0,
      totalValue: statusMetricMap.get("FINALIZADO")?.totalValue ?? 0,
      icon: CheckCircle2,
    },
    {
      key: "SUSPENSO",
      title: statusLabels.SUSPENSO,
      contracts: statusMetricMap.get("SUSPENSO")?.contracts ?? 0,
      totalValue: statusMetricMap.get("SUSPENSO")?.totalValue ?? 0,
      icon: PauseCircle,
    },
    {
      key: "TOTAL",
      title: "Total de Contratos",
      contracts: dashboard?.summary.totalContracts ?? 0,
      totalValue: dashboard?.summary.totalValue ?? 0,
      icon: BarChart3,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100">
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-zinc-900 mb-2">Bem-vindo a GoPro2</h1>
                <p className="text-zinc-600">Gerenciar com eficiência e inteligência</p>
              </div>
              {/* Temporarily disabled (no auth for now):
              <div className="hidden md:flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-zinc-500">Ola,</p>
                  <p className="text-lg font-semibold text-zinc-900">Administrador</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#1F4E79] to-[#153653] flex items-center justify-center text-white font-semibold">
                  A
                </div>
              </div>
              */}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => void loadDashboard()}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs"
              >
                Tentar novamente
              </button>
            </div>
          )}

          <div
            className="grid grid-cols-6 auto-rows-fr gap-4 lg:gap-5"
            aria-busy={loading}
          >
            {cards.map((card) => {
              const isEmpty = card.contracts === 0 && card.totalValue === 0;
              const tone = isEmpty ? neutralTone : cardToneByStatus[card.key];
              return (
                <article
                  key={card.title}
                  aria-labelledby={`summary-card-title-${card.key}`}
                  className="h-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex h-full flex-col">
                    <header className="flex items-center gap-3">
                      <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone.iconBg}`}>
                        <card.icon className={`h-5 w-5 ${tone.iconColor}`} />
                      </span>
                      <h2 id={`summary-card-title-${card.key}`} className="text-sm font-medium leading-5 text-zinc-700">
                        {card.title}
                      </h2>
                    </header>

                    <div className="mt-4 flex items-baseline gap-2">
                      {loading ? (
                        <span className="inline-block h-10 w-20 animate-pulse rounded bg-zinc-200" aria-hidden />
                      ) : (
                        <span className={`text-3xl font-bold leading-none tabular-nums tracking-tight ${isEmpty ? "text-zinc-500" : "text-zinc-900"}`}>
                          {formatNumber(card.contracts)}
                        </span>
                      )}
                      <span className="text-xs font-normal leading-none text-zinc-500">
                        contratos
                      </span>
                    </div>

                    <p className={`mt-3 text-sm font-semibold leading-tight break-words ${tone.valueColor}`}>
                      {loading ? (
                        <span className="inline-block h-5 w-36 animate-pulse rounded bg-zinc-200" aria-hidden />
                      ) : (
                        formatCurrency(card.totalValue)
                      )}
                    </p>

                    {!loading && (
                      <p className="sr-only">
                        {`${card.title}. ${formatNumber(card.contracts)} contratos. Valor total ${formatCurrency(card.totalValue)}.`}
                      </p>
                    )}
                    </div>
                </article>
              );
            })}
          </div>

          <div className="flex flex-wrap items-end justify-start gap-4">
            <div className="w-full max-w-[220px]">
              <p className="mb-2 text-xs font-medium text-zinc-600">Período</p>
              <Dropdown
                options={yearDropdownOptions}
                value={selectedYear == null ? undefined : String(selectedYear)}
                placeholder="Tempo todo"
                onChange={(value) => {
                  if (!value) {
                    setSelectedYear(null);
                    return;
                  }
                  const parsedYear = Number(value);
                  if (Number.isFinite(parsedYear)) {
                    setSelectedYear(parsedYear);
                  }
                }}
                className="w-full"
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-zinc-600">Gov/IF</p>
              <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
                {govIfFilterOptions.map((option) => {
                  const isActive = selectedGovIf === option.value;
                  return (
                    <button
                      key={option.label}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setSelectedGovIf(option.value)}
                      className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-[#004225] text-white"
                          : "text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <ExpiringContractsCard
              data={expiringContracts}
              isLoading={expiringLoading}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategoryPieChart data={categoryData} isLoading={loading} />
            <ContractsLineChart
              data={monthlyData}
              isLoading={loading}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ContractsMap data={locationData} isLoading={loading} />
            <PartnerBarChart data={partnerData} isLoading={loading} />
          </div>
        </div>
      </main>
    </div>
  );
}
