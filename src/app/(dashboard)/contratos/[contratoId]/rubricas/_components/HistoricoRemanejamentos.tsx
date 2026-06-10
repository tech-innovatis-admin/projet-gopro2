'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Calendar, FileText, RotateCcw, Search, User } from 'lucide-react';
import { Dropdown } from '@/components/ui/dropdown';
import { AppModalShell } from '@/components/ui/app-modal-shell';
import { ComebackConfirmationModal } from '@/src/components/budget-transfers/ComebackConfirmationModal';
import { parseBudgetTransferComeback } from '@/src/lib/budget-transfers/comeback';

interface Remanejamento {
  id: string;
  contratoId: string;
  itemOrigemId: string;
  itemDestinoId: string;
  valor: number;
  data: string;
  motivo: string;
  createdBy: string;
  createdAt: string;
  status?: 'PENDENTE' | 'APROVADO';
  itemOrigem?: {
    descricao: string;
    codigo?: string;
    rubricaNome: string;
    rubricaCodigo: string;
  };
  itemDestino?: {
    descricao: string;
    codigo?: string;
    rubricaNome: string;
    rubricaCodigo: string;
  };
}

interface HistoricoRemanejamentosProps {
  isOpen: boolean;
  onClose: () => void;
  remanejamentos: Remanejamento[];
  canManageChildren?: boolean;
  isSubmitting?: boolean;
  onComeback?: (remanejamentoId: string) => Promise<void> | void;
}

function normalizeText(value?: string | null) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getRubricaFilterValue(
  rubrica?: Pick<NonNullable<Remanejamento['itemOrigem']>, 'rubricaCodigo' | 'rubricaNome'>
) {
  const code = rubrica?.rubricaCodigo?.trim() ?? '';
  const name = rubrica?.rubricaNome?.trim() ?? '';
  return normalizeText(code || name);
}

export function HistoricoRemanejamentos({
  isOpen,
  onClose,
  remanejamentos,
  canManageChildren = false,
  isSubmitting = false,
  onComeback,
}: HistoricoRemanejamentosProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRubrica, setFilterRubrica] = useState('');
  const [pendingComeback, setPendingComeback] = useState<Remanejamento | null>(null);

  const remanejamentosOrdenados = useMemo(
    () =>
      [...remanejamentos].sort((a, b) => {
        const timestampA = parseTimestamp(a.createdAt) || parseTimestamp(a.data);
        const timestampB = parseTimestamp(b.createdAt) || parseTimestamp(b.data);

        if (timestampA !== timestampB) {
          return timestampB - timestampA;
        }

        return Number.parseInt(b.id, 10) - Number.parseInt(a.id, 10);
      }),
    [remanejamentos]
  );

  const rubricaOptions = useMemo(() => {
    const options = new Map<string, { value: string; label: string }>();

    for (const remanejamento of remanejamentos) {
      for (const rubrica of [remanejamento.itemOrigem, remanejamento.itemDestino]) {
        const value = getRubricaFilterValue(rubrica);
        if (!value) continue;

        const code = rubrica?.rubricaCodigo?.trim() ?? '';
        const name = rubrica?.rubricaNome?.trim() ?? '';
        const label = code && name ? `${code} - ${name}` : code || name;

        if (!options.has(value)) {
          options.set(value, { value, label });
        }
      }
    }

    return Array.from(options.values()).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  }, [remanejamentos]);

  const remanejamentosFiltrados = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm);
    const normalizedRubricaFilter = normalizeText(filterRubrica);

    return remanejamentosOrdenados.filter((remanejamento) => {
      const searchableContent = [
        remanejamento.itemOrigem?.descricao,
        remanejamento.itemOrigem?.codigo,
        remanejamento.itemOrigem?.rubricaCodigo,
        remanejamento.itemOrigem?.rubricaNome,
        remanejamento.itemDestino?.descricao,
        remanejamento.itemDestino?.codigo,
        remanejamento.itemDestino?.rubricaCodigo,
        remanejamento.itemDestino?.rubricaNome,
        remanejamento.motivo,
        remanejamento.createdBy,
      ]
        .map((value) => normalizeText(value))
        .join(' ');

      const matchSearch =
        !normalizedSearch || searchableContent.includes(normalizedSearch);

      const originRubrica = getRubricaFilterValue(remanejamento.itemOrigem);
      const destinationRubrica = getRubricaFilterValue(remanejamento.itemDestino);
      const matchRubrica =
        !normalizedRubricaFilter ||
        originRubrica === normalizedRubricaFilter ||
        destinationRubrica === normalizedRubricaFilter;

      return matchSearch && matchRubrica;
    });
  }, [filterRubrica, remanejamentosOrdenados, searchTerm]);

  const remanejamentosComComeback = new Set(
    remanejamentos
      .map((remanejamento) => parseBudgetTransferComeback(remanejamento.motivo).originalTransferId)
      .filter((transferId): transferId is number => transferId !== null)
  );
  const totalExibidosLabel =
    remanejamentosFiltrados.length === 1
      ? `Mostrando 1 de ${remanejamentos.length} remanejamento`
      : `Mostrando ${remanejamentosFiltrados.length} de ${remanejamentos.length} remanejamentos`;

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <AppModalShell
        isOpen={isOpen}
        onClose={onClose}
        title="Histórico de remanejamentos"
        description="Consulte os remanejamentos aprovados, filtre os resultados e registre o comeback quando necessário."
        icon={<FileText className="h-5 w-5" />}
        tone="brand"
        maxWidthClassName="max-w-6xl"
        footer={
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-600">{totalExibidosLabel}</p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[#004225] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#003319]"
            >
              Fechar
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_280px]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por item, rubrica ou motivo..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]/20"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <Dropdown
                value={filterRubrica || undefined}
                onChange={(value) => setFilterRubrica(value ?? '')}
                placeholder="Todas as rubricas"
                searchable
                options={rubricaOptions}
                className="w-full"
              />
            </div>
          </div>

          {remanejamentosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 text-slate-500">
              <FileText className="mb-4 h-12 w-12 opacity-50" />
              <p className="text-lg font-medium text-slate-700">Nenhum remanejamento encontrado</p>
              <p className="mt-1 text-sm">
                {searchTerm || filterRubrica
                  ? 'Tente ajustar os filtros para ampliar a busca.'
                  : 'Nenhum remanejamento foi registrado ainda.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {remanejamentosFiltrados.map((remanejamento) => {
                const comebackInfo = parseBudgetTransferComeback(remanejamento.motivo);
                const alreadyReverted =
                  !comebackInfo.isComeback &&
                  remanejamentosComComeback.has(Number.parseInt(remanejamento.id, 10));

                return (
                  <div
                    key={remanejamento.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          ID #{remanejamento.id}
                        </span>
                        {comebackInfo.isComeback && (
                          <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                            Comeback
                          </span>
                        )}
                        {alreadyReverted && (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                            Comeback registrado
                          </span>
                        )}
                      </div>

                      {canManageChildren && onComeback && !comebackInfo.isComeback && (
                        <button
                          type="button"
                          onClick={() => setPendingComeback(remanejamento)}
                          disabled={isSubmitting || alreadyReverted}
                          className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          {alreadyReverted ? 'Comeback já registrado' : 'Registrar comeback'}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)]">
                      <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500" />
                          <span className="text-xs font-medium uppercase text-red-900">
                            Origem (débito)
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-900">
                          {remanejamento.itemOrigem?.codigo &&
                            `[${remanejamento.itemOrigem.codigo}] `}
                          {remanejamento.itemOrigem?.descricao || 'Item não encontrado'}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          Rubrica: {remanejamento.itemOrigem?.rubricaCodigo} -{' '}
                          {remanejamento.itemOrigem?.rubricaNome}
                        </p>
                      </div>

                      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                        <ArrowRight className="mb-2 h-5 w-5 text-slate-400" />
                        <p className="text-lg font-semibold text-[#004225]">
                          {formatCurrency(remanejamento.valor)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(remanejamento.data)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span className="text-xs font-medium uppercase text-emerald-900">
                            Destino (crédito)
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-900">
                          {remanejamento.itemDestino?.codigo &&
                            `[${remanejamento.itemDestino.codigo}] `}
                          {remanejamento.itemDestino?.descricao || 'Item não encontrado'}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          Rubrica: {remanejamento.itemDestino?.rubricaCodigo} -{' '}
                          {remanejamento.itemDestino?.rubricaNome}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 xl:grid-cols-[minmax(0,1fr)_auto]">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-2 flex items-start gap-2">
                          <FileText className="mt-0.5 h-4 w-4 text-slate-400" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-700">Motivo</p>
                            <p className="mt-1 text-sm text-slate-600">
                              {remanejamento.motivo || 'Sem motivo informado.'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5">
                          <User className="h-3.5 w-3.5" />
                          <span>{remanejamento.createdBy}</span>
                        </div>
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Criado em {formatDate(remanejamento.createdAt)}</span>
                        </div>
                        {remanejamento.status && (
                          <div
                            className={`inline-flex rounded-full px-3 py-1.5 font-medium ${
                              remanejamento.status === 'APROVADO'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {remanejamento.status}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AppModalShell>

      <ComebackConfirmationModal
        isOpen={Boolean(pendingComeback)}
        transferId={pendingComeback?.id ?? null}
        amountLabel={formatCurrency(pendingComeback?.valor ?? 0)}
        returnFromLabel={
          pendingComeback?.itemDestino?.descricao || `Item #${pendingComeback?.itemDestinoId ?? '-'}`
        }
        returnToLabel={
          pendingComeback?.itemOrigem?.descricao || `Item #${pendingComeback?.itemOrigemId ?? '-'}`
        }
        isSubmitting={isSubmitting}
        onClose={() => setPendingComeback(null)}
        onConfirm={() => {
          void handleConfirmComeback(pendingComeback, onComeback, setPendingComeback);
        }}
      />
    </>
  );
}

function handleConfirmComeback(
  pendingComeback: Remanejamento | null,
  onComeback: ((remanejamentoId: string) => Promise<void> | void) | undefined,
  setPendingComeback: (value: Remanejamento | null) => void
) {
  if (!pendingComeback || !onComeback) {
    return;
  }

  const remanejamentoId = pendingComeback.id;
  setPendingComeback(null);
  void onComeback(remanejamentoId);
}

function parseTimestamp(value: string | undefined) {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateString: string) {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}
