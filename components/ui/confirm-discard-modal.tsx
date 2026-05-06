'use client';

import { AlertCircle } from 'lucide-react';
import { AppModalShell } from './app-modal-shell';

type ConfirmDiscardModalProps = {
  isOpen: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
};

export function ConfirmDiscardModal({
  isOpen,
  title = 'Descartar alterações?',
  message = 'Você tem alterações não salvas. Tem certeza que deseja descartar?',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDiscardModalProps) {
  return (
    <AppModalShell
      isOpen={isOpen}
      title={title}
      description={message}
      icon={<AlertCircle className="h-5 w-5" />}
      tone="warning"
      onClose={onCancel}
      closeDisabled={isLoading}
      maxWidthClassName="max-w-md"
      footer={
        <div className="flex justify-end gap-2">
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
            {isLoading ? 'Descartando...' : 'Descartar'}
          </button>
        </div>
      }
    />
  );
}
