"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink, TrendingUp, X } from "lucide-react";
import type { ProjectResponseDTO } from "@/src/lib/api/types";

interface FinanceiroGlobalCardProps {
  projects: ProjectResponseDTO[] | null;
  isLoading: boolean;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function formatPercent(value: number): string {
  return `${percentFormatter.format(value)}%`;
}

function toNum(value: number | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function FinanceiroGlobalCard({ projects, isLoading }: FinanceiroGlobalCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const metrics = useMemo(() => {
    const list = projects ?? [];
    const valorTotal = list.reduce((acc, p) => acc + toNum(p.contractValue), 0);
    const totalRecebido = list.reduce((acc, p) => acc + toNum(p.totalReceived), 0);
    const faltaReceber = Math.max(0, valorTotal - totalRecebido);
    const percentRecebido = valorTotal > 0 ? (totalRecebido / valorTotal) * 100 : 0;
    return { valorTotal, totalRecebido, faltaReceber, percentRecebido };
  }, [projects]);

  const pendingProjects = useMemo(() => {
    const list = projects ?? [];
    return list
      .filter((p) => toNum(p.contractValue) > toNum(p.totalReceived))
      .map((p) => ({
        ...p,
        _faltaReceber: Math.max(0, toNum(p.contractValue) - toNum(p.totalReceived)),
        _percentRecebido:
          toNum(p.contractValue) > 0
            ? (toNum(p.totalReceived) / toNum(p.contractValue)) * 100
            : 0,
      }))
      .sort((a, b) => b._faltaReceber - a._faltaReceber)
      .slice(0, 50);
  }, [projects]);

  return (
    <>
      <section className="h-full rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
        <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">Financeiro Geral</h3>
              <p className="text-sm text-zinc-600">Visão consolidada de recebimentos</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-600">Valor total em contratos</p>
                {isLoading ? (
                  <div className="mt-2 h-8 w-36 animate-pulse rounded bg-gray-200" aria-hidden />
                ) : (
                  <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                    {formatCurrency(metrics.valorTotal)}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">Soma de todos os contratos</p>
              </div>
            </div>
          </article>

          <article className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-600">Total recebido</p>
                {isLoading ? (
                  <div className="mt-2 h-8 w-36 animate-pulse rounded bg-blue-200" aria-hidden />
                ) : (
                  <p className="mt-2 text-2xl font-bold tracking-tight text-blue-800">
                    {formatCurrency(metrics.totalRecebido)}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {isLoading ? "" : `${formatPercent(metrics.percentRecebido)} do total contratado`}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-600">Falta receber</p>
                {isLoading ? (
                  <div className="mt-2 h-8 w-36 animate-pulse rounded bg-orange-200" aria-hidden />
                ) : (
                  <p className="mt-2 text-2xl font-bold tracking-tight text-orange-800">
                    {formatCurrency(metrics.faltaReceber)}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {isLoading
                    ? ""
                    : `${formatPercent(metrics.percentRecebido)} recebido`}
                </p>
              </div>
            </div>
          </article>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            disabled={isLoading || pendingProjects.length === 0}
            onClick={() => setModalOpen(true)}
            className="rounded-lg bg-[#004225] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#003319] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Ver projetos com pendência
            {!isLoading && pendingProjects.length > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                {pendingProjects.length}
              </span>
            )}
          </button>
        </div>
      </section>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="financeiro-global-modal-title"
        >
          <div
            className="h-[92vh] w-full max-w-5xl overflow-hidden rounded-t-2xl border border-zinc-200 bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-3 border-b border-zinc-200 px-4 py-4 sm:px-6 sm:py-5">
              <div>
                <h4
                  id="financeiro-global-modal-title"
                  className="text-lg font-semibold text-zinc-900"
                >
                  Projetos com recebimento pendente
                </h4>
                <p className="mt-1 text-sm text-zinc-600">
                  {pendingProjects.length} projeto(s) com valor a receber — ordenados por maior
                  pendência.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                aria-label="Fechar lista de projetos com recebimento pendente"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="h-[calc(92vh-84px)] overflow-y-auto p-4 sm:h-auto sm:max-h-[70vh] sm:p-6">
              {pendingProjects.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-500">
                  Nenhum projeto com recebimento pendente.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/contratos/${project.id}`}
                      className="block rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-semibold text-zinc-900 sm:truncate">
                            {project.name}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            Código: {project.code || "Não informado"}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 self-start text-xs font-medium text-[#004225]">
                          Abrir contrato
                          <ExternalLink className="h-3.5 w-3.5" />
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-zinc-600 sm:grid-cols-3">
                        <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                          <span className="block text-zinc-500">Valor do contrato</span>
                          <span className="font-semibold text-zinc-800">
                            {formatCurrency(toNum(project.contractValue))}
                          </span>
                        </div>
                        <div className="rounded-lg border border-blue-50 bg-blue-50 px-3 py-2">
                          <span className="block text-zinc-500">Recebido</span>
                          <span className="font-semibold text-blue-800">
                            {formatCurrency(toNum(project.totalReceived))}
                          </span>
                        </div>
                        <div className="rounded-lg border border-orange-100 bg-orange-50 px-3 py-2">
                          <span className="block text-zinc-500">Falta receber</span>
                          <span className="font-semibold text-orange-800">
                            {formatCurrency(project._faltaReceber)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
                          <span>Progresso de recebimento</span>
                          <span className="font-medium text-zinc-700">
                            {formatPercent(project._percentRecebido)}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className="h-full rounded-full bg-[#00B894] transition-all"
                            style={{ width: `${Math.min(100, project._percentRecebido)}%` }}
                          />
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
