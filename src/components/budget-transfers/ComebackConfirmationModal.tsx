"use client";

import { AlertCircle, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={() => {
        if (!isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="comeback-confirmation-title"
        className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-amber-100 p-2 text-amber-800">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h2 id="comeback-confirmation-title" className="text-lg font-semibold text-zinc-900">
                Confirmar comeback
              </h2>
              <p className="text-sm text-zinc-600">
                O remanejamento #{transferId ?? "-"} sera desfeito e o retorno ficara registrado no historico.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Fechar confirmacao"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Esse retorno anula o efeito do remanejamento na tabela de rubricas, mas preserva o historico.</p>
            </div>
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Valor</dt>
              <dd className="mt-1 text-sm font-semibold text-zinc-900">{amountLabel}</dd>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Retorno</dt>
              <dd className="mt-1 text-sm text-zinc-900">
                de &quot;{returnFromLabel}&quot; para &quot;{returnToLabel}&quot;
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-zinc-200 px-6 py-4 sm:flex-row sm:justify-end">
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
            {isSubmitting ? "Registrando..." : "Confirmar comeback"}
          </Button>
        </div>
      </div>
    </div>
  );
}
