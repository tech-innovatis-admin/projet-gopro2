"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  BriefcaseBusiness,
  CircleDollarSign,
  Wallet,
} from "lucide-react";
import { getProjectById, getProjectTotals } from "@/src/lib/api/endpoints";
import { type ProjectResponseDTO, type ProjectTotalsDTO } from "@/src/lib/api/types";
import { getUserErrorMessage } from "@/src/lib/feedback/user-messages";

type DashboardState = {
  project: ProjectResponseDTO | null;
  totals: ProjectTotalsDTO | null;
};

type DashboardMetrics = {
  valorContrato: number;
  entradasRecebidas: number;
  custosProjeto: number;
  saldoDisponivel: number;
  percentualExecutado: number;
  percentualRecebido: number;
  status: string;
  executionMode: string;
};

type StatusCardStyle = {
  accentClass: string;
  valueClassName: string;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const STATUS_LABELS: Record<string, string> = {
  PRE_PROJETO: "Pré-projeto",
  PLANEJAMENTO: "Planejamento",
  EXECUCAO: "Execução",
  FINALIZADO: "Finalizado",
  SUSPENSO: "Suspenso",
};

const STATUS_CARD_STYLES: Record<string, StatusCardStyle> = {
  PRE_PROJETO: {
    accentClass: "border-gray-200 bg-gradient-to-br from-gray-50 to-white",
    valueClassName: "text-gray-800",
  },
  PLANEJAMENTO: {
    accentClass: "border-amber-200 bg-gradient-to-br from-amber-50 to-white",
    valueClassName: "text-amber-800",
  },
  EXECUCAO: {
    accentClass: "border-blue-200 bg-gradient-to-br from-blue-50 to-white",
    valueClassName: "text-blue-800",
  },
  FINALIZADO: {
    accentClass: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
    valueClassName: "text-emerald-800",
  },
  SUSPENSO: {
    accentClass: "border-yellow-200 bg-gradient-to-br from-yellow-50 to-white",
    valueClassName: "text-yellow-800",
  },
};

function toSafeNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatPercent(value: number) {
  return `${percentFormatter.format(value)}%`;
}

function getStatusLabel(status: string | null | undefined) {
  if (!status) {
    return "Nao informado";
  }

  return STATUS_LABELS[status] ?? status;
}

function calculateMetrics(state: DashboardState): DashboardMetrics {
  const valorContrato = toSafeNumber(state.project?.contractValue);
  const entradasRecebidas = state.totals?.totalIncome ?? toSafeNumber(state.project?.totalReceived);
  const custosProjeto = state.totals?.totalExpense ?? toSafeNumber(state.project?.totalExpenses);
  const saldoDisponivel = state.totals?.saldo ?? toSafeNumber(state.project?.saldo);
  const percentualExecutado = valorContrato > 0 ? (custosProjeto / valorContrato) * 100 : 0;
  const percentualRecebido = valorContrato > 0 ? (entradasRecebidas / valorContrato) * 100 : 0;

  return {
    valorContrato,
    entradasRecebidas,
    custosProjeto,
    saldoDisponivel,
    percentualExecutado,
    percentualRecebido,
    status: getStatusLabel(state.project?.projectStatus),
    executionMode:
      state.project?.executedByInnovatis == null
        ? "Nao informado"
        : state.project.executedByInnovatis
          ? "Innovatis"
          : "Parceiro",
  };
}

function getStatusCardStyle(status: string | null | undefined): StatusCardStyle {
  if (!status) {
    return {
      accentClass: "border-slate-200 bg-gradient-to-br from-slate-50 to-white",
      valueClassName: "text-slate-800",
    };
  }

  return (
    STATUS_CARD_STYLES[status] ?? {
      accentClass: "border-slate-200 bg-gradient-to-br from-slate-50 to-white",
      valueClassName: "text-slate-800",
    }
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  accentClass,
  icon,
  valueClassName = "text-gray-900",
}: {
  title: string;
  value: string;
  subtitle?: string;
  accentClass: string;
  icon: ReactNode;
  valueClassName?: string;
}) {
  return (
    <article className={`rounded-xl border bg-white p-4 shadow-sm ${accentClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`mt-2 text-2xl font-bold tracking-tight ${valueClassName}`}>{value}</p>
          {subtitle ? <p className="mt-1 text-xs text-gray-500">{subtitle}</p> : null}
        </div>
        <div className="rounded-lg bg-white/70 p-2 text-gray-700 ring-1 ring-black/5">{icon}</div>
      </div>
    </article>
  );
}

export function ContratoOverviewCard() {
  const params = useParams();
  const contratoId = params.contratoId as string;
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    project: null,
    totals: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const project = await getProjectById(contratoId);

      let totals: ProjectTotalsDTO | null = null;
      try {
        totals = await getProjectTotals(contratoId);
      } catch {
        totals = null;
      }

      setDashboardState({ project, totals });
    } catch (loadError) {
      setError(getUserErrorMessage(loadError, "Nao foi possivel carregar a dashboard do contrato."));
      setDashboardState({ project: null, totals: null });
    } finally {
      setLoading(false);
    }
  }, [contratoId]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const metrics = useMemo(() => calculateMetrics(dashboardState), [dashboardState]);
  const isNegativeBalance = metrics.saldoDisponivel < 0;
  const statusCardStyle = getStatusCardStyle(dashboardState.project?.projectStatus);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-gray-100" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
              <div className="mt-3 h-8 w-40 animate-pulse rounded bg-gray-200" />
              <div className="mt-2 h-3 w-24 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
          <div>
            <h2 className="text-base font-semibold text-red-900">Falha ao carregar a visão geral</h2>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-[#004225]">Dashboard do contrato</p>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">
            {dashboardState.project?.name || `Contrato ${contratoId}`}
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">
            Visão consolidada dos principais indicadores financeiros e operacionais do contrato.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className={`rounded-lg border px-4 py-3 ${statusCardStyle.accentClass}`}>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Status</p>
            <p className={`mt-1 text-sm font-semibold ${statusCardStyle.valueClassName}`}>
              {metrics.status}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Execução</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">{metrics.executionMode}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Valor do contrato"
          value={formatCurrency(metrics.valorContrato)}
          subtitle="Valor cadastrado no contrato"
          accentClass="border-gray-200 bg-gradient-to-br from-gray-50 to-white"
          icon={<BriefcaseBusiness className="h-5 w-5" />}
        />
        <SummaryCard
          title="Entradas recebidas"
          value={formatCurrency(metrics.entradasRecebidas)}
          subtitle="Receitas já registradas"
          accentClass="border-blue-200 bg-gradient-to-br from-blue-50 to-white"
          icon={<ArrowDownCircle className="h-5 w-5 text-blue-700" />}
          valueClassName="text-blue-800"
        />
        <SummaryCard
          title="Custos do projeto"
          value={formatCurrency(metrics.custosProjeto)}
          subtitle="Despesas executadas"
          accentClass="border-amber-200 bg-gradient-to-br from-amber-50 to-white"
          icon={<ArrowUpCircle className="h-5 w-5 text-amber-700" />}
          valueClassName="text-amber-800"
        />
        <SummaryCard
          title="Saldo real disponível"
          value={formatCurrency(metrics.saldoDisponivel)}
          subtitle="Entradas menos despesas"
          accentClass={`bg-gradient-to-br to-white ${
            isNegativeBalance ? "border-red-200 from-red-50" : "border-emerald-200 from-emerald-50"
          }`}
          icon={<Wallet className={`h-5 w-5 ${isNegativeBalance ? "text-red-700" : "text-emerald-700"}`} />}
          valueClassName={isNegativeBalance ? "text-red-700" : "text-emerald-800"}
        />
        <SummaryCard
          title="Recebido do contrato"
          value={formatPercent(metrics.percentualRecebido)}
          subtitle="Entradas sobre valor contratado"
          accentClass="border-violet-200 bg-gradient-to-br from-violet-50 to-white"
          icon={<CircleDollarSign className="h-5 w-5 text-violet-700" />}
          valueClassName="text-violet-800"
        />
      </div>
    </section>
  );
}
