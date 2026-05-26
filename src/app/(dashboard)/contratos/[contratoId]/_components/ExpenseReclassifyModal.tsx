'use client';

import { Pencil, Save } from 'lucide-react';
import { AppModalShell } from '@/components/ui/app-modal-shell';
import { Dropdown, type DropdownOption } from '@/components/ui/dropdown';

type ReclassifyFieldErrors = {
  targetBudgetItemId?: string;
  reason?: string;
};

type ExpenseReclassifyModalProps = {
  isOpen: boolean;
  isPersisting: boolean;
  currentItemLabel: string | null;
  targetOptions: DropdownOption[];
  targetItemId: string | null;
  reason: string;
  fieldErrors: ReclassifyFieldErrors;
  onClose: () => void;
  onChangeTargetItemId: (value: string | null) => void;
  onChangeReason: (value: string) => void;
  onConfirm: () => void;
};

export function ExpenseReclassifyModal({
  isOpen,
  isPersisting,
  currentItemLabel,
  targetOptions,
  targetItemId,
  reason,
  fieldErrors,
  onClose,
  onChangeTargetItemId,
  onChangeReason,
  onConfirm,
}: ExpenseReclassifyModalProps) {
  return (
    <AppModalShell
      isOpen={isOpen}
      title="Reclassificar despesa"
      description="Mova o lançamento para outro item de rubrica com motivo obrigatório."
      icon={<Pencil className="h-5 w-5" />}
      tone="neutral"
      onClose={() => {
        if (!isPersisting) onClose();
      }}
      maxWidthClassName="max-w-2xl"
      closeDisabled={isPersisting}
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPersisting}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPersisting}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Confirmar reclassificação
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {currentItemLabel ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs font-medium text-slate-500">Item de origem</p>
            <p className="text-sm font-semibold text-slate-900">{currentItemLabel}</p>
          </div>
        ) : null}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Item de destino <span className="text-red-500">*</span>
          </label>
          <Dropdown
            searchable
            options={targetOptions}
            value={targetItemId ?? undefined}
            placeholder="Selecione o item de destino"
            onChange={(value) => onChangeTargetItemId(value ?? null)}
            disabled={isPersisting}
          />
          {fieldErrors.targetBudgetItemId ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.targetBudgetItemId}</p>
          ) : null}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Motivo <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(event) => onChangeReason(event.target.value)}
            rows={3}
            disabled={isPersisting}
            placeholder="Descreva o motivo da reclassificação"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-500/15 disabled:cursor-not-allowed disabled:opacity-60"
          />
          {fieldErrors.reason ? <p className="mt-1 text-xs text-red-600">{fieldErrors.reason}</p> : null}
        </div>
      </div>
    </AppModalShell>
  );
}
