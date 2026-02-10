"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, Eye, Plus, X } from "lucide-react";

interface ProjectCreatedModalProps {
  open: boolean;
  createdProjectId?: number | null;
  message?: string | null;
  pendingAction?: "view" | "new" | null;
  onClose: () => void;
  onViewCreated: () => void | Promise<void>;
  onCreateAnother: () => void | Promise<void>;
}

export function ProjectCreatedModal({
  open,
  createdProjectId,
  message,
  pendingAction,
  onClose,
  onViewCreated,
  onCreateAnother,
}: ProjectCreatedModalProps) {
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  const isPending = pendingAction !== null;

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => primaryButtonRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isPending, onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/45 p-4 flex items-center justify-center"
      onClick={() => {
        if (!isPending) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-created-title"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h2 id="project-created-title" className="text-lg font-semibold text-gray-900">
                Projeto cadastrado com sucesso
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {message ?? "O cadastro foi concluido com sucesso."}
              </p>
              {createdProjectId ? (
                <p className="mt-2 text-xs text-gray-500">
                  ID do projeto: <span className="font-semibold text-gray-700">{createdProjectId}</span>
                </p>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Fechar modal de sucesso"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={() => void onCreateAnother()}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            {pendingAction === "new" ? "Preparando..." : "Cadastrar novo projeto"}
          </button>
          <button
            ref={primaryButtonRef}
            type="button"
            onClick={() => void onViewCreated()}
            disabled={isPending || !createdProjectId}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Eye className="h-4 w-4" />
            {pendingAction === "view" ? "Abrindo..." : "Ver cadastro realizado"}
          </button>
        </div>
      </div>
    </div>
  );
}
