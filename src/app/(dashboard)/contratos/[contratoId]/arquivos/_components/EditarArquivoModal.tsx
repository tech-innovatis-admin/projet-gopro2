"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Pencil, UploadCloud, X } from "lucide-react";
import { ConfirmDiscardModal } from "@/components/ui/confirm-discard-modal";
import { useModalCloseGuard } from "@/src/hooks/useModalCloseGuard";
import {
  DOCUMENT_UPLOAD_ALLOWED_MIME_TYPES,
  UPLOAD_MAX_FILE_SIZE_BYTES,
  formatFileSize,
  validateUploadFile,
} from "@/src/lib/upload";
import type { ContractDocument, ContractDocumentCategory } from "../page";

type ReplacePayload = {
  id: string;
  category: ContractDocumentCategory;
  file: File;
};

type Props = {
  isOpen: boolean;
  isSubmitting?: boolean;
  arquivo: ContractDocument | null;
  onClose: () => void;
  onSubmit: (payload: ReplacePayload) => Promise<void> | void;
};

const CATEGORY_LABELS: Record<ContractDocumentCategory, string> = {
  CONTRATO: "Contrato",
  PLANO_TRABALHO: "Plano de Trabalho",
  TERMO_REFERENCIA: "Termo de Referencia",
  ATA_REUNIAO: "Ata de Reuniao",
  RELATORIO_TECNICO: "Relatório Técnico",
  RELATORIO_FINANCEIRO: "Relatório Financeiro",
  COMPROVANTE_DESPESA: "Comprovante de Despesa",
  PROPOSTA_COMERCIAL: "Proposta Comercial",
  ETP: "ETP",
  RELATORIO_INCUBADAS: "Relatório de Incubadas",
  NOTA_FISCAL: "Nota Fiscal",
  TED: "TED",
  COMPROVANTES: "Comprovantes",
  TERMO_REMANEJAMENTO: "Termo de Remanejamento",
  OUTRO: "Outros",
};

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ContractDocumentCategory[];
const ACCEPTED_FILE_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg";

export function EditarArquivoModal({
  isOpen,
  isSubmitting = false,
  arquivo,
  onClose,
  onSubmit,
}: Props) {
  const [category, setCategory] = useState<ContractDocumentCategory>(
    arquivo?.category ?? "OUTRO"
  );
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasFilledData = file !== null || (arquivo ? category !== arquivo.category : false);
  const resetModalState = useCallback(() => {
    setCategory(arquivo?.category ?? "OUTRO");
    setFile(null);
    setError(null);
  }, [arquivo?.category]);
  const { requestClose, discardConfirmProps } = useModalCloseGuard({
    isOpen,
    shouldConfirm: hasFilledData,
    closeDisabled: isSubmitting,
    onClose,
    onDiscardConfirm: resetModalState,
  });

  const replacementFileLabel = useMemo(() => {
    if (!file) return null;
    return `${file.name} (${formatFileSize(file.size)})`;
  }, [file]);

  useEffect(() => {
    resetModalState();
  }, [arquivo?.id, isOpen, resetModalState]);

  const handleFileChange = (nextFile: File | null) => {
    if (!nextFile) {
      setFile(null);
      return;
    }
    const fileValidationError = validateUploadFile({
      file: nextFile,
      maxBytes: UPLOAD_MAX_FILE_SIZE_BYTES,
      allowedMimeTypes: DOCUMENT_UPLOAD_ALLOWED_MIME_TYPES,
      allowedTypesLabel: "PDF, DOC, DOCX, XLS, XLSX, PNG, JPG e JPEG",
    });
    if (fileValidationError) {
      setError(fileValidationError);
      return;
    }
    setError(null);
    setFile(nextFile);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!arquivo) return;
    if (!file) {
      setError("Selecione o novo arquivo para substituir o atual.");
      return;
    }
    setError(null);
    await onSubmit({
      id: arquivo.id,
      category,
      file,
    });
  };

  if (!isOpen || !arquivo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          requestClose();
        }
      }}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-[#004225]" />
            <h3 className="text-base font-semibold text-gray-900">
              Editar Arquivo
            </h3>
          </div>
          <button
            type="button"
            onClick={requestClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            aria-label="Fechar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Arquivo atual
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {arquivo.originalName}
            </p>
            <p className="text-xs text-gray-600">
              {formatFileSize(arquivo.sizeBytes)}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Categoria</label>
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as ContractDocumentCategory)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#004225]"
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {CATEGORY_LABELS[item]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Novo arquivo
            </label>
            <input
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              onChange={(event) =>
                handleFileChange(event.target.files?.[0] ?? null)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-[#004225] file:px-3 file:py-1.5 file:text-white file:hover:bg-[#003319]"
            />
            <p className="text-xs text-gray-500">
              Esta ação substitui o documento atual. Tamanho máximo:{" "}
              {formatFileSize(UPLOAD_MAX_FILE_SIZE_BYTES)}.
            </p>
            {replacementFileLabel && (
              <div className="inline-flex items-center gap-2 rounded-md bg-gray-50 px-2.5 py-1.5 text-xs text-gray-700">
                <UploadCloud className="h-3.5 w-3.5" />
                {replacementFileLabel}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={requestClose}
              disabled={isSubmitting}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-[#004225] px-4 py-2 text-sm font-medium text-white hover:bg-[#003319] disabled:opacity-50"
            >
              {isSubmitting ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>
      <ConfirmDiscardModal {...discardConfirmProps} />
    </div>
  );
}
