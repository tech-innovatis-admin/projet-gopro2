"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Upload, FileText, Trash2, AlertCircle, Loader2 } from "lucide-react";
import { listPartners, listPublicAgencies } from "@/src/lib/api/endpoints";
import { getUserErrorMessage } from "@/src/lib/feedback/user-messages";
import type {
  PageResponseDTO,
  PartnerResponseDTO,
  PublicAgencyResponseDTO,
} from "@/src/lib/api/types";

export type TipoDocumento = "contrato" | "tr" | "planoTrabalho" | "outro";
export type PreProjetoDocumentos = Partial<Record<TipoDocumento, File>>;

export type PreProjetoFormData = {
  titulo: string;
  objeto: string;
  govIf: "IF" | "Gov" | "";
  tipo: "PROJETO" | "PRODUTO" | "";
  primaryPartnerId: number | null;
  primaryPartnerName: string;
  primaryClientId: number | null;
  primaryClientName: string;
  localidade: string;
  valorTotal: string;
  documentos: PreProjetoDocumentos;
};

type PreProjetoFormErrors = Partial<
  Record<
    | "titulo"
    | "objeto"
    | "govIf"
    | "tipo"
    | "primaryPartnerId"
    | "primaryClientId"
    | "localidade"
    | "valorTotal",
    string
  >
>;

type SelectOption = {
  id: number;
  name: string;
};

const documentoLabels: Record<TipoDocumento, string> = {
  contrato: "Contrato",
  tr: "TR (Termo de Referencia)",
  planoTrabalho: "Plano de Trabalho",
  outro: "Outro Documento",
};

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const PAGE_SIZE = 20;

interface NovoPreProjetoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PreProjetoFormData) => Promise<void> | void;
}

function extractErrorMessage(error: unknown, fallback: string): string {
  return getUserErrorMessage(error, fallback);
}

async function fetchAllPages<T>(
  fetchPage: (params: { page: number; size: number }) => Promise<PageResponseDTO<T>>
): Promise<T[]> {
  const firstPage = await fetchPage({ page: 0, size: PAGE_SIZE });
  const requests = Array.from({ length: Math.max(0, firstPage.totalPages - 1) }, (_, index) =>
    fetchPage({ page: index + 1, size: PAGE_SIZE })
  );
  const otherPages = requests.length > 0 ? await Promise.all(requests) : [];
  return [firstPage, ...otherPages].flatMap((pageResponse) => pageResponse.content);
}

export default function NovoPreProjetoModal({
  isOpen,
  onClose,
  onSubmit,
}: NovoPreProjetoModalProps) {
  const [formData, setFormData] = useState<PreProjetoFormData>({
    titulo: "",
    objeto: "",
    govIf: "",
    tipo: "",
    primaryPartnerId: null,
    primaryPartnerName: "",
    primaryClientId: null,
    primaryClientName: "",
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
  const [partnerOptions, setPartnerOptions] = useState<SelectOption[]>([]);
  const [clientOptions, setClientOptions] = useState<SelectOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const loadOptions = useCallback(async () => {
    setIsLoadingOptions(true);
    setOptionsError(null);
    try {
      const [allPartners, allPublicAgencies] = await Promise.all([
        fetchAllPages<PartnerResponseDTO>(listPartners),
        fetchAllPages<PublicAgencyResponseDTO>(listPublicAgencies),
      ]);

      setPartnerOptions(
        allPartners
          .filter((partner) => partner.isActive)
          .map((partner) => ({ id: partner.id, name: partner.name }))
          .sort((a, b) => a.name.localeCompare(b.name))
      );

      setClientOptions(
        allPublicAgencies
          .filter((agency) => agency.isClient && agency.isActive)
          .map((agency) => ({ id: agency.id, name: agency.name }))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    } catch (loadError) {
      setOptionsError(
        extractErrorMessage(loadError, "Não foi possível carregar parceiros e clientes.")
      );
      setPartnerOptions([]);
      setClientOptions([]);
    } finally {
      setIsLoadingOptions(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void loadOptions();
    const focusTimeout = setTimeout(() => firstInputRef.current?.focus(), 100);
    return () => clearTimeout(focusTimeout);
  }, [isOpen, loadOptions]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, isSubmitting, onClose]);

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (isSubmitting) {
      return;
    }
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      onClose();
    }
  };

  const formatCurrency = (value: string): string => {
    const onlyNumbers = value.replace(/\D/g, "");
    if (!onlyNumbers) {
      return "";
    }

    const numberValue = parseInt(onlyNumbers, 10) / 100;
    return numberValue.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleValorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(event.target.value);
    setFormData((prev) => ({ ...prev, valorTotal: formatted }));
    if (errors.valorTotal) {
      setErrors((prev) => ({ ...prev, valorTotal: undefined }));
    }
  };

  const handleFileChange = (tipo: TipoDocumento, file: File | null) => {
    if (!file) {
      setFormData((prev) => {
        const nextDocs = { ...prev.documentos };
        delete nextDocs[tipo];
        return { ...prev, documentos: nextDocs };
      });
      setFileErrors((prev) => ({ ...prev, [tipo]: "" }));
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileErrors((prev) => ({
        ...prev,
        [tipo]: "Arquivo muito grande. Máximo: 20MB.",
      }));
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileErrors((prev) => ({
        ...prev,
        [tipo]: "Formato inválido. Aceitos: PDF, PNG, JPG ou JPEG.",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      documentos: { ...prev.documentos, [tipo]: file },
    }));
    setFileErrors((prev) => ({ ...prev, [tipo]: "" }));
  };

  const removeFile = (tipo: TipoDocumento) => {
    setFormData((prev) => {
      const nextDocs = { ...prev.documentos };
      delete nextDocs[tipo];
      return { ...prev, documentos: nextDocs };
    });
    setFileErrors((prev) => ({ ...prev, [tipo]: "" }));
  };

  const validate = (): boolean => {
    const newErrors: PreProjetoFormErrors = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = "Título obrigatório.";
    } else if (formData.titulo.trim().length > 200) {
      newErrors.titulo = "Título deve ter no máximo 200 caracteres.";
    }

    if (!formData.objeto.trim()) {
      newErrors.objeto = "Objeto obrigatório.";
    } else if (formData.objeto.trim().length < 10) {
      newErrors.objeto = "Objeto deve ter pelo menos 10 caracteres.";
    }

    if (!formData.govIf || (formData.govIf !== "IF" && formData.govIf !== "Gov")) {
      newErrors.govIf = "Selecione uma opção.";
    }

    if (!formData.tipo) {
      newErrors.tipo = "Selecione o tipo.";
    }

    if (!formData.primaryPartnerId) {
      newErrors.primaryPartnerId = "Selecione o parceiro primario.";
    }

    if (!formData.primaryClientId) {
      newErrors.primaryClientId = "Selecione o cliente primario.";
    }

    if (!formData.localidade.trim()) {
      newErrors.localidade = "Localidade obrigatória.";
    }

    if (!formData.valorTotal) {
      newErrors.valorTotal = "Valor total obrigatório.";
    } else {
      const numericValue = parseFloat(formData.valorTotal.replace(/\./g, "").replace(",", "."));
      if (!Number.isFinite(numericValue) || numericValue <= 0) {
        newErrors.valorTotal = "Valor inválido.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReset = () => {
    setFormData({
      titulo: "",
      objeto: "",
      govIf: "",
      tipo: "",
      primaryPartnerId: null,
      primaryPartnerName: "",
      primaryClientId: null,
      primaryClientName: "",
      localidade: "",
      valorTotal: "",
      documentos: {},
    });
    setErrors({});
    setFileErrors({ contrato: "", tr: "", planoTrabalho: "", outro: "" });
    setSubmitError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    if (isLoadingOptions) {
      setSubmitError("Aguarde o carregamento dos dados de parceiro e cliente.");
      return;
    }

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      handleReset();
      onClose();
    } catch (submitErr) {
      setSubmitError(extractErrorMessage(submitErr, "Não foi possível criar o pre-contrato."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#004225] to-[#00563A] text-white">
          <div>
            <h2 className="text-xl font-bold">Novo Pre-Contrato</h2>
            <p className="text-sm text-emerald-100 mt-0.5">
              Cadastre um pre-contrato e salve como projeto PRE_PROJETO
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {optionsError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {optionsError}
              </div>
            )}

            <FormField
              label="Título do Projeto"
              required
              error={errors.titulo}
              description="Nome descritivo do pre-contrato"
            >
              <input
                ref={firstInputRef}
                type="text"
                value={formData.titulo}
                onChange={(event) => {
                  setFormData((prev) => ({ ...prev, titulo: event.target.value }));
                  if (errors.titulo) {
                    setErrors((prev) => ({ ...prev, titulo: undefined }));
                  }
                }}
                className={inputClassName(Boolean(errors.titulo))}
                placeholder="Ex: Sistema de Gestão Academica"
                maxLength={200}
                disabled={isSubmitting}
              />
            </FormField>

            <FormField
              label="Objeto do Projeto"
              required
              error={errors.objeto}
              description="Descreva o escopo principal do projeto"
            >
              <textarea
                value={formData.objeto}
                onChange={(event) => {
                  setFormData((prev) => ({ ...prev, objeto: event.target.value }));
                  if (errors.objeto) {
                    setErrors((prev) => ({ ...prev, objeto: undefined }));
                  }
                }}
                className={`${inputClassName(Boolean(errors.objeto))} min-h-[88px] resize-y`}
                placeholder="Ex: Desenvolvimento e implantacao da solucao..."
                disabled={isSubmitting}
              />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Gov/IF" required error={errors.govIf}>
                <select
                  value={formData.govIf}
                  onChange={(event) => {
                    setFormData((prev) => ({
                      ...prev,
                      govIf: event.target.value as "IF" | "Gov" | "",
                    }));
                    if (errors.govIf) {
                      setErrors((prev) => ({ ...prev, govIf: undefined }));
                    }
                  }}
                  className={inputClassName(Boolean(errors.govIf))}
                  disabled={isSubmitting}
                >
                  <option value="">Selecione...</option>
                  <option value="IF">IF</option>
                  <option value="Gov">Gov</option>
                </select>
              </FormField>

              <FormField label="Tipo de Contrato" required error={errors.tipo}>
                <select
                  value={formData.tipo}
                  onChange={(event) => {
                    setFormData((prev) => ({
                      ...prev,
                      tipo: event.target.value as "PROJETO" | "PRODUTO" | "",
                    }));
                    if (errors.tipo) {
                      setErrors((prev) => ({ ...prev, tipo: undefined }));
                    }
                  }}
                  className={inputClassName(Boolean(errors.tipo))}
                  disabled={isSubmitting}
                >
                  <option value="">Selecione...</option>
                  <option value="PROJETO">Projeto</option>
                  <option value="PRODUTO">Produto</option>
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Parceiro Primario" required error={errors.primaryPartnerId}>
                <select
                  value={formData.primaryPartnerId ?? ""}
                  onChange={(event) => {
                    const id = event.target.value ? Number(event.target.value) : null;
                    const selected = partnerOptions.find((partner) => partner.id === id);
                    setFormData((prev) => ({
                      ...prev,
                      primaryPartnerId: id,
                      primaryPartnerName: selected?.name ?? "",
                    }));
                    if (errors.primaryPartnerId) {
                      setErrors((prev) => ({ ...prev, primaryPartnerId: undefined }));
                    }
                  }}
                  className={inputClassName(Boolean(errors.primaryPartnerId))}
                  disabled={isSubmitting || isLoadingOptions}
                >
                  <option value="">
                    {isLoadingOptions ? "Carregando parceiros..." : "Selecione..."}
                  </option>
                  {partnerOptions.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Cliente Primario" required error={errors.primaryClientId}>
                <select
                  value={formData.primaryClientId ?? ""}
                  onChange={(event) => {
                    const id = event.target.value ? Number(event.target.value) : null;
                    const selected = clientOptions.find((client) => client.id === id);
                    setFormData((prev) => ({
                      ...prev,
                      primaryClientId: id,
                      primaryClientName: selected?.name ?? "",
                    }));
                    if (errors.primaryClientId) {
                      setErrors((prev) => ({ ...prev, primaryClientId: undefined }));
                    }
                  }}
                  className={inputClassName(Boolean(errors.primaryClientId))}
                  disabled={isSubmitting || isLoadingOptions}
                >
                  <option value="">
                    {isLoadingOptions ? "Carregando clientes..." : "Selecione..."}
                  </option>
                  {clientOptions.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Localidade" required error={errors.localidade}>
                <input
                  type="text"
                  value={formData.localidade}
                  onChange={(event) => {
                    setFormData((prev) => ({ ...prev, localidade: event.target.value }));
                    if (errors.localidade) {
                      setErrors((prev) => ({ ...prev, localidade: undefined }));
                    }
                  }}
                  className={inputClassName(Boolean(errors.localidade))}
                  placeholder="Ex: Rio de Janeiro - RJ"
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label="Valor Total Estimado" required error={errors.valorTotal}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    R$
                  </span>
                  <input
                    type="text"
                    value={formData.valorTotal}
                    onChange={handleValorChange}
                    className={`${inputClassName(Boolean(errors.valorTotal))} pl-12`}
                    placeholder="0,00"
                    disabled={isSubmitting}
                  />
                </div>
              </FormField>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#004225]" />
                <h3 className="text-sm font-semibold text-gray-900">Documentos (opcional)</h3>
              </div>
              <p className="text-xs text-gray-500">
                Formatos aceitos: PDF, PNG, JPG, JPEG. Tamanho máximo: 20MB por arquivo.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(["contrato", "tr", "planoTrabalho", "outro"] as TipoDocumento[]).map((tipo) => (
                  <FileUploadField
                    key={tipo}
                    label={documentoLabels[tipo]}
                    file={formData.documentos[tipo]}
                    error={fileErrors[tipo]}
                    onChange={(file) => handleFileChange(tipo, file)}
                    onRemove={() => removeFile(tipo)}
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            </div>

            {submitError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoadingOptions || Boolean(optionsError)}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Criar Pre-Contrato"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
  file,
  error,
  onChange,
  onRemove,
  disabled,
}: {
  label: string;
  file?: File;
  error?: string;
  onChange: (file: File | null) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm border-2 border-dashed rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
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
            disabled={disabled}
            className="p-1 text-emerald-700 hover:bg-emerald-100 rounded transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            title="Remover arquivo"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
        className="hidden"
        disabled={disabled}
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
