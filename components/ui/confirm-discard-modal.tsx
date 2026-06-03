'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

type ConfirmDiscardModalProps = {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
};

export function ConfirmDiscardModal({
  isOpen,
  title = 'Descartar alterações?',
  message = 'Você tem alterações não salvas. Tem certeza que deseja descartar?',
  confirmLabel = 'Descartar',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDiscardModalProps) {
  useEffect(() => {
    if (!isOpen || isLoading) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoading, isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={() => {
        if (!isLoading) {
          onCancel();
        }
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-discard-title"
        aria-describedby="confirm-discard-description"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-20px_rgba(15,23,42,0.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="h-1.5 w-full bg-amber-500" />
        <div className="flex items-start gap-3 border-b border-slate-200 px-6 py-5">
          <div className="rounded-xl bg-amber-100 p-2 text-amber-800">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 id="confirm-discard-title" className="text-lg font-semibold text-slate-950">
              {title}
            </h2>
            <p id="confirm-discard-description" className="mt-1 text-sm text-slate-600">
              {message}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 bg-slate-50/90 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Aguarde...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
