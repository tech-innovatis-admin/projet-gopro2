"use client";

import { useState, useEffect, useRef } from "react";
import { X, Upload, FileText, AlertCircle, Edit } from "lucide-react";
import type { Arquivo, TipoArquivo } from "../page";

interface EditarArquivoForm {
  tipo: TipoArquivo;
  arquivo: File | null;
  descricao: string;
}

type FormErrors = Partial<Record<keyof EditarArquivoForm, string>>;

interface EditarArquivoModalProps {
  isOpen: boolean;
  onClose: () => void;
  arquivo: Arquivo | null;
  onSubmit?: (data: { id: string; tipo: TipoArquivo; arquivo: File | null; descricao: string }) => Promise<void> | void;
}

// Labels dos tipos
const tipoLabels: Record<TipoArquivo, string> = {
  CONTRATO_ASSINADO: "Contrato",
  PLANO_TRABALHO: "Plano de Trabalho",
  TERMO_REFERENCIA: "Termo de Referência",
  ATA_REUNIAO: "Ata de Reunião",
  RELATORIO_TECNICO: "Relatório Técnico",
  RELATORIO_FINANCEIRO: "Relatório Financeiro",
  COMPROVANTE_DESPESA: "Comprovante de Despesa",
  PROPOSTA_COMERCIAL: "Proposta comercial",
  ETP: "ETP",
  RELATORIO_INCUBADAS: "Relatórios de Incubadas",
  NOTA_FISCAL: "Nota Fiscal",
  OUTROS: "Outros",
};

// Formatos aceitos
const formatosAceitos = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg";
const tamanhoMaximo = 100 * 1024 * 1024; // 100MB

// Formatar tamanho
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// Componente FormField
function FormField({
  label,
  required,
  error,
  icon,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        {icon && <span className="text-gray-400">{icon}</span>}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <div className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export function EditarArquivoModal({
  isOpen,
  onClose,
  arquivo,
  onSubmit,
}: EditarArquivoModalProps) {
  const [form, setForm] = useState<EditarArquivoForm>({
    tipo: "OUTROS",
    arquivo: null,
    descricao: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [arquivoSubstituido, setArquivoSubstituido] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && arquivo) {
      setForm({
        tipo: arquivo.tipo,
        arquivo: null,
        descricao: arquivo.descricao || "",
      });
      setErrors({});
      setIsSubmitting(false);
      setArquivoSubstituido(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isOpen, arquivo]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  // Handle change
  const handleChange = (field: keyof EditarArquivoForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (field === "arquivo" && value) {
      setArquivoSubstituido(true);
    }
  };

  // Handle blur
  const handleBlur = (field: keyof EditarArquivoForm) => {
    validateField(field, form[field]);
  };

  // Validate field
  const validateField = (field: keyof EditarArquivoForm, value: any) => {
    let error = "";

    switch (field) {
      case "arquivo":
        if (arquivoSubstituido && value && value.size > tamanhoMaximo) {
          error = `Arquivo muito grande. Tamanho máximo: ${formatFileSize(tamanhoMaximo)}`;
        }
        break;
      case "tipo":
        if (!value) {
          error = "Selecione o tipo de documento";
        }
        break;
    }

    setErrors((prev) => ({ ...prev, [field]: error }));
    return !error;
  };

  // Validate form
  const validateForm = () => {
    let isValid = true;

    if (!validateField("tipo", form.tipo)) {
      isValid = false;
    }

    if (arquivoSubstituido && form.arquivo) {
      if (!validateField("arquivo", form.arquivo)) {
        isValid = false;
      }
    }

    return isValid;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!arquivo) return;

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit({
          id: arquivo.id,
          tipo: form.tipo,
          arquivo: form.arquivo,
          descricao: form.descricao,
        });
      }
      onClose();
    } catch (error) {
      console.error("Erro ao editar arquivo:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle file select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > tamanhoMaximo) {
        setErrors((prev) => ({
          ...prev,
          arquivo: `Arquivo muito grande. Tamanho máximo: ${formatFileSize(tamanhoMaximo)}`,
        }));
        return;
      }
      handleChange("arquivo", file);
    }
  };

  if (!isOpen || !arquivo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#004225]/10 rounded-lg">
              <Edit className="h-5 w-5 text-[#004225]" />
            </div>
            <div>
              <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
                Editar Arquivo
              </h2>
              <p className="text-sm text-gray-500">
                Atualize as informações do documento
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-5">
            {/* Arquivo Atual */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Arquivo Atual</p>
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {arquivo.nome}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(arquivo.tamanho)} • {arquivo.formato.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>

            {/* Tipo de Documento */}
            <FormField
              label="Tipo de Documento"
              required
              error={errors.tipo}
              icon={<FileText className="h-4 w-4" />}
            >
              <select
                value={form.tipo}
                onChange={(e) => handleChange("tipo", e.target.value as TipoArquivo)}
                onBlur={() => handleBlur("tipo")}
                className={`w-full h-11 px-4 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#004225]/20 transition-colors appearance-none cursor-pointer ${
                  errors.tipo
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-300 focus:border-[#004225]"
                }`}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: "right 0.75rem center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "1.25rem",
                  paddingRight: "2.5rem",
                }}
              >
                {Object.entries(tipoLabels)
                  .sort(([, labelA], [, labelB]) => labelA.localeCompare(labelB, "pt-BR"))
                  .map(([tipo, label]) => (
                    <option key={tipo} value={tipo}>
                      {label}
                    </option>
                  ))}
              </select>
            </FormField>

            {/* Substituir Arquivo */}
            <FormField
              label="Substituir Arquivo (opcional)"
              error={errors.arquivo}
              icon={<Upload className="h-4 w-4" />}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={formatosAceitos}
                onChange={handleFileSelect}
                onBlur={() => handleBlur("arquivo")}
                className={`w-full px-3 py-2 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#004225]/20 file:mr-4 file:py-1.5 file:px-4 file:rounded file:border-0 file:bg-[#004225] file:text-white file:cursor-pointer hover:file:bg-[#003319] ${
                  errors.arquivo
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-300 focus:border-[#004225]"
                }`}
              />
              <p className="text-xs text-gray-500 mt-1.5">
                Deixe em branco para manter o arquivo atual. Formatos aceitos: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG. Tamanho máximo: 100MB
              </p>
              {form.arquivo && (
                <div className="mt-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-emerald-900 truncate">
                        {form.arquivo.name}
                      </p>
                      <p className="text-xs text-emerald-700">
                        {formatFileSize(form.arquivo.size)} • Novo arquivo
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleChange("arquivo", null);
                        setArquivoSubstituido(false);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      className="p-1 text-emerald-600 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </FormField>

            {/* Descrição */}
            <FormField
              label="Descrição"
              icon={<FileText className="h-4 w-4" />}
            >
              <textarea
                value={form.descricao}
                onChange={(e) => handleChange("descricao", e.target.value)}
                placeholder="Breve descrição do documento (opcional)"
                rows={3}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors resize-none"
              />
            </FormField>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 bg-white border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

