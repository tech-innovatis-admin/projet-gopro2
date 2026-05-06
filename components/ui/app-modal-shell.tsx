'use client';

import { type ReactNode, useEffect, useId, useState } from 'react';
import { X } from 'lucide-react';
import { ConfirmDiscardModal } from './confirm-discard-modal';

type ModalTone = 'brand' | 'info' | 'warning' | 'danger' | 'neutral';

type AppModalShellProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  icon?: ReactNode;
  tone?: ModalTone;
  onClose: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  maxWidthClassName?: string;
  bodyClassName?: string;
  closeDisabled?: boolean;
  zIndexClassName?: string;
  // Novas props para segurança
  isDirty?: boolean;
  closeOnBackdropClick?: boolean;
  onDiscardConfirm?: () => void;
};

const toneStyles: Record<
  ModalTone,
  { accent: string; badge: string; title: string; description: string }
> = {
  brand: {
    accent: 'bg-[#004225]',
    badge: 'bg-emerald-100 text-[#004225]',
    title: 'text-slate-950',
    description: 'text-slate-600',
  },
  info: {
    accent: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-700',
    title: 'text-slate-950',
    description: 'text-slate-600',
  },
  warning: {
    accent: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-800',
    title: 'text-slate-950',
    description: 'text-slate-600',
  },
  danger: {
    accent: 'bg-red-500',
    badge: 'bg-red-100 text-red-700',
    title: 'text-slate-950',
    description: 'text-slate-600',
  },
  neutral: {
    accent: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-700',
    title: 'text-slate-950',
    description: 'text-slate-600',
  },
};

export function AppModalShell({
  isOpen,
  title,
  description,
  icon,
  tone = 'brand',
  onClose,
  children,
  footer,
  maxWidthClassName = 'max-w-3xl',
  bodyClassName = '',
  closeDisabled = false,
  zIndexClassName = 'z-[95]',
  isDirty = false,
  closeOnBackdropClick = false,
  onDiscardConfirm,
}: AppModalShellProps) {
  const titleId = useId();
  const descriptionId = useId();
  const palette = toneStyles[tone];
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Determinar se pode fechar baseado em estado
  const canClose = !closeDisabled;
  const shouldAskForConfirm = isDirty && !showDiscardConfirm;

  // Função para lidar com tentativa de fechar
  const handleCloseAttempt = () => {
    if (!canClose) return;
    
    if (shouldAskForConfirm) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  // Função confirmação de descarte
  const handleDiscardConfirm = () => {
    setShowDiscardConfirm(false);
    onDiscardConfirm?.();
    onClose();
  };

  useEffect(() => {
    if (!isOpen || !canClose) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleCloseAttempt();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canClose, isOpen, shouldAskForConfirm]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div
        className={`fixed inset-0 ${zIndexClassName} bg-slate-950/45 p-4 backdrop-blur-sm`}
        onClick={() => {
          // Só fechar por backdrop se permitido e não for operação crítica
          if (closeOnBackdropClick && !closeDisabled) {
            handleCloseAttempt();
          }
        }}
      >
        <div className="flex min-h-full items-center justify-center py-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-20px_rgba(15,23,42,0.45)] ${maxWidthClassName}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`h-1.5 w-full ${palette.accent}`} />

            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div className="flex min-w-0 items-start gap-3">
                {icon && (
                  <div className={`rounded-xl p-2 ${palette.badge}`}>
                    <div className="h-5 w-5">{icon}</div>
                  </div>
                )}

                <div className="min-w-0">
                  <h2 id={titleId} className={`text-lg font-semibold ${palette.title}`}>
                    {title}
                  </h2>
                  {description && (
                    <p id={descriptionId} className={`mt-1 text-sm ${palette.description}`}>
                      {description}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseAttempt}
                disabled={closeDisabled}
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Fechar modal de ${title}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className={`overflow-y-auto px-6 py-5 ${bodyClassName}`}>{children}</div>

            {footer && (
              <div className="border-t border-slate-200 bg-slate-50/90 px-6 py-4">{footer}</div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmação de descarte */}
      <ConfirmDiscardModal
        isOpen={showDiscardConfirm}
        onConfirm={handleDiscardConfirm}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    </>
  );
}
