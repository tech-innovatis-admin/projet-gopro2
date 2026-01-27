"use client";

import {
  DollarSign,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  ArrowRight,
} from "lucide-react";
import { mockResumo } from "./types";

export default function ContratoVisaoGeralPage() {
  const { financeiro, cronograma, riscos, movimentacoes } = mockResumo;

  const percentualLiquidado = Math.round(
    (financeiro.valorLiquidado / financeiro.valorContratado) * 100
  );
  const saldoRestante = financeiro.valorContratado - financeiro.valorLiquidado;

  return (
    <div className="space-y-6">
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
                <p className="text-lg font-bold text-gray-600">
                  R$ {(saldoRestante / 1000).toFixed(0)}k
                </p>
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
                <span className="text-gray-500">Execução Física</span>
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
                <p className="text-xs text-gray-500 uppercase tracking-wide">Término previsto</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatDate(cronograma.dataFinal)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Dias restantes</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <p className="text-lg font-bold text-gray-900">{cronograma.diasRestantes}</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-emerald-600 font-medium">No prazo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Riscos e Pendências */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Riscos e Pendências</h3>
            <div className="p-2 bg-amber-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
          </div>

          <div className="space-y-3">
            {riscos.map((risco) => (
              <div
                key={risco.id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
              >
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
                      ? "Média prioridade"
                      : "Baixa prioridade"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[#004225] bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
            Ver todos os riscos
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Card Últimas Movimentações - Full Width */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Últimas Movimentações</h3>
            <p className="text-sm text-gray-500">Histórico recente de atividades do contrato</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#004225] bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
            Ver histórico completo
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="relative">
          {/* Timeline */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

          <div className="space-y-4">
            {movimentacoes.map((mov, index) => (
              <div key={mov.id} className="relative flex items-start gap-4 pl-10">
                {/* Icon */}
                <div
                  className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    mov.tipo === "CONTRATACAO"
                      ? "bg-blue-100"
                      : mov.tipo === "FINANCEIRO"
                      ? "bg-emerald-100"
                      : mov.tipo === "STATUS"
                      ? "bg-purple-100"
                      : "bg-gray-100"
                  }`}
                >
                  {mov.tipo === "CONTRATACAO" ? (
                    <FileText className="h-4 w-4 text-blue-600" />
                  ) : mov.tipo === "FINANCEIRO" ? (
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                  ) : mov.tipo === "STATUS" ? (
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                  ) : (
                    <FileText className="h-4 w-4 text-gray-600" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{mov.descricao}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{formatDate(mov.data)}</span>
                    <span>•</span>
                    <span>{mov.usuario}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return iso;
  }
}
