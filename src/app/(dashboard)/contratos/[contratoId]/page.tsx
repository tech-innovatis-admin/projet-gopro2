"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  DollarSign,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle,
} from "lucide-react";
import { getProjectById, getProjectTotals } from "@/src/lib/api/endpoints";
import { HttpError } from "@/src/lib/api/types";
import type { ResumoCronograma, ResumoFinanceiro, Risco } from "./types";

const EMPTY_FINANCEIRO: ResumoFinanceiro = {
  valorContratado: 0,
  valorEmpenhado: 0,
  valorLiquidado: 0,
  valorPago: 0,
};

const EMPTY_CRONOGRAMA: ResumoCronograma = {
  percentualExecucao: 0,
  dataAtual: new Date().toISOString(),
  dataFinal: "",
  diasRestantes: 0,
  status: "NO_PRAZO",
};

const EMPTY_RISCOS: Risco[] = [];

function toSafeNumber(value: number | null | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }
  return value;
}

function getDaysUntil(targetDateIso: string): number {
  if (!targetDateIso) return 0;
  const target = new Date(targetDateIso);
  if (Number.isNaN(target.getTime())) return 0;

  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((target.getTime() - now.getTime()) / msPerDay);
}

export default function ContratoVisaoGeralPage() {
  const params = useParams();
  const contratoId = params.contratoId as string;

  const [financeiro, setFinanceiro] = useState<ResumoFinanceiro>(EMPTY_FINANCEIRO);
  const [cronograma, setCronograma] = useState<ResumoCronograma>(EMPTY_CRONOGRAMA);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const riscos = EMPTY_RISCOS;

  const loadResumo = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const project = await getProjectById(contratoId);
      const totals = await getProjectTotals(contratoId).catch(() => null);

      const valorContratado = toSafeNumber(project.contractValue);
      const valorEmpenhado = totals
        ? toSafeNumber(totals.totalExpense)
        : toSafeNumber(project.totalExpenses);
      const valorLiquidado = totals
        ? toSafeNumber(totals.totalIncome)
        : toSafeNumber(project.totalReceived);
      const valorPago = valorLiquidado;

      setFinanceiro({
        valorContratado,
        valorEmpenhado,
        valorLiquidado,
        valorPago,
      });

      const dataFinal = project.endDate ?? project.closingDate ?? "";
      const diasRestantes = getDaysUntil(dataFinal);
      const percentualExecucao =
        valorContratado > 0
          ? Math.max(0, Math.min(100, Math.round((valorLiquidado / valorContratado) * 100)))
          : 0;

      setCronograma({
        percentualExecucao,
        dataAtual: new Date().toISOString(),
        dataFinal,
        diasRestantes,
        status: dataFinal && diasRestantes < 0 ? "ATRASADO" : "NO_PRAZO",
      });
    } catch (error) {
      const message =
        error instanceof HttpError
          ? error.message
          : "Nao foi possivel carregar os dados do contrato.";
      setLoadError(message);
      setFinanceiro(EMPTY_FINANCEIRO);
      setCronograma(EMPTY_CRONOGRAMA);
    } finally {
      setIsLoading(false);
    }
  }, [contratoId]);

  useEffect(() => {
    void loadResumo();
  }, [loadResumo]);

  const percentualLiquidado = useMemo(() => {
    if (financeiro.valorContratado <= 0) return 0;
    return Math.max(
      0,
      Math.min(100, Math.round((financeiro.valorLiquidado / financeiro.valorContratado) * 100))
    );
  }, [financeiro.valorContratado, financeiro.valorLiquidado]);

  const saldoRestante = financeiro.valorContratado - financeiro.valorLiquidado;
  const cronogramaStatus =
    cronograma.status === "ATRASADO"
      ? { text: "Atrasado", className: "text-red-600", iconClass: "text-red-500" }
      : { text: "No prazo", className: "text-emerald-600", iconClass: "text-emerald-500" };

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Carregando resumo do contrato...
        </div>
      )}

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div>{loadError}</div>
          <button
            type="button"
            onClick={() => void loadResumo()}
            className="mt-2 rounded-md border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card Resumo Financeiro */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Resumo Financeiro</h3>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-500">Executado vs Contratado</span>
                <span className="font-semibold text-gray-900">{percentualLiquidado}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all"
                  style={{ width: `${percentualLiquidado}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Contratado</p>
                <p className="text-lg font-bold text-gray-900">
                  R$ {(financeiro.valorContratado / 1000).toFixed(0)}k
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Empenhado</p>
                <p className="text-lg font-bold text-blue-600">
                  R$ {(financeiro.valorEmpenhado / 1000).toFixed(0)}k
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Liquidado</p>
                <p className="text-lg font-bold text-emerald-600">
                  R$ {(financeiro.valorLiquidado / 1000).toFixed(0)}k
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Saldo</p>
                <p className="text-lg font-bold text-gray-600">R$ {(saldoRestante / 1000).toFixed(0)}k</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card Cronograma */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Cronograma</h3>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-500">Execucao Fisica</span>
                <span className="font-semibold text-gray-900">{cronograma.percentualExecucao}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                  style={{ width: `${cronograma.percentualExecucao}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Termino previsto</p>
                <p className="text-lg font-bold text-gray-900">{formatDate(cronograma.dataFinal)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Dias restantes</p>
                <div className="flex items-center justify-end gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <p className="text-lg font-bold text-gray-900">
                    {cronograma.dataFinal ? cronograma.diasRestantes : "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <CheckCircle className={`h-4 w-4 ${cronogramaStatus.iconClass}`} />
                <span className={`text-sm font-medium ${cronogramaStatus.className}`}>
                  {cronogramaStatus.text}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Riscos e Pendencias */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Riscos e Pendencias</h3>
            <div className="p-2 bg-amber-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
          </div>

          <div className="space-y-3">
            {riscos.length === 0 && (
              <p className="text-sm text-gray-500">Sem riscos registrados para este contrato.</p>
            )}
            {riscos.map((risco) => (
              <div key={risco.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    risco.severidade === "ALTA"
                      ? "bg-red-500"
                      : risco.severidade === "MEDIA"
                        ? "bg-amber-500"
                        : "bg-blue-500"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 line-clamp-2">{risco.descricao}</p>
                  <span
                    className={`mt-1 inline-flex text-xs font-medium ${
                      risco.severidade === "ALTA"
                        ? "text-red-600"
                        : risco.severidade === "MEDIA"
                          ? "text-amber-600"
                          : "text-blue-600"
                    }`}
                  >
                    {risco.severidade === "ALTA"
                      ? "Alta prioridade"
                      : risco.severidade === "MEDIA"
                        ? "Media prioridade"
                        : "Baixa prioridade"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Ultimas Movimentacoes</h3>
            <p className="text-sm text-gray-500">Historico recente de atividades do contrato</p>
          </div>
        </div>
      </div>
      */}
    </div>
  );
}

function formatDate(iso: string) {
  if (!iso) return "-";

  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return parsed.toLocaleDateString("pt-BR");
}
