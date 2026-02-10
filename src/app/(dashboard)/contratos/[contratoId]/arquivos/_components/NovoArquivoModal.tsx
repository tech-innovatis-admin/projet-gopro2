"use client";

import { useMemo, useState } from "react";
import { AlertCircle, FileText, UploadCloud, X } from "lucide-react";
import type { ContractDocumentCategory } from "../page";

type NewFilePayload = {
  category: ContractDocumentCategory;
  file: File;
};

type Props = {
  isOpen: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: NewFilePayload) => Promise<void> | void;
};

const CATEGORY_LABELS: Record<ContractDocumentCategory, string> = {
  CONTRATO: "Contrato",
  PLANO_TRABALHO: "Plano de Trabalho",
  TERMO_REFERENCIA: "Termo de Referencia",
  ATA_REUNIAO: "Ata de Reuniao",
  RELATORIO_TECNICO: "Relatorio Tecnico",
  RELATORIO_FINANCEIRO: "Relatorio Financeiro",
  COMPROVANTE_DESPESA: "Comprovante de Despesa",
  PROPOSTA_COMERCIAL: "Proposta Comercial",
  ETP: "ETP",
  RELATORIO_INCUBADAS: "Relatorio de Incubadas",
  NOTA_FISCAL: "Nota Fiscal",
  TED: "TED",
  COMPROVANTES: "Comprovantes",
  OUTRO: "Outros",
};

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ContractDocumentCategory[];
const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function NovoArquivoModal({
  isOpen,
  isSubmitting = false,
  onClose,
  onSubmit,
}: Props) {
  const [category, setCategory] = useState<ContractDocumentCategory>("OUTRO");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentFileName = useMemo(() => {
    if (!file) return null;
    return `${file.name} (${formatFileSize(file.size)})`;
  }, [file]);

  const handleFileChange = (nextFile: File | null) => {
    if (!nextFile) {
      setFile(null);
      return;
    }
    if (nextFile.size > MAX_FILE_SIZE) {
      setError(
        `Arquivo maior que o permitido (${formatFileSize(MAX_FILE_SIZE)}).`
      );
      return;
    }
    setError(null);
    setFile(nextFile);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError("Selecione um arquivo para upload.");
      return;
    }
    setError(null);
    await onSubmit({ category, file });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-[#004225]" />
            <h3 className="text-base font-semibold text-gray-900">Novo Arquivo</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            aria-label="Fechar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Categoria do arquivo
            </label>
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
            <label className="text-sm font-medium text-gray-700">Arquivo</label>
            <input
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              onChange={(event) =>
                handleFileChange(event.target.files?.[0] ?? null)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-[#004225] file:px-3 file:py-1.5 file:text-white file:hover:bg-[#003319]"
            />
            <p className="text-xs text-gray-500">
              Formatos aceitos: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG.
              Tamanho maximo: {formatFileSize(MAX_FILE_SIZE)}.
            </p>
            {currentFileName && (
              <div className="inline-flex items-center gap-2 rounded-md bg-gray-50 px-2.5 py-1.5 text-xs text-gray-700">
                <FileText className="h-3.5 w-3.5" />
                {currentFileName}
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
              onClick={onClose}
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
              {isSubmitting ? "Enviando..." : "Enviar arquivo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
