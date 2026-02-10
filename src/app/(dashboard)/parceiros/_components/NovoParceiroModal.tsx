"use client";

import { useState, useEffect, useRef } from "react";
import { X, Users, Building, GraduationCap, MapPin, Mail, Phone, Globe, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
    parceiro: Omit<Parceiro, "id" | "createdAt" | "contratosAtivos" | "valorTotalContratos">
  ) => Promise<void> | void;
}

type FormData = {
  nome: string;
  sigla: string;
  tipo: ParceiroTipo | "";
  cnpj: string;
  email: string;
  telefone: string;
  site: string;
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
  const [submitError, setSubmitError] = useState<string | null>(null);
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
      setSubmitError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Handler de mudanÃ§a de campo
  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Limpa erro do campo ao editar
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // ValidaÃ§Ã£o
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!form.nome.trim()) {
      newErrors.nome = "Nome Ã© obrigatÃ³rio";
    }
    if (!form.tipo) {
      newErrors.tipo = "Selecione o tipo";
    }
    if (!form.uf) {
      newErrors.uf = "Selecione o UF";
    }
    if (!form.municipio.trim()) {
      newErrors.municipio = "MunicÃ­pio Ã© obrigatÃ³rio";
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "E-mail invÃ¡lido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit({
        nome: form.nome.trim(),
        sigla: form.sigla.trim() || undefined,
        tipo: form.tipo as ParceiroTipo,
        cnpj: form.cnpj.trim() || undefined,
        email: form.email.trim() || undefined,
        telefone: form.telefone.trim() || undefined,
        site: form.site.trim() || undefined,
        uf: form.uf,
        municipio: form.municipio.trim(),
        endereco: form.endereco.trim() || undefined,
        status: form.status,
        observacoes: form.observacoes.trim() || undefined,
      });

      onClose();
    } catch (submitFailure) {
      setSubmitError(
        submitFailure instanceof Error
          ? submitFailure.message
          : "Nao foi possivel cadastrar o parceiro."
      );
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
                  Cadastre um novo IFES ou FundaÃ§Ã£o
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
                    <span className="font-medium">FundaÃ§Ã£o</span>
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
                    placeholder="Ex.: Instituto Federal do MaranhÃ£o"
                    className={cn(
                      "w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors",
                      errors.nome ? "border-red-300" : "border-gray-200"
                    )}
                  />
                  {errors.nome && (
                    <p className="text-xs text-red-600">{errors.nome}</p>
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
                  onChange={(e) => handleChange("cnpj", e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors"
                />
              </div>

              {/* LocalizaÃ§Ã£o */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    UF <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.uf}
                    onChange={(e) => handleChange("uf", e.target.value)}
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
                  {errors.uf && (
                    <p className="text-xs text-red-600">{errors.uf}</p>
                  )}
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    MunicÃ­pio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.municipio}
                    onChange={(e) => handleChange("municipio", e.target.value)}
                    placeholder="Ex.: SÃ£o LuÃ­s"
                    className={cn(
                      "w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors",
                      errors.municipio ? "border-red-300" : "border-gray-200"
                    )}
                  />
                  {errors.municipio && (
                    <p className="text-xs text-red-600">{errors.municipio}</p>
                  )}
                </div>
              </div>

              {/* EndereÃ§o */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  EndereÃ§o Completo
                </label>
                <input
                  type="text"
                  value={form.endereco}
                  onChange={(e) => handleChange("endereco", e.target.value)}
                  placeholder="Ex.: Av. GetÃºlio Vargas, 04 - Monte Castelo"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors"
                />
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
                  {errors.email && (
                    <p className="text-xs text-red-600">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Phone className="h-4 w-4 text-gray-400" />
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={form.telefone}
                    onChange={(e) => handleChange("telefone", e.target.value)}
                    placeholder="(00) 0000-0000"
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

              {/* ObservaÃ§Ãµes */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  ObservaÃ§Ãµes
                </label>
                <textarea
                  value={form.observacoes}
                  onChange={(e) => handleChange("observacoes", e.target.value)}
                  placeholder="InformaÃ§Ãµes adicionais sobre o parceiro..."
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



