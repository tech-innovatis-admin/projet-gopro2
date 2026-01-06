"use client";

import { useState, useRef, useEffect } from "react";
import { X, Upload, FileText, Trash2, AlertCircle } from "lucide-react";

type PreProjetoFormData = {
  titulo: string;
  govIf: "IF" | "Gov" | "";
  tipo: "PROJETO" | "PRODUTO" | "";
  parceiro: string;
  localidade: string;
  valorTotal: string; // Formato: "1.000,00"
  documentos: {
    contrato?: File;
    tr?: File;
    planoTrabalho?: File;
    outro?: File;
  };
};

type PreProjetoFormErrors = Partial<Record<keyof PreProjetoFormData, string>>;

type TipoDocumento = "contrato" | "tr" | "planoTrabalho" | "outro";

const documentoLabels: Record<TipoDocumento, string> = {
  contrato: "Contrato",
  tr: "TR (Termo de Referência)",
  planoTrabalho: "Plano de Trabalho",
  outro: "Outro Documento",
};

const parceirosOptions = [
  "Fapto",
  "Fadex",
  "IFMA",
  "Fundação Araucária",
  "Fundação UFRGS",
  "Fundação XYZ",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

interface NovoPreProjetoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PreProjetoFormData) => void;
}

export default function NovoPreProjetoModal({
  isOpen,
  onClose,
  onSubmit,
}: NovoPreProjetoModalProps) {
  const [formData, setFormData] = useState<PreProjetoFormData>({
    titulo: "",
    govIf: "",
    tipo: "",
    parceiro: "",
    localidade: "",
    valorTotal: "",
    documentos: {},
  });
  const [errors, setErrors] = useState<PreProjetoFormErrors>({});
  const [fileErrors, setFileErrors] = useState<Record<TipoDocumento, string>>({
    contrato: "",
    tr: "",
    planoTrabalho: "",
    outro: "",
  });
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus no primeiro campo quando modal abre
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Fechar clicando fora
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  // Formatação monetária
  const formatCurrency = (value: string): string => {
    const onlyNumbers = value.replace(/\D/g, "");
    if (!onlyNumbers) return "";

    const numberValue = parseInt(onlyNumbers, 10) / 100;
    return numberValue.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setFormData({ ...formData, valorTotal: formatted });
    if (errors.valorTotal) {
      setErrors({ ...errors, valorTotal: undefined });
    }
  };

  // Upload de arquivos
  const handleFileChange = (tipo: TipoDocumento, file: File | null) => {
    if (!file) {
      const newDocs = { ...formData.documentos };
      delete newDocs[tipo];
      setFormData({ ...formData, documentos: newDocs });
      setFileErrors({ ...fileErrors, [tipo]: "" });
      return;
    }

    // Validações
    if (file.size > MAX_FILE_SIZE) {
      setFileErrors({ ...fileErrors, [tipo]: "Arquivo muito grande. Máximo: 10MB" });
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileErrors({
        ...fileErrors,
        [tipo]: "Formato inválido. Aceitos: PDF, DOC, DOCX, XLS, XLSX",
      });
      return;
    }

    setFormData({
      ...formData,
      documentos: { ...formData.documentos, [tipo]: file },
    });
    setFileErrors({ ...fileErrors, [tipo]: "" });
  };

  const removeFile = (tipo: TipoDocumento) => {
    const newDocs = { ...formData.documentos };
    delete newDocs[tipo];
    setFormData({ ...formData, documentos: newDocs });
    setFileErrors({ ...fileErrors, [tipo]: "" });
  };

  // Validação
  const validate = (): boolean => {
    const newErrors: PreProjetoFormErrors = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = "Título é obrigatório";
    } else if (formData.titulo.length > 200) {
      newErrors.titulo = "Título deve ter no máximo 200 caracteres";
    }

    if (!formData.govIf || (formData.govIf !== "IF" && formData.govIf !== "Gov")) {
      newErrors.govIf = "Selecione uma opção";
    }

    if (!formData.tipo) {
      newErrors.tipo = "Selecione o tipo de contrato";
    }

    if (!formData.parceiro) {
      newErrors.parceiro = "Selecione o parceiro";
    }

    if (!formData.localidade.trim()) {
      newErrors.localidade = "Localidade é obrigatória";
    }

    if (!formData.valorTotal) {
      newErrors.valorTotal = "Valor total é obrigatório";
    } else {
      const numericValue = parseFloat(
        formData.valorTotal.replace(/\./g, "").replace(",", ".")
      );
      if (isNaN(numericValue) || numericValue <= 0) {
        newErrors.valorTotal = "Valor inválido";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
      handleReset();
    }
  };

  const handleReset = () => {
    setFormData({
      titulo: "",
      govIf: "",
      tipo: "",
      parceiro: "",
      localidade: "",
      valorTotal: "",
      documentos: {},
    });
    setErrors({});
    setFileErrors({ contrato: "", tr: "", planoTrabalho: "", outro: "" });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#004225] to-[#00563A] text-white">
          <div>
            <h2 className="text-xl font-bold">Novo Pré-Contrato</h2>
            <p className="text-sm text-emerald-100 mt-0.5">
              Cadastre uma proposta antes da formalização
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Título */}
            <FormField
              label="Título do Projeto"
              required
              error={errors.titulo}
              description="Nome descritivo do pré-projeto"
            >
              <input
                ref={firstInputRef}
                type="text"
                value={formData.titulo}
                onChange={(e) => {
                  setFormData({ ...formData, titulo: e.target.value });
                  if (errors.titulo) setErrors({ ...errors, titulo: undefined });
                }}
                className={inputClassName(!!errors.titulo)}
                placeholder="Ex: Sistema de Gestão Acadêmica"
                maxLength={200}
              />
            </FormField>

            {/* Grid: Gov/IF, Tipo e Parceiro */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Gov/IF" required error={errors.govIf}>
                <select
                  value={formData.govIf}
                  onChange={(e) => {
                    setFormData({ ...formData, govIf: e.target.value as "IF" | "Gov" | "" });
                    if (errors.govIf) setErrors({ ...errors, govIf: undefined });
                  }}
                  className={inputClassName(!!errors.govIf)}
                >
                  <option value="">Selecione...</option>
                  <option value="IF">IF</option>
                  <option value="Gov">Gov</option>
                </select>
              </FormField>

              <FormField label="Tipo de Contrato" required error={errors.tipo}>
                <select
                  value={formData.tipo}
                  onChange={(e) => {
                    setFormData({ ...formData, tipo: e.target.value as any });
                    if (errors.tipo) setErrors({ ...errors, tipo: undefined });
                  }}
                  className={inputClassName(!!errors.tipo)}
                >
                  <option value="">Selecione...</option>
                  <option value="PROJETO">Projeto</option>
                  <option value="PRODUTO">Produto</option>
                </select>
              </FormField>

              <FormField label="Parceiro" required error={errors.parceiro}>
                <select
                  value={formData.parceiro}
                  onChange={(e) => {
                    setFormData({ ...formData, parceiro: e.target.value });
                    if (errors.parceiro) setErrors({ ...errors, parceiro: undefined });
                  }}
                  className={inputClassName(!!errors.parceiro)}
                >
                  <option value="">Selecione...</option>
                  {parceirosOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            {/* Grid: Localidade e Valor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Localidade"
                required
                error={errors.localidade}
              >
                <input
                  type="text"
                  value={formData.localidade}
                  onChange={(e) => {
                    setFormData({ ...formData, localidade: e.target.value });
                    if (errors.localidade) setErrors({ ...errors, localidade: undefined });
                  }}
                  className={inputClassName(!!errors.localidade)}
                  placeholder="Ex: Estado do Rio de Janeiro"
                />
              </FormField>

              <FormField
                label="Valor Total Estimado"
                required
                error={errors.valorTotal}
              >
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    R$
                  </span>
                  <input
                    type="text"
                    value={formData.valorTotal}
                    onChange={handleValorChange}
                    className={`${inputClassName(!!errors.valorTotal)} pl-12`}
                    placeholder="0,00"
                  />
                </div>
              </FormField>
            </div>

            {/* Documentos */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#004225]" />
                <h3 className="text-sm font-semibold text-gray-900">Documentos (Opcionais)</h3>
              </div>
              <p className="text-xs text-gray-500">
                Anexe documentos relacionados ao pré-projeto. Formatos aceitos: PDF, DOC, DOCX,
                XLS, XLSX. Tamanho máximo: 10MB por arquivo.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(["contrato", "tr", "planoTrabalho", "outro"] as TipoDocumento[]).map((tipo) => (
                  <FileUploadField
                    key={tipo}
                    label={documentoLabels[tipo]}
                    tipo={tipo}
                    file={formData.documentos[tipo]}
                    error={fileErrors[tipo]}
                    onChange={(file) => handleFileChange(tipo, file)}
                    onRemove={() => removeFile(tipo)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors shadow-sm hover:shadow-md"
            >
              Criar Pré-Contrato
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Componentes auxiliares
function FormField({
  label,
  required,
  error,
  description,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {description && !error && <p className="text-xs text-gray-500">{description}</p>}
      {error && (
        <div className="flex items-center gap-1.5 text-red-600">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <p className="text-xs font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}

function FileUploadField({
  label,
  tipo,
  file,
  error,
  onChange,
  onRemove,
}: {
  label: string;
  tipo: TipoDocumento;
  file?: File;
  error?: string;
  onChange: (file: File | null) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm border-2 border-dashed rounded-lg transition-colors ${
            error
              ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
              : "border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:border-gray-400"
          }`}
        >
          <Upload className="h-4 w-4" />
          Selecionar arquivo
        </button>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
          <FileText className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span className="text-xs text-emerald-900 flex-1 truncate" title={file.name}>
            {file.name}
          </span>
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-emerald-700 hover:bg-emerald-100 rounded transition-colors"
            title="Remover arquivo"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        className="hidden"
      />
      {error && (
        <div className="flex items-center gap-1 text-red-600">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          <p className="text-xs">{error}</p>
        </div>
      )}
    </div>
  );
}

function inputClassName(hasError: boolean) {
  return `w-full px-3 py-2.5 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 ${
    hasError
      ? "border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500"
      : "border-gray-300 focus:ring-[#004225] focus:border-[#004225]"
  }`;
}
