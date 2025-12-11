"use client";

import { useState, useEffect, useRef } from "react";
import { X, FileText, Calendar, MapPin, User, Building2, Tag, AlertCircle } from "lucide-react";

// Tipos
type ContratoStatus = "DRAFT" | "A_INICIAR" | "EM_ANDAMENTO" | "SUSPENSO" | "PENDENCIA" | "CONCLUIDO";
type ContratoTipo = "PROJETO" | "PRODUTO";

type NovoContratoForm = {
  titulo: string;
  govIf: "IF" | "Gov" | "";
  status: ContratoStatus | "";
  coordenador: string;
  parceiro: string;
  orgaoFinanciador: string;
  segmentos: string[];
  tipo: ContratoTipo | "";
  dataInicio: string;
  dataFim: string;
  localidade: string;
};

type FormErrors = Partial<Record<keyof NovoContratoForm, string>>;

interface NovoContratoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: NovoContratoForm) => Promise<void> | void;
}

// Lista de parceiros (mock - pode ser substituída por dados da API)
const parceirosDisponiveis = [
  "Fapto",
  "Fadex",
  "IFMA",
  "Fundação de Apoio à Pesquisa",
  "Fundação Araucária",
  "Fundação UFRGS",
  "Fundação XYZ",
  "IFES-MG",
];

const statusOptions: { value: ContratoStatus; label: string }[] = [
  { value: "DRAFT", label: "Rascunho" },
  { value: "A_INICIAR", label: "A iniciar" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "SUSPENSO", label: "Suspenso" },
  { value: "PENDENCIA", label: "Pendência" },
  { value: "CONCLUIDO", label: "Concluído" },
];

const tipoOptions: { value: ContratoTipo; label: string }[] = [
  { value: "PROJETO", label: "Projeto" },
  { value: "PRODUTO", label: "Produto" },
];

const segmentoOptions = [
  "Educação",
  "Saúde",
  "Cidades",
  "Meio Ambiente",
  "Tecnologia",
  "Turismo",
  "Social",
  "Economia",
  "Cultura",
  "Ciência",
  "Esporte",
  "Agricultura",
  "Outro",
];

const initialFormState: NovoContratoForm = {
  titulo: "",
  govIf: "",
  status: "",
  coordenador: "",
  parceiro: "",
  orgaoFinanciador: "",
  segmentos: [],
  tipo: "",
  dataInicio: "",
  dataFim: "",
  localidade: "",
};

export function NovoContratoModal({ isOpen, onClose, onSubmit }: NovoContratoModalProps) {
  const [form, setForm] = useState<NovoContratoForm>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Set<keyof NovoContratoForm>>(new Set());
  
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm(initialFormState);
      setErrors({});
      setTouched(new Set());
      setIsSubmitting(false);
      // Focus first input after modal opens
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Validation
  const validateField = (name: keyof NovoContratoForm, value: string | string[]): string => {
    switch (name) {
      case "titulo":
        if (typeof value !== "string" || !value.trim()) return "O título do projeto é obrigatório";
        if (value.trim().length < 5) return "O título deve ter pelo menos 5 caracteres";
        return "";
      case "govIf":
        if (typeof value !== "string" || !value || (value !== "IF" && value !== "Gov")) return "Selecione uma opção";
        return "";
      case "coordenador":
        if (typeof value !== "string" || !value.trim()) return "O nome do coordenador é obrigatório";
        return "";
      case "parceiro":
        if (typeof value !== "string" || !value.trim()) return "Selecione um parceiro";
        return "";
      case "orgaoFinanciador":
        if (typeof value !== "string" || !value.trim()) return "Informe o órgão financiador";
        return "";
      case "segmentos":
        if (!Array.isArray(value) || value.length === 0) return "Selecione ao menos um segmento";
        return "";
      case "dataInicio":
        if (typeof value !== "string" || !value) return "A data de início é obrigatória";
        return "";
      case "dataFim":
        if (typeof value === "string" && value && form.dataInicio && new Date(value) < new Date(form.dataInicio)) {
          return "A data de fim deve ser posterior à data de início";
        }
        return "";
      case "localidade":
        if (typeof value !== "string" || !value.trim()) return "A localidade é obrigatória";
        return "";
      default:
        return "";
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    (Object.keys(form) as Array<keyof NovoContratoForm>).forEach((key) => {
      const error = validateField(key, form[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (name: keyof NovoContratoForm, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (touched.has(name)) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleSegmentToggle = (segmento: string) => {
    setForm((prev) => {
      const exists = prev.segmentos.includes(segmento);
      const updated = exists
        ? prev.segmentos.filter((s) => s !== segmento)
        : [...prev.segmentos, segmento];

      setTouched((prevTouched) => new Set(prevTouched).add("segmentos"));
      setErrors((prevErrors) => ({
        ...prevErrors,
        segmentos: validateField("segmentos", updated),
      }));

      return { ...prev, segmentos: updated };
    });
  };

  const handleBlur = (name: keyof NovoContratoForm) => {
    setTouched((prev) => new Set(prev).add(name));
    const error = validateField(name, form[name]);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched(new Set(Object.keys(form) as Array<keyof NovoContratoForm>));
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(form);
      }
      // Simular delay de envio se não houver onSubmit
      await new Promise((resolve) => setTimeout(resolve, 500));
      onClose();
    } catch (error) {
      console.error("Erro ao criar contrato:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
              <FileText className="h-5 w-5 text-[#004225]" />
            </div>
            <div>
              <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
                Novo Contrato
              </h2>
              <p className="text-sm text-gray-500">Preencha as informações do contrato</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-5">
            {/* Título do Projeto */}
            <FormField
              label="Título do Projeto"
              required
              error={errors.titulo}
              icon={<FileText className="h-4 w-4" />}
            >
              <input
                ref={firstInputRef}
                type="text"
                value={form.titulo}
                onChange={(e) => handleChange("titulo", e.target.value)}
                onBlur={() => handleBlur("titulo")}
                placeholder="Ex.: Plataforma de Gestão de Projetos da Innovatis"
                className={`w-full h-11 px-4 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#004225]/20 ${
                  errors.titulo
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-300 focus:border-[#004225]"
                }`}
              />
            </FormField>

            {/* Gov/IF, Tipo e Status - Grid 3 colunas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Gov/IF */}
              <FormField
                label="Gov/IF"
                required
                error={errors.govIf}
                icon={<Tag className="h-4 w-4" />}
              >
                <select
                  value={form.govIf}
                  onChange={(e) => handleChange("govIf", e.target.value)}
                  onBlur={() => handleBlur("govIf")}
                  className={`w-full h-11 px-4 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#004225]/20 transition-colors appearance-none cursor-pointer ${
                    errors.govIf
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
                  <option value="">Selecione...</option>
                  <option value="IF">IF</option>
                  <option value="Gov">Gov</option>
                </select>
              </FormField>

              {/* Tipo de Contrato */}
              <FormField
                label="Tipo de Contrato"
                required
                error={errors.tipo}
                icon={<Tag className="h-4 w-4" />}
              >
                <select
                  value={form.tipo}
                  onChange={(e) => handleChange("tipo", e.target.value)}
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
                  <option value="">Selecione...</option>
                  {tipoOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </FormField>

              {/* Status */}
              <FormField
                label="Status"
                required
                error={errors.status}
                icon={<Tag className="h-4 w-4" />}
              >
                <select
                  value={form.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                  onBlur={() => handleBlur("status")}
                  className={`w-full h-11 px-4 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#004225]/20 transition-colors appearance-none cursor-pointer ${
                    errors.status
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
                  <option value="">Selecione...</option>
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            {/* Coordenador */}
            <FormField
              label="Nome do Coordenador"
              required
              error={errors.coordenador}
              icon={<User className="h-4 w-4" />}
            >
              <input
                type="text"
                value={form.coordenador}
                onChange={(e) => handleChange("coordenador", e.target.value)}
                onBlur={() => handleBlur("coordenador")}
                placeholder="Ex.: João Silva"
                className={`w-full h-11 px-4 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#004225]/20 ${
                  errors.coordenador
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-300 focus:border-[#004225]"
                }`}
              />
            </FormField>

            {/* Parceiro */}
            <FormField
              label="Parceiro"
              required
              error={errors.parceiro}
              icon={<Building2 className="h-4 w-4" />}
            >
              <select
                value={form.parceiro}
                onChange={(e) => handleChange("parceiro", e.target.value)}
                onBlur={() => handleBlur("parceiro")}
                className={`w-full h-11 px-4 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#004225]/20 transition-colors appearance-none cursor-pointer ${
                  errors.parceiro
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
                <option value="">Selecione um parceiro...</option>
                {parceirosDisponiveis.map((parceiro) => (
                  <option key={parceiro} value={parceiro}>
                    {parceiro}
                  </option>
                ))}
              </select>
            </FormField>

            {/* Órgão Financiador */}
            <FormField
              label="Órgão Financiador"
              required
              error={errors.orgaoFinanciador}
              icon={<Building2 className="h-4 w-4" />}
            >
              <input
                type="text"
                value={form.orgaoFinanciador}
                onChange={(e) => handleChange("orgaoFinanciador", e.target.value)}
                onBlur={() => handleBlur("orgaoFinanciador")}
                placeholder="Ex.: Ministério da Ciência ou Prefeitura de São Paulo"
                className={`w-full h-11 px-4 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#004225]/20 ${
                  errors.orgaoFinanciador
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-300 focus:border-[#004225]"
                }`}
              />
            </FormField>

            {/* Segmento do Contrato */}
            <FormField
              label="Segmento do Contrato"
              required
              error={errors.segmentos}
              icon={<Tag className="h-4 w-4" />}
            >
              <div className="flex flex-wrap gap-1">
                {segmentoOptions.map((segmento) => {
                  const active = form.segmentos.includes(segmento);
                  return (
                    <button
                      key={segmento}
                      type="button"
                      onClick={() => handleSegmentToggle(segmento)}
                      className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                        active
                          ? "bg-[#004225] text-white border-[#004225]"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {segmento}
                    </button>
                  );
                })}
              </div>
            </FormField>

            {/* Datas - Grid 2 colunas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Data de Início */}
              <FormField
                label="Início do Contrato"
                required
                error={errors.dataInicio}
                icon={<Calendar className="h-4 w-4" />}
              >
                <input
                  type="date"
                  value={form.dataInicio}
                  onChange={(e) => handleChange("dataInicio", e.target.value)}
                  onBlur={() => handleBlur("dataInicio")}
                  className={`w-full h-11 px-4 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#004225]/20 ${
                    errors.dataInicio
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-300 focus:border-[#004225]"
                  }`}
                />
              </FormField>

              {/* Data de Fim */}
              <FormField
                label="Fim do Contrato"
                error={errors.dataFim}
                icon={<Calendar className="h-4 w-4" />}
              >
                <input
                  type="date"
                  value={form.dataFim}
                  onChange={(e) => handleChange("dataFim", e.target.value)}
                  onBlur={() => handleBlur("dataFim")}
                  min={form.dataInicio || undefined}
                  className={`w-full h-11 px-4 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#004225]/20 ${
                    errors.dataFim
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-300 focus:border-[#004225]"
                  }`}
                />
              </FormField>
            </div>

            {/* Localidade */}
            <FormField
              label="Localidade"
              required
              error={errors.localidade}
              icon={<MapPin className="h-4 w-4" />}
            >
              <input
                type="text"
                value={form.localidade}
                onChange={(e) => handleChange("localidade", e.target.value)}
                onBlur={() => handleBlur("localidade")}
                placeholder="Ex.: Campina Grande - PB"
                className={`w-full h-11 px-4 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#004225]/20 ${
                  errors.localidade
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-300 focus:border-[#004225]"
                }`}
              />
            </FormField>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] focus:outline-none focus:ring-2 focus:ring-[#004225]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                "Criar Contrato"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Componente auxiliar para campos do formulário
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
        <p className="flex items-center gap-1 text-xs text-red-600 mt-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

export default NovoContratoModal;
