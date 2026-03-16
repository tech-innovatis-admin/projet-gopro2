"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CalendarRange,
  Clock3,
  ExternalLink,
  Hourglass,
  ShieldAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import type {
  ProjectDashboardExpiringContractDTO,
  ProjectDashboardExpiringContractsDTO,
} from "@/src/lib/api/types";

interface ExpiringContractsCardProps {
  data: ProjectDashboardExpiringContractsDTO | null;
  isLoading?: boolean;
}

type WindowKey = "SIX_MONTHS" | "THREE_MONTHS" | "ONE_MONTH" | "ONE_YEAR";

type DateBoundaries = {
  referenceDate: Date;
  oneMonthLimit: Date;
  threeMonthLimit: Date;
  sixMonthLimit: Date;
  oneYearLimit: Date;
};

type WindowMetric = {
  key: WindowKey;
  title: string;
  interval: string;
  icon: LucideIcon;
  accent: string;
  iconBg: string;
  iconColor: string;
  count: number;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function parseDateOnly(value: string): Date | null {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function addMonthsSafe(value: Date, monthsToAdd: number): Date {
  const year = value.getFullYear();
  const month = value.getMonth() + monthsToAdd;
  const day = value.getDate();

  const result = new Date(year, month, 1);
  const lastDayOfTargetMonth = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0
  ).getDate();

  result.setDate(Math.min(day, lastDayOfTargetMonth));
  return result;
}

function diffDays(start: Date, end: Date): number {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / DAY_IN_MS));
}

function formatDate(value: string): string {
  const date = parseDateOnly(value);
  if (!date) {
    return "Data invalida";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function pluralize(count: number, singular: string, plural: string): string {
  if (count === 1) {
    return `1 ${singular}`;
  }
  return `${count} ${plural}`;
}

function formatCountdown(endDateValue: string, referenceDateValue: string): string {
  const endDate = parseDateOnly(endDateValue);
  const referenceDate = parseDateOnly(referenceDateValue);

  if (!endDate || !referenceDate) {
    return "Prazo indisponivel";
  }

  if (endDate < referenceDate) {
    return "Vencido";
  }

  if (endDate.getTime() === referenceDate.getTime()) {
    return "Vence hoje";
  }

  let months = 0;
  let cursor = new Date(referenceDate);

  while (true) {
    const nextMonth = addMonthsSafe(cursor, 1);
    if (nextMonth <= endDate) {
      months += 1;
      cursor = nextMonth;
      continue;
    }
    break;
  }

  const remainingDays = diffDays(cursor, endDate);
  const weeks = Math.floor(remainingDays / 7);
  const days = remainingDays % 7;

  const parts: string[] = [];
  if (months > 0) {
    parts.push(pluralize(months, "mes", "meses"));
  }
  if (weeks > 0) {
    parts.push(pluralize(weeks, "semana", "semanas"));
  }
  if (days > 0 || parts.length === 0) {
    parts.push(pluralize(days, "dia", "dias"));
  }

  return parts.join(", ");
}

function compareByEndDate(a: ProjectDashboardExpiringContractDTO, b: ProjectDashboardExpiringContractDTO): number {
  const firstDate = parseDateOnly(a.endDate);
  const secondDate = parseDateOnly(b.endDate);

  if (!firstDate || !secondDate) {
    return 0;
  }

  return firstDate.getTime() - secondDate.getTime();
}

function getWindowKeyByDate(endDateValue: string, boundaries: DateBoundaries): WindowKey | null {
  const endDate = parseDateOnly(endDateValue);
  if (!endDate) {
    return null;
  }

  if (endDate < boundaries.referenceDate || endDate > boundaries.oneYearLimit) {
    return null;
  }

  if (endDate <= boundaries.oneMonthLimit) {
    return "ONE_MONTH";
  }

  if (endDate > boundaries.oneMonthLimit && endDate <= boundaries.threeMonthLimit) {
    return "THREE_MONTHS";
  }

  if (endDate > boundaries.threeMonthLimit && endDate <= boundaries.sixMonthLimit) {
    return "SIX_MONTHS";
  }

  if (endDate > boundaries.sixMonthLimit && endDate <= boundaries.oneYearLimit) {
    return "ONE_YEAR";
  }

  return null;
}

function emptyBuckets(): Record<WindowKey, ProjectDashboardExpiringContractDTO[]> {
  return {
    SIX_MONTHS: [],
    THREE_MONTHS: [],
    ONE_MONTH: [],
    ONE_YEAR: [],
  };
}

function getMetricDescription(key: WindowKey): string {
  if (key === "ONE_MONTH") {
    return "de hoje ate 1 mes";
  }
  if (key === "THREE_MONTHS") {
    return "entre 1 e 3 meses";
  }
  if (key === "SIX_MONTHS") {
    return "entre 3 e 6 meses";
  }
  return "entre 6 e 12 meses";
}

function getMetricTitle(key: WindowKey): string {
  if (key === "ONE_MONTH") {
    return "1 mes";
  }
  if (key === "THREE_MONTHS") {
    return "3 meses";
  }
  if (key === "SIX_MONTHS") {
    return "6 meses";
  }
  return "1 ano";
}

function getMetricIcon(key: WindowKey): LucideIcon {
  if (key === "ONE_MONTH") {
    return ShieldAlert;
  }
  if (key === "THREE_MONTHS") {
    return Clock3;
  }
  if (key === "SIX_MONTHS") {
    return CalendarRange;
  }
  return Hourglass;
}

function getMetricTone(key: WindowKey): Pick<WindowMetric, "accent" | "iconBg" | "iconColor"> {
  if (key === "ONE_MONTH") {
    return {
      accent: "bg-red-500",
      iconBg: "bg-red-100",
      iconColor: "text-red-700",
    };
  }
  if (key === "THREE_MONTHS") {
    return {
      accent: "bg-amber-500",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-700",
    };
  }
  if (key === "SIX_MONTHS") {
    return {
      accent: "bg-emerald-500",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-700",
    };
  }
  return {
    accent: "bg-sky-500",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-700",
  };
}

function renderLoadingCard(index: number): ReactNode {
  return (
    <article
      key={`loading-card-${index}`}
      className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-zinc-300" />
      <div className="h-5 w-24 animate-pulse rounded bg-zinc-200" aria-hidden />
      <div className="mt-4 h-10 w-20 animate-pulse rounded bg-zinc-200" aria-hidden />
      <div className="mt-3 h-4 w-36 animate-pulse rounded bg-zinc-200" aria-hidden />
    </article>
  );
}

export function ExpiringContractsCard({ data, isLoading = false }: ExpiringContractsCardProps) {
  const [activeWindow, setActiveWindow] = useState<WindowKey | null>(null);

  const boundaries = useMemo<DateBoundaries | null>(() => {
    if (!data?.referenceDate) {
      return null;
    }

    const referenceDate = parseDateOnly(data.referenceDate);
    if (!referenceDate) {
      return null;
    }

    return {
      referenceDate,
      oneMonthLimit: addMonthsSafe(referenceDate, 1),
      threeMonthLimit: addMonthsSafe(referenceDate, 3),
      sixMonthLimit: addMonthsSafe(referenceDate, 6),
      oneYearLimit: addMonthsSafe(referenceDate, 12),
    };
  }, [data]);

  const contractsByWindow = useMemo(() => {
    if (!boundaries) {
      return emptyBuckets();
    }

    const buckets = emptyBuckets();

    for (const contract of data?.contracts ?? []) {
      const key = getWindowKeyByDate(contract.endDate, boundaries);
      if (!key) {
        continue;
      }
      buckets[key].push(contract);
    }

    (Object.keys(buckets) as WindowKey[]).forEach((key) => {
      buckets[key].sort(compareByEndDate);
    });

    return buckets;
  }, [boundaries, data?.contracts]);

  const metrics: WindowMetric[] = useMemo(() => {
    const keys: WindowKey[] = ["SIX_MONTHS", "THREE_MONTHS", "ONE_MONTH"];

    return keys.map((key) => {
      const tone = getMetricTone(key);
      return {
        key,
        title: getMetricTitle(key),
        interval: getMetricDescription(key),
        icon: getMetricIcon(key),
        accent: tone.accent,
        iconBg: tone.iconBg,
        iconColor: tone.iconColor,
        count: contractsByWindow[key].length,
      };
    });
  }, [contractsByWindow]);

  const selectedMetric = useMemo(
    () => metrics.find((metric) => metric.key === activeWindow) ?? null,
    [activeWindow, metrics]
  );

  const selectedContracts = useMemo(() => {
    if (!activeWindow) {
      return [] as ProjectDashboardExpiringContractDTO[];
    }
    return contractsByWindow[activeWindow] ?? [];
  }, [activeWindow, contractsByWindow]);

  return (
    <>
      <section className="h-full rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
        <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">Contratos próximos do vencimento</h3>
              <p className="text-sm text-zinc-600">Selecione o card para abrir os contratos do intervalo.</p>
            </div>
          </div>

          <div className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 sm:w-auto sm:justify-start">
            <CalendarClock className="h-4 w-4" />
            <span>
              Referência:{" "}
              <strong className="font-semibold text-zinc-800">
                {data?.referenceDate ? formatDate(data.referenceDate) : "-"}
              </strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <div key={`loading-wrapper-${index}`}>{renderLoadingCard(index)}</div>
              ))
            : metrics.map((metric) => (
                <button
                  key={metric.key}
                  type="button"
                  onClick={() => setActiveWindow(metric.key)}
                  className="group relative h-full overflow-hidden rounded-xl border border-zinc-200 bg-white p-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg sm:p-5"
                >
                  <span aria-hidden className={`absolute inset-x-0 top-0 h-1 ${metric.accent}`} />

                  <div className="flex items-center gap-3">
                    <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${metric.iconBg}`}>
                      <metric.icon className={`h-5 w-5 ${metric.iconColor}`} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-zinc-700 sm:text-sm">{metric.title}</p>
                      <p className="text-xs text-zinc-500">{metric.interval}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-2xl font-bold leading-none tabular-nums tracking-tight text-zinc-900 sm:text-3xl">
                      {metric.count}
                    </span>
                    <span className="text-xs text-zinc-500">contratos</span>
                  </div>

                  <p className="mt-3 text-xs text-zinc-500">Clique para ver lista completa</p>
                </button>
              ))}
        </div>
      </section>

      {activeWindow && selectedMetric && (
        <div
          className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
          onClick={() => setActiveWindow(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="expiring-contracts-modal-title"
        >
          <div
            className="h-[92vh] w-full max-w-5xl overflow-hidden rounded-t-2xl border border-zinc-200 bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-3 border-b border-zinc-200 px-4 py-4 sm:px-6 sm:py-5">
              <div>
                <h4 id="expiring-contracts-modal-title" className="text-lg font-semibold text-zinc-900">
                  Contratos com vencimento {selectedMetric.interval}
                </h4>
                <p className="mt-1 text-sm text-zinc-600">
                  {selectedContracts.length} contrato(s) encontrado(s).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveWindow(null)}
                className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                aria-label="Fechar lista de contratos proximos do vencimento"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="h-[calc(92vh-84px)] overflow-y-auto p-4 sm:h-auto sm:max-h-[70vh] sm:p-6">
              {selectedContracts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-500">
                  Nenhum contrato encontrado para este período.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedContracts.map((contract) => (
                    <Link
                      key={`${selectedMetric.key}-${contract.projectId}`}
                      href={`/contratos/${contract.projectId}`}
                      className="block rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-semibold text-zinc-900 sm:truncate">
                            {contract.projectName}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs text-zinc-500 sm:truncate">
                            Código: {contract.projectCode || "Nao informado"} | Cliente:{" "}
                            {contract.primaryClientName || "Nao informado"}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 self-start text-xs font-medium text-[#004225]">
                          Abrir contrato
                          <ExternalLink className="h-3.5 w-3.5" />
                        </span>
                      </div>

                      <div className="mt-3 hidden grid-cols-1 gap-2 text-xs text-zinc-600 lg:grid lg:grid-cols-3">
                        <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                          <span className="block text-zinc-500">Valor</span>
                          <span className="font-semibold text-zinc-800">
                            {formatCurrency(contract.contractValue ?? 0)}
                          </span>
                        </div>
                        <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                          <span className="block text-zinc-500">Data de vencimento</span>
                          <span className="font-semibold text-zinc-800">
                            {formatDate(contract.endDate)}
                          </span>
                        </div>
                        <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                          <span className="block text-zinc-500">Contagem ate o vencimento</span>
                          <span className="font-semibold text-zinc-800">
                            {data?.referenceDate
                              ? formatCountdown(contract.endDate, data.referenceDate)
                              : "Prazo indisponivel"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
