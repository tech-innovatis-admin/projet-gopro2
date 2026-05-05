"use client";

import { useState, useEffect, useRef } from "react";
import { X, Users, Building, GraduationCap, MapPin, Mail, Phone, Globe, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFormApiErrors } from "@/src/hooks/useFormApiErrors";
import { getUserErrorMessage } from "@/src/lib/feedback/user-messages";
import {
  type Parceiro,
  type ParceiroTipo,
  type ParceiroStatus,
  UF_LIST,
} from "../types";

// =============================================================================
// MODAL PARA NOVO PARCEIRO
// =============================================================================

interface NovoParceiroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    parceiro: Omit<Parceiro, "id" | "createdAt" | "totalContratos" | "contratosAtivos" | "valorTotalContratos">
  ) => Promise<void> | void;
}

type ViaCepResponse = {
  erro?: boolean;
  logradouro?: string;
  localidade?: string;
  uf?: string;
};

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function formatZipCode(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function formatPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCnpj(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

async function fetchViaCep(zipCode: string): Promise<ViaCepResponse> {
  const normalizedZipCode = onlyDigits(zipCode);
  if (normalizedZipCode.length !== 8) {
    throw new Error("CEP deve ter 8 dígitos.");
  }
  const response = await fetch(`https://viacep.com.br/ws/${normalizedZipCode}/json/`);
  if (!response.ok) {
    throw new Error("Falha ao consultar CEP.");
  }
  const data = (await response.json()) as ViaCepResponse;
  if (data.erro) {
    throw new Error("CEP não encontrado.");
  }
  return data;
}

type FormData = {
  nome: string;
  sigla: string;
  tipo: ParceiroTipo | "";
  cnpj: string;
  email: string;
  telefone: string;
  site: string;
  cep: string;
  uf: string;
  municipio: string;
  endereco: string;
  status: ParceiroStatus;
  observacoes: string;
};

const INITIAL_FORM: FormData = {
  nome: "",
  sigla: "",
  tipo: "",
  cnpj: "",
  email: "",
  telefone: "",
  site: "",
  cep: "",
  uf: "",
  municipio: "",
  endereco: "",
  status: "ATIVO",
  observacoes: "",
};

export function NovoParceiroModal({
  isOpen,
  onClose,
  onSubmit,
}: NovoParceiroModalProps) {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isZipCodeLoading, setIsZipCodeLoading] = useState(false);
  const [zipCodeLookupError, setZipCodeLookupError] = useState<string | null>(null);
  const {
    fieldErrors: apiFieldErrors,
    globalError: submitError,
    clearErrors,
    handleSubmitError,
  } = useFormApiErrors<keyof FormData>({
    fieldMap: {
      name: "nome",
      acronym: "sigla",
      cnpj: "cnpj",
      email: "email",
      phone: "telefone",
      site: "site",
      address: "endereco",
      city: "municipio",
      state: "uf",
    },
  });
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Foca no primeiro input ao abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Fecha ao pressionar ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  // Reset form ao fechar
  useEffect(() => {
    if (!isOpen) {
      setForm(INITIAL_FORM);
      setErrors({});
      clearErrors();
      setIsSubmitting(false);
      setIsZipCodeLoading(false);
      setZipCodeLookupError(null);
    }
  }, [isOpen]);

  // Handler de mudança de campo
  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Limpa erro do campo ao editar
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleZipCodeChange = async (rawValue: string) => {
    const formattedZipCode = formatZipCode(rawValue);
    const normalizedZipCode = onlyDigits(formattedZipCode);

    setForm((prev) => ({ ...prev, cep: formattedZipCode }));

    if (normalizedZipCode.length !== 8) {
      setZipCodeLookupError(null);
      setIsZipCodeLoading(false);
      return;
    }

    setIsZipCodeLoading(true);
    setZipCodeLookupError(null);

    try {
      const viaCepData = await fetchViaCep(normalizedZipCode);
      setForm((prev) => {
        if (onlyDigits(prev.cep) !== normalizedZipCode) {
          return prev;
        }

        return {
          ...prev,
          cep: formatZipCode(normalizedZipCode),
          uf: viaCepData.uf?.trim().toUpperCase() || prev.uf,
          municipio: viaCepData.localidade?.trim() || prev.municipio,
          endereco: viaCepData.logradouro?.trim() || prev.endereco,
        };
      });
    } catch (lookupFailure) {
      setZipCodeLookupError(
        lookupFailure instanceof Error ? lookupFailure.message : "Não foi possível consultar o CEP."
      );
    } finally {
      setIsZipCodeLoading(false);
    }
  };

  // Validação
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!form.nome.trim()) {
      newErrors.nome = "Nome é obrigatório";
    }
    if (!form.tipo) {
      newErrors.tipo = "Selecione o tipo";
    }
    if (!form.uf) {
      newErrors.uf = "Selecione o UF";
    }
    if (!form.municipio.trim()) {
      newErrors.municipio = "Município é obrigatório";
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "E-mail inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
      clearErrors();

    try {
      await onSubmit({
        nome: form.nome.trim(),
        sigla: form.sigla.trim() || undefined,
        tipo: form.tipo as ParceiroTipo,
        cnpj: form.cnpj.trim() || undefined,
        email: form.email.trim() || undefined,
        telefone: form.telefone.trim() || undefined,
        site: form.site.trim() || undefined,
        cep: onlyDigits(form.cep) || undefined,
        uf: form.uf,
        municipio: form.municipio.trim(),
        endereco: form.endereco.trim() || undefined,
        status: form.status,
        observacoes: form.observacoes.trim() || undefined,
      });

      onClose();
    } catch (submitFailure) {
      const fallback = getUserErrorMessage(submitFailure, "Não foi possível cadastrar o parceiro.");
      handleSubmitError(submitFailure, fallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => !isSubmitting && onClose()}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          ref={modalRef}
          className="pointer-events-auto w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#004225]/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#004225]/10 rounded-lg">
                <Users className="h-5 w-5 text-[#004225]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Novo Parceiro
                </h2>
                <p className="text-sm text-gray-500">
                  Cadastre um novo IFES ou Fundação
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
                disabled={isSubmitting}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="p-6 space-y-5">
              {/* Tipo (destaque) */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Users className="h-4 w-4 text-gray-400" />
                  Tipo de Parceiro <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleChange("tipo", "IFES")}
                    className={cn(
                      "flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all",
                      form.tipo === "IFES"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50"
                    )}
                  >
                    <GraduationCap className="h-5 w-5" />
                    <span className="font-medium">Instituto Federal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange("tipo", "FUNDACAO")}
                    className={cn(
                      "flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all",
                      form.tipo === "FUNDACAO"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                    )}
                  >
                    <Building className="h-5 w-5" />
                    <span className="font-medium">Fundação</span>
                  </button>
                </div>
                {errors.tipo && (
                  <p className="text-xs text-red-600">{errors.tipo}</p>
                )}
              </div>

              {/* Nome e Sigla */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FileText className="h-4 w-4 text-gray-400" />
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={firstInputRef}
                    type="text"
                    value={form.nome}
                    onChange={(e) => handleChange("nome", e.target.value)}
                    placeholder="Ex.: Instituto Federal do Maranhão"
                    className={cn(
                      "w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors",
                      errors.nome ? "border-red-300" : "border-gray-200"
                    )}
                  />
                  {(errors.nome || apiFieldErrors.nome) && (
                    <p className="text-xs text-red-600">{errors.nome || apiFieldErrors.nome}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Sigla
                  </label>
                  <input
                    type="text"
                    value={form.sigla}
                    onChange={(e) => handleChange("sigla", e.target.value.toUpperCase())}
                    placeholder="Ex.: IFMA"
                    maxLength={10}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors"
                  />
                </div>
              </div>

              {/* CNPJ */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={form.cnpj}
                  onChange={(e) => handleChange("cnpj", formatCnpj(e.target.value))}
                  placeholder="00.000.000/0001-00"
                  maxLength={18}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors"
                />
              </div>

              {/* Localização */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={form.cep}
                    onChange={(e) => {
                      void handleZipCodeChange(e.target.value);
                    }}
                    placeholder="00000-000"
                    maxLength={9}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors"
                  />
                  {isZipCodeLoading ? (
                    <p className="text-xs text-gray-500">Consultando CEP...</p>
                  ) : null}
                  {zipCodeLookupError ? (
                    <p className="text-xs text-red-600">{zipCodeLookupError}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    UF <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.uf}
                    onChange={(e) => handleChange("uf", e.target.value.toUpperCase())}
                    className={cn(
                      "w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors bg-white",
                      errors.uf ? "border-red-300" : "border-gray-200"
                    )}
                  >
                    <option value="">Selecione</option>
                    {UF_LIST.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                  {(errors.uf || apiFieldErrors.uf) && (
                    <p className="text-xs text-red-600">{errors.uf || apiFieldErrors.uf}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Município <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.municipio}
                    onChange={(e) => handleChange("municipio", e.target.value)}
                    placeholder="Ex.: São Luís"
                    className={cn(
                      "w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors",
                      errors.municipio ? "border-red-300" : "border-gray-200"
                    )}
                  />
                  {(errors.municipio || apiFieldErrors.municipio) && (
                    <p className="text-xs text-red-600">{errors.municipio || apiFieldErrors.municipio}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Endereço Completo <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.endereco}
                    onChange={(e) => handleChange("endereco", e.target.value)}
                    placeholder="Ex.: Av. Getúlio Vargas, 04 - Monte Castelo"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors"
                  />
                </div>
              </div>

              {/* Contatos */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Mail className="h-4 w-4 text-gray-400" />
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="contato@parceiro.edu.br"
                    className={cn(
                      "w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors",
                      errors.email ? "border-red-300" : "border-gray-200"
                    )}
                  />
                  {(errors.email || apiFieldErrors.email) && (
                    <p className="text-xs text-red-600">{errors.email || apiFieldErrors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Phone className="h-4 w-4 text-gray-400" />
                    Telefone <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="tel"
                    value={form.telefone}
                    onChange={(e) => handleChange("telefone", formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors"
                  />
                </div>
              </div>

              {/* Site */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Globe className="h-4 w-4 text-gray-400" />
                  Website
                </label>
                <input
                  type="url"
                  value={form.site}
                  onChange={(e) => handleChange("site", e.target.value)}
                  placeholder="https://www.parceiro.edu.br"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors"
                />
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Observações
                </label>
                <textarea
                  value={form.observacoes}
                  onChange={(e) => handleChange("observacoes", e.target.value)}
                  placeholder="Informações adicionais sobre o parceiro..."
                  rows={3}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors resize-none"
                />
              </div>
            </div>

            {submitError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {submitError}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-5 bg-[#004225] hover:bg-[#003319]"
              >
                {isSubmitting ? "Salvando..." : "Cadastrar Parceiro"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
