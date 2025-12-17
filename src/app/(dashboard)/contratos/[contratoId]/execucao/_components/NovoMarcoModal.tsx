"use client";

import { useState, useEffect, useRef } from "react";
import { X, FileText, Calendar, User, Tag, AlertCircle, Target, Percent } from "lucide-react";

// Tipos
export type MarcoStatus = "PLANEJADO" | "EM_ANDAMENTO" | "CONCLUIDO" | "ATRASADO" | "CANCELADO";

export type NovoMarcoForm = {
  nome: string;
  descricao: string;
  responsavel: string;
  dataPlanejada: string;
  status: MarcoStatus | "";
  percentual: number;
  fase: string;
  observacoes: string;
};

type FormErrors = Partial<Record<keyof NovoMarcoForm, string>>;

interface NovoMarcoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: NovoMarcoForm) => Promise<void> | void;
}

const statusOptions: { value: MarcoStatus; label: string }[] = [
  { value: "PLANEJADO", label: "Planejado" },
  { value: "EM_ANDAMENTO", label: "Em Andamento" },
  { value: "CONCLUIDO", label: "Concluído" },
  { value: "ATRASADO", label: "Atrasado" },
  { value: "CANCELADO", label: "Cancelado" },
];

const initialFormState: NovoMarcoForm = {
  nome: "",
  descricao: "",
  responsavel: "",
  dataPlanejada: "",
  status: "PLANEJADO",
  percentual: 0,
  fase: "",
  observacoes: "",
};

export function NovoMarcoModal({ isOpen, onClose, onSubmit }: NovoMarcoModalProps) {
  const [form, setForm] = useState<NovoMarcoForm>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Set<keyof NovoMarcoForm>>(new Set());
  
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm(initialFormState);
      setErrors({});
      setTouched(new Set());
      // Focus first input after animation
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const validateField = (name: keyof NovoMarcoForm, value: any): string => {
    switch (name) {
      case "nome":
        if (typeof value !== "string" || !value.trim()) return "O nome do marco é obrigatório";
        return "";
      case "descricao":
        if (typeof value !== "string" || !value.trim()) return "A descrição é obrigatória";
        return "";
      case "responsavel":
        if (typeof value !== "string" || !value.trim()) return "O responsável é obrigatório";
        return "";
      case "dataPlanejada":
        if (typeof value !== "string" || !value) return "A data planejada é obrigatória";
        return "";
      case "status":
        if (!value) return "O status é obrigatório";
        return "";
      case "percentual":
        if (typeof value !== "number" || value < 0 || value > 100) return "O percentual deve ser entre 0 e 100";
        return "";
      case "fase":
        if (typeof value !== "string" || !value.trim()) return "A fase é obrigatória";
        return "";
      default:
        return "";
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    (Object.keys(form) as Array<keyof NovoMarcoForm>).forEach((key) => {
      const error = validateField(key, form[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (name: keyof NovoMarcoForm, value: any) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (touched.has(name)) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (name: keyof NovoMarcoForm) => {
    setTouched((prev) => new Set(prev).add(name));
    const error = validateField(name, form[name]);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched(new Set(Object.keys(form) as Array<keyof NovoMarcoForm>));
    
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
      console.error("Erro ao criar marco:", error);
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
              <Target className="h-5 w-5 text-[#004225]" />
            </div>
            <div>
              <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
                Novo Marco
              </h2>
              <p className="text-sm text-gray-500">Adicione um novo marco ao cronograma</p>
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
            {/* Nome do Marco */}
            <FormField
              label="Nome do Marco"
              required
              error={errors.nome}
              icon={<FileText className="h-4 w-4" />}
            >
              <input
                ref={firstInputRef}
                type="text"
                value={form.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                onBlur={() => handleBlur("nome")}
                placeholder="Ex.: Entrega do Relatório Final"
                className={`w-full h-11 px-4 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#004225]/20 ${
                  errors.nome
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-300 focus:border-[#004225]"
                }`}
              />
            </FormField>

            {/* Descrição */}
            <FormField
              label="Descrição"
              required
              error={errors.descricao}
              icon={<FileText className="h-4 w-4" />}
            >
              <textarea
                value={form.descricao}
                onChange={(e) => handleChange("descricao", e.target.value)}
                onBlur={() => handleBlur("descricao")}
                placeholder="Descreva os detalhes deste marco..."
                rows={3}
                className={`w-full p-4 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#004225]/20 resize-none ${
                  errors.descricao
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-300 focus:border-[#004225]"
                }`}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Responsável */}
              <FormField
                label="Responsável"
                required
                error={errors.responsavel}
                icon={<User className="h-4 w-4" />}
              >
                <input
                  type="text"
                  value={form.responsavel}
                  onChange={(e) => handleChange("responsavel", e.target.value)}
                  onBlur={() => handleBlur("responsavel")}
                  placeholder="Ex.: João Silva"
                  className={`w-full h-11 px-4 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#004225]/20 ${
                    errors.responsavel
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-300 focus:border-[#004225]"
                  }`}
                />
              </FormField>

              {/* Fase */}
              <FormField
                label="Fase"
                required
                error={errors.fase}
                icon={<Tag className="h-4 w-4" />}
              >
                <input
                  type="text"
                  value={form.fase}
                  onChange={(e) => handleChange("fase", e.target.value)}
                  onBlur={() => handleBlur("fase")}
                  placeholder="Ex.: Desenvolvimento"
                  className={`w-full h-11 px-4 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#004225]/20 ${
                    errors.fase
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-300 focus:border-[#004225]"
                  }`}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Data Planejada */}
              <FormField
                label="Data Planejada"
                required
                error={errors.dataPlanejada}
                icon={<Calendar className="h-4 w-4" />}
              >
                <input
                  type="date"
                  value={form.dataPlanejada}
                  onChange={(e) => handleChange("dataPlanejada", e.target.value)}
                  onBlur={() => handleBlur("dataPlanejada")}
                  className={`w-full h-11 px-4 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#004225]/20 ${
                    errors.dataPlanejada
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-300 focus:border-[#004225]"
                  }`}
                />
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

              {/* Percentual */}
              <FormField
                label="Percentual (%)"
                required
                error={errors.percentual}
                icon={<Percent className="h-4 w-4" />}
              >
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.percentual}
                  onChange={(e) => handleChange("percentual", Number(e.target.value))}
                  onBlur={() => handleBlur("percentual")}
                  className={`w-full h-11 px-4 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#004225]/20 ${
                    errors.percentual
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-300 focus:border-[#004225]"
                  }`}
                />
              </FormField>
            </div>

            {/* Observações */}
            <FormField
              label="Observações"
              error={errors.observacoes}
              icon={<FileText className="h-4 w-4" />}
            >
              <textarea
                value={form.observacoes}
                onChange={(e) => handleChange("observacoes", e.target.value)}
                onBlur={() => handleBlur("observacoes")}
                placeholder="Observações adicionais..."
                rows={2}
                className={`w-full p-4 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#004225]/20 resize-none ${
                  errors.observacoes
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
                "Criar Marco"
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
