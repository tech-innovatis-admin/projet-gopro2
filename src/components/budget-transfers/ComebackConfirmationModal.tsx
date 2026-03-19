'use client';

import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppModalShell } from '@/components/ui/app-modal-shell';

type ComebackConfirmationModalProps = {
  isOpen: boolean;
  transferId: string | number | null;
  amountLabel: string;
  returnFromLabel: string;
  returnToLabel: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ComebackConfirmationModal({
  isOpen,
  transferId,
  amountLabel,
  returnFromLabel,
  returnToLabel,
  isSubmitting = false,
  onClose,
  onConfirm,
}: ComebackConfirmationModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <AppModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmar comeback"
      description={`O remanejamento #${transferId ?? '-'} será desfeito e o retorno ficará registrado no histórico.`}
      icon={<RotateCcw className="h-5 w-5" />}
      tone="warning"
      maxWidthClassName="max-w-lg"
      closeDisabled={isSubmitting}
      zIndexClassName="z-[110]"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="bg-amber-600 text-white hover:bg-amber-700"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Registrando...' : 'Confirmar comeback'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Esse retorno anula o efeito do remanejamento na tabela de rubricas, mas preserva o
              histórico da movimentação.
            </p>
          </div>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Valor</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{amountLabel}</dd>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Direção do retorno
            </dt>
            <dd className="mt-1 text-sm text-slate-900">
              de &quot;{returnFromLabel}&quot; para &quot;{returnToLabel}&quot;
            </dd>
          </div>
        </dl>
      </div>
    </AppModalShell>
  );
}
