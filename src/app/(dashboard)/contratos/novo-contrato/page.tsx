"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Calendar,
  MapPin,
  User,
  Building2,
  Tag,
  AlertCircle,
  DollarSign,
  ChevronRight,
  ChevronDown,
  Home,
  ArrowLeft,
  Plus,
  Trash2,
  Target,
  Milestone,
  Flag,
} from "lucide-react";
import { NavBar } from "@/components/ui/NavBar";
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";
import { DatePicker } from "@/components/ui/DatePicker";
import { getOrganizationsFinanciadoras, getOrganizationsParceiras } from "../mockData";

// Tipos
type ContratoStatus = "EM_ANDAMENTO" | "CONCLUIDO" | "SUSPENSO" | "PENDENTE" | "CANCELADO";
type ContratoTipo = "PROJETO" | "PRODUTO";

// Tipos para Metas, Etapas e Fases
type Fase = {
  id: string;
  numero: number;
  titulo: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
};

type Etapa = {
  id: string;
  numero: number;
  titulo: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
  fases: Fase[];
};

type Meta = {
  id: string;
  numero: number;
  titulo: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
  etapas: Etapa[];
};

type NovoContratoForm = {
  titulo: string;
  govIf: "IF" | "Gov" | "";
  status: ContratoStatus | "";
  coordenador: string;
  parceiroId: string;
  parceiroSecundarioId: string;
  clientePrimarioId: string;
  clienteSecundarioId: string;
  segmentos: string[];
  tipo: ContratoTipo | "";
  dataInicio: string;
  dataFim: string;
  dataInicioEfetivo: string;
  dataFimEfetivo: string;
  localidade: string;
  scope: string;
  contract_value: string;
  metas: Meta[];
};

type FormErrors = Partial<Record<keyof NovoContratoForm, string>>;

const statusOptions: { value: ContratoStatus; label: string }[] = [
  { value: "EM_ANDAMENTO", label: "Em Execução" },
  { value: "CONCLUIDO", label: "Concluído" },
  { value: "SUSPENSO", label: "Suspenso" },
  { value: "PENDENTE", label: "Pendente" },
  { value: "CANCELADO", label: "Cancelado" },
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
  parceiroId: "",
  parceiroSecundarioId: "",
  clientePrimarioId: "",
  clienteSecundarioId: "",
  segmentos: [],
  tipo: "",
  dataInicio: "",
  dataFim: "",
  dataInicioEfetivo: "",
  dataFimEfetivo: "",
  localidade: "",
  scope: "",
  contract_value: "",
  metas: [],
};

export default function NovoContratoPage() {
  const router = useRouter();
  const [form, setForm] = useState<NovoContratoForm>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Set<keyof NovoContratoForm>>(new Set());
  const [showMetasSection, setShowMetasSection] = useState(false);
  const [expandedMetas, setExpandedMetas] = useState<Set<string>>(new Set());
  const [expandedEtapas, setExpandedEtapas] = useState<Set<string>>(new Set());
  
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Carregar organizações disponíveis
  const organizacoesFinanciadoras = useMemo(() => getOrganizationsFinanciadoras(), []);
  const organizacoesParceiras = useMemo(() => getOrganizationsParceiras(), []);

  // Converter opções para formato DropdownOption
  const govIfOptions: DropdownOption[] = useMemo(() => [
    { value: "IF", label: "IF" },
    { value: "Gov", label: "Gov" },
  ], []);

  const tipoDropdownOptions: DropdownOption[] = useMemo(() => 
    tipoOptions.map(opt => ({ value: opt.value, label: opt.label })),
    []
  );

  const statusDropdownOptions: DropdownOption[] = useMemo(() => 
    statusOptions.map(opt => ({ value: opt.value, label: opt.label })),
    []
  );

  const parceiroDropdownOptions: DropdownOption[] = useMemo(() => 
    organizacoesParceiras.map(org => ({
      value: org.id,
      label: `${org.name}${org.cnpj ? ` (${org.cnpj})` : ""}`,
      icon: <Building2 className="h-4 w-4" />,
    })),
    [organizacoesParceiras]
  );

  const clientePrimarioDropdownOptions: DropdownOption[] = useMemo(() => 
    organizacoesFinanciadoras.map(org => ({
      value: org.id,
      label: `${org.name}${org.cnpj ? ` (${org.cnpj})` : ""}`,
      icon: <Building2 className="h-4 w-4" />,
    })),
    [organizacoesFinanciadoras]
  );

  const clienteSecundarioDropdownOptions: DropdownOption[] = useMemo(() => 
    organizacoesFinanciadoras.map(org => ({
      value: org.id,
      label: `${org.name}${org.cnpj ? ` (${org.cnpj})` : ""}`,
      icon: <Building2 className="h-4 w-4" />,
    })),
    [organizacoesFinanciadoras]
  );

  // Focus first input on mount
  useEffect(() => {
    setTimeout(() => firstInputRef.current?.focus(), 100);
  }, []);

  // Validation
  const validateField = (name: keyof NovoContratoForm, value: string | string[] | Meta[]): string => {
    switch (name) {
      case "titulo":
        if (typeof value !== "string" || !value.trim()) return "O título do projeto é obrigatório";
        if (value.trim().length < 5) return "O título deve ter pelo menos 5 caracteres";
        return "";
      case "govIf":
        if (typeof value !== "string" || !value || (value !== "IF" && value !== "Gov")) return "Selecione uma opção";
        return "";
      case "tipo":
        if (typeof value !== "string" || !value) return "Selecione um tipo de contrato";
        return "";
      case "status":
        if (typeof value !== "string" || !value) return "Selecione um status";
        return "";
      case "coordenador":
        if (typeof value !== "string" || !value.trim()) return "O nome do coordenador é obrigatório";
        return "";
      case "parceiroId":
        if (typeof value !== "string" || !value.trim()) return "Selecione um parceiro";
        return "";
      case "parceiroSecundarioId":
        // Opcional, sem validação obrigatória
        return "";
      case "clientePrimarioId":
        if (typeof value !== "string" || !value.trim()) return "Selecione um cliente primário";
        return "";
      case "clienteSecundarioId":
        // Opcional, sem validação obrigatória
        return "";
      case "segmentos":
        if (!Array.isArray(value) || value.length === 0) return "Selecione ao menos um segmento";
        return "";
      case "dataInicio":
        if (typeof value !== "string" || !value) return "A data de início é obrigatória";
        return "";
      case "dataFim":
        if (typeof value !== "string" || !value) return "A data de fim é obrigatória";
        if (form.dataInicio && new Date(value) < new Date(form.dataInicio)) {
          return "A data de fim deve ser posterior à data de início";
        }
        return "";
      case "dataInicioEfetivo":
        // Opcional, mas se preenchido deve ser válido
        if (typeof value === "string" && value && form.dataInicio && new Date(value) < new Date(form.dataInicio)) {
          return "A data de início efetivo deve ser posterior ou igual à data de início do contrato";
        }
        return "";
      case "dataFimEfetivo":
        // Opcional, mas se preenchido deve ser posterior ao início efetivo
        if (typeof value === "string" && value && form.dataInicioEfetivo && new Date(value) < new Date(form.dataInicioEfetivo)) {
          return "A data de fim efetivo deve ser posterior à data de início efetivo";
        }
        return "";
      case "localidade":
        if (typeof value !== "string" || !value.trim()) return "A localidade é obrigatória";
        return "";
      case "scope":
        if (typeof value !== "string" || !value.trim()) return "O objeto do contrato é obrigatório";
        if (value.trim().length < 10) return "O objeto do contrato deve ter pelo menos 10 caracteres";
        return "";
      case "contract_value":
        if (typeof value !== "string" || !value.trim()) return "O valor do projeto é obrigatório";
        const numericValue = value.replace(/\D/g, "");
        if (!numericValue || parseInt(numericValue, 10) <= 0) return "Informe um valor válido maior que zero";
        return "";
      case "metas":
        // Metas são opcionais, não precisam de validação obrigatória
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

  // Função para formatar valor monetário
  const formatCurrency = (value: string): string => {
    const onlyNumbers = value.replace(/\D/g, "");
    if (!onlyNumbers) return "";

    const numberValue = parseInt(onlyNumbers, 10) / 100;
    
    return numberValue.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Função para converter valor formatado para número (em centavos)
  const parseCurrencyToCents = (formattedValue: string): number => {
    const onlyNumbers = formattedValue.replace(/\D/g, "");
    return parseInt(onlyNumbers, 10) || 0;
  };

  const handleChange = (name: keyof NovoContratoForm, value: string | undefined) => {
    // Converter undefined para string vazia para campos que esperam string
    const stringValue = value ?? "";
    
    if (name === "contract_value") {
      const formatted = formatCurrency(stringValue);
      setForm((prev) => ({ ...prev, [name]: formatted }));
      
      // Sempre validar e atualizar erros após mudança
      const error = validateField(name, formatted);
      setErrors((prev) => ({ ...prev, [name]: error || undefined }));
      
      // Marcar como touched
      setTouched((prev) => new Set(prev).add(name));
    } else {
      setForm((prev) => ({ ...prev, [name]: stringValue }));
      
      // Sempre validar e atualizar erros após mudança
      const error = validateField(name, stringValue);
      setErrors((prev) => ({ ...prev, [name]: error || undefined }));
      
      // Marcar como touched
      setTouched((prev) => new Set(prev).add(name));
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

  // ============================================================================
  // Funções para gerenciar Metas, Etapas e Fases
  // ============================================================================
  
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Toggle expandir/colapsar
  const toggleMeta = (id: string) => {
    setExpandedMetas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleEtapa = (id: string) => {
    setExpandedEtapas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Adicionar Meta
  const addMeta = () => {
    const novoNumero = form.metas.length + 1;
    const novaMeta: Meta = {
      id: generateId(),
      numero: novoNumero,
      titulo: "",
      etapas: [],
    };
    setForm((prev) => ({ ...prev, metas: [...prev.metas, novaMeta] }));
    setExpandedMetas((prev) => new Set(prev).add(novaMeta.id));
  };

  // Remover Meta
  const removeMeta = (metaId: string) => {
    setForm((prev) => ({
      ...prev,
      metas: prev.metas
        .filter((m) => m.id !== metaId)
        .map((m, idx) => ({ ...m, numero: idx + 1 })),
    }));
  };

  // Atualizar Meta
  const updateMeta = (metaId: string, field: keyof Meta, value: string) => {
    setForm((prev) => ({
      ...prev,
      metas: prev.metas.map((m) =>
        m.id === metaId ? { ...m, [field]: value } : m
      ),
    }));
  };

  // Adicionar Etapa
  const addEtapa = (metaId: string) => {
    setForm((prev) => ({
      ...prev,
      metas: prev.metas.map((meta) => {
        if (meta.id !== metaId) return meta;
        const novoNumero = meta.etapas.length + 1;
        const novaEtapa: Etapa = {
          id: generateId(),
          numero: novoNumero,
          titulo: "",
          fases: [],
        };
        setExpandedEtapas((prevExpanded) => new Set(prevExpanded).add(novaEtapa.id));
        return { ...meta, etapas: [...meta.etapas, novaEtapa] };
      }),
    }));
  };

  // Remover Etapa
  const removeEtapa = (metaId: string, etapaId: string) => {
    setForm((prev) => ({
      ...prev,
      metas: prev.metas.map((meta) => {
        if (meta.id !== metaId) return meta;
        return {
          ...meta,
          etapas: meta.etapas
            .filter((e) => e.id !== etapaId)
            .map((e, idx) => ({ ...e, numero: idx + 1 })),
        };
      }),
    }));
  };

  // Atualizar Etapa
  const updateEtapa = (metaId: string, etapaId: string, field: keyof Etapa, value: string) => {
    setForm((prev) => ({
      ...prev,
      metas: prev.metas.map((meta) => {
        if (meta.id !== metaId) return meta;
        return {
          ...meta,
          etapas: meta.etapas.map((e) =>
            e.id === etapaId ? { ...e, [field]: value } : e
          ),
        };
      }),
    }));
  };

  // Adicionar Fase
  const addFase = (metaId: string, etapaId: string) => {
    setForm((prev) => ({
      ...prev,
      metas: prev.metas.map((meta) => {
        if (meta.id !== metaId) return meta;
        return {
          ...meta,
          etapas: meta.etapas.map((etapa) => {
            if (etapa.id !== etapaId) return etapa;
            const novoNumero = etapa.fases.length + 1;
            const novaFase: Fase = {
              id: generateId(),
              numero: novoNumero,
              titulo: "",
            };
            return { ...etapa, fases: [...etapa.fases, novaFase] };
          }),
        };
      }),
    }));
  };

  // Remover Fase
  const removeFase = (metaId: string, etapaId: string, faseId: string) => {
    setForm((prev) => ({
      ...prev,
      metas: prev.metas.map((meta) => {
        if (meta.id !== metaId) return meta;
        return {
          ...meta,
          etapas: meta.etapas.map((etapa) => {
            if (etapa.id !== etapaId) return etapa;
            return {
              ...etapa,
              fases: etapa.fases
                .filter((f) => f.id !== faseId)
                .map((f, idx) => ({ ...f, numero: idx + 1 })),
            };
          }),
        };
      }),
    }));
  };

  // Atualizar Fase
  const updateFase = (metaId: string, etapaId: string, faseId: string, field: keyof Fase, value: string) => {
    setForm((prev) => ({
      ...prev,
      metas: prev.metas.map((meta) => {
        if (meta.id !== metaId) return meta;
        return {
          ...meta,
          etapas: meta.etapas.map((etapa) => {
            if (etapa.id !== etapaId) return etapa;
            return {
              ...etapa,
              fases: etapa.fases.map((f) =>
                f.id === faseId ? { ...f, [field]: value } : f
              ),
            };
          }),
        };
      }),
    }));
  };

  // Função auxiliar para transformar dados do formulário para formato do backend
  const transformFormToBackend = (formData: NovoContratoForm) => {
    return {
      ...formData,
      segmentos: formData.segmentos.join(", "),
      contract_value: parseFloat(
        formData.contract_value.replace(/\./g, "").replace(",", ".")
      ) || 0,
      parceiroId: parseInt(formData.parceiroId),
      parceiroSecundarioId: formData.parceiroSecundarioId ? parseInt(formData.parceiroSecundarioId) : undefined,
      clientePrimarioId: parseInt(formData.clientePrimarioId),
      clienteSecundarioId: formData.clienteSecundarioId ? parseInt(formData.clienteSecundarioId) : undefined,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setTouched(new Set(Object.keys(form) as Array<keyof NovoContratoForm>));
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const transformedData = transformFormToBackend(form);

      // TODO: Integrar com API real
      console.log("Novo contrato criado:", transformedData);
      
      // Dispara evento para notificar outras páginas sobre o novo contrato
      window.dispatchEvent(new CustomEvent('contrato-criado', { detail: transformedData }));
      
      // Redireciona para a página de contratos
      router.push('/contratos');
      router.refresh();
    } catch (error) {
      console.error("Erro ao criar contrato:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <NavBar />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/home" className="hover:text-gray-700 flex items-center gap-1">
            <Home className="h-4 w-4" />
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/contratos" className="hover:text-gray-700">
            Contratos
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Novo Contrato</span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#004225]/10 rounded-lg">
              <FileText className="h-5 w-5 text-[#004225]" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Novo Contrato</h1>
              <p className="text-sm text-gray-500">Preencha as informações do contrato</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                  <Dropdown
                    options={govIfOptions}
                    value={form.govIf || undefined}
                    placeholder="Selecione..."
                    searchable={true}
                    onChange={(value) => handleChange("govIf", value ?? "")}
                    className={errors.govIf ? "border-red-300 focus:border-red-500" : ""}
                  />
                </FormField>

                {/* Tipo de Contrato */}
                <FormField
                  label="Tipo de Contrato"
                  required
                  error={errors.tipo}
                  icon={<Tag className="h-4 w-4" />}
                >
                  <Dropdown
                    options={tipoDropdownOptions}
                    value={form.tipo || undefined}
                    placeholder="Selecione..."
                    searchable={true}
                    onChange={(value) => handleChange("tipo", value ?? "")}
                    className={errors.tipo ? "border-red-300 focus:border-red-500" : ""}
                  />
                </FormField>

                {/* Status */}
                <FormField
                  label="Status"
                  required
                  error={errors.status}
                  icon={<Tag className="h-4 w-4" />}
                >
                  <Dropdown
                    options={statusDropdownOptions}
                    value={form.status || undefined}
                    placeholder="Selecione..."
                    searchable={true}
                    onChange={(value) => handleChange("status", value ?? "")}
                    className={errors.status ? "border-red-300 focus:border-red-500" : ""}
                  />
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

              {/* Parceiro Primário */}
              <FormField
                label="Parceiro Primário"
                required
                error={errors.parceiroId}
                icon={<Building2 className="h-4 w-4" />}
              >
                <Dropdown
                  options={parceiroDropdownOptions}
                  value={form.parceiroId || undefined}
                  placeholder="Selecione um parceiro primário..."
                  searchable={true}
                  onChange={(value) => handleChange("parceiroId", value ?? "")}
                  className={errors.parceiroId ? "border-red-300 focus:border-red-500" : ""}
                />
              </FormField>

              {/* Parceiro Secundário */}
              <FormField
                label="Parceiro Secundário"
                error={errors.parceiroSecundarioId}
                icon={<Building2 className="h-4 w-4" />}
              >
                <Dropdown
                  options={parceiroDropdownOptions}
                  value={form.parceiroSecundarioId || undefined}
                  placeholder="Selecione um parceiro secundário (opcional)..."
                  searchable={true}
                  onChange={(value) => handleChange("parceiroSecundarioId", value ?? "")}
                  className={errors.parceiroSecundarioId ? "border-red-300 focus:border-red-500" : ""}
                />
              </FormField>

              {/* Cliente Primário */}
              <FormField
                label="Cliente Primário"
                required
                error={errors.clientePrimarioId}
                icon={<Building2 className="h-4 w-4" />}
              >
                <Dropdown
                  options={clientePrimarioDropdownOptions}
                  value={form.clientePrimarioId || undefined}
                  placeholder="Selecione um cliente primário..."
                  searchable={true}
                  onChange={(value) => handleChange("clientePrimarioId", value ?? "")}
                  className={errors.clientePrimarioId ? "border-red-300 focus:border-red-500" : ""}
                />
              </FormField>

              {/* Cliente Secundário */}
              <FormField
                label="Cliente Secundário"
                error={errors.clienteSecundarioId}
                icon={<Building2 className="h-4 w-4" />}
              >
                <Dropdown
                  options={clienteSecundarioDropdownOptions}
                  value={form.clienteSecundarioId || undefined}
                  placeholder="Selecione um cliente secundário (opcional)..."
                  searchable={true}
                  onChange={(value) => handleChange("clienteSecundarioId", value ?? "")}
                  className={errors.clienteSecundarioId ? "border-red-300 focus:border-red-500" : ""}
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
                  <DatePicker
                    value={form.dataInicio}
                    onChange={(value) => handleChange("dataInicio", value)}
                    onBlur={() => handleBlur("dataInicio")}
                    placeholder="Selecione a data de início"
                    error={!!errors.dataInicio}
                  />
                </FormField>

                {/* Data de Fim */}
                <FormField
                  label="Fim do Contrato"
                  required
                  error={errors.dataFim}
                  icon={<Calendar className="h-4 w-4" />}
                >
                  <DatePicker
                    value={form.dataFim}
                    onChange={(value) => handleChange("dataFim", value)}
                    onBlur={() => handleBlur("dataFim")}
                    placeholder="Selecione a data de fim"
                    minDate={form.dataInicio || undefined}
                    error={!!errors.dataFim}
                  />
                </FormField>
              </div>

              {/* Datas Efetivas - Grid 2 colunas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Data de Início Efetivo */}
                <FormField
                  label="Início Efetivo"
                  error={errors.dataInicioEfetivo}
                  icon={<Calendar className="h-4 w-4" />}
                >
                  <DatePicker
                    value={form.dataInicioEfetivo}
                    onChange={(value) => handleChange("dataInicioEfetivo", value)}
                    onBlur={() => handleBlur("dataInicioEfetivo")}
                    placeholder="Selecione a data de início efetivo"
                    minDate={form.dataInicio || undefined}
                    error={!!errors.dataInicioEfetivo}
                  />
                </FormField>

                {/* Data de Fim Efetivo */}
                <FormField
                  label="Fim Efetivo"
                  error={errors.dataFimEfetivo}
                  icon={<Calendar className="h-4 w-4" />}
                >
                  <DatePicker
                    value={form.dataFimEfetivo}
                    onChange={(value) => handleChange("dataFimEfetivo", value)}
                    onBlur={() => handleBlur("dataFimEfetivo")}
                    placeholder="Selecione a data de fim efetivo"
                    minDate={form.dataInicioEfetivo || form.dataInicio || undefined}
                    error={!!errors.dataFimEfetivo}
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

              {/* Objeto do Contrato (Scope) */}
              <FormField
                label="Objeto do Contrato"
                required
                error={errors.scope}
                icon={<FileText className="h-4 w-4" />}
              >
                <textarea
                  value={form.scope}
                  onChange={(e) => handleChange("scope", e.target.value)}
                  onBlur={() => handleBlur("scope")}
                  placeholder="Descreva o objeto/escopo do contrato..."
                  rows={4}
                  className={`w-full px-4 py-3 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#004225]/20 resize-none ${
                    errors.scope
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-300 focus:border-[#004225]"
                  }`}
                />
              </FormField>

              {/* Valor do Projeto */}
              <FormField
                label="Valor do Projeto"
                required
                error={errors.contract_value}
                icon={<DollarSign className="h-4 w-4" />}
              >
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">R$</span>
                  <input
                    type="text"
                    value={form.contract_value}
                    onChange={(e) => handleChange("contract_value", e.target.value)}
                    onBlur={() => handleBlur("contract_value")}
                    placeholder="0,00"
                    className={`w-full h-11 pl-10 pr-4 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#004225]/20 ${
                      errors.contract_value
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-300 focus:border-[#004225]"
                    }`}
                  />
                </div>
              </FormField>

              {/* ================================================================ */}
              {/* Seção de Metas, Etapas e Fases (Opcional) */}
              {/* ================================================================ */}
              <div className="border-t border-gray-200 pt-5 mt-2">
                <button
                  type="button"
                  onClick={() => setShowMetasSection(!showMetasSection)}
                  className="w-full flex items-center justify-between p-4 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Metas, Etapas e Fases
                      </h3>
                      <p className="text-xs text-gray-500">
                        {form.metas.length > 0
                          ? `${form.metas.length} meta${form.metas.length > 1 ? "s" : ""} cadastrada${form.metas.length > 1 ? "s" : ""}`
                          : "Opcional - Defina a estrutura detalhada do contrato"}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-700 transition-transform duration-200 ${
                      showMetasSection ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showMetasSection && (
                  <div className="mt-4 space-y-4">
                    {/* Botão Adicionar Meta */}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={addMeta}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar Meta
                      </button>
                    </div>

                    {/* Lista de Metas */}
                    {form.metas.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-500 mb-2">
                          Nenhuma meta cadastrada
                        </p>
                        <button
                          type="button"
                          onClick={addMeta}
                          className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                        >
                          + Adicionar primeira meta
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {form.metas.map((meta) => (
                          <div
                            key={meta.id}
                            className="border border-gray-200 rounded-lg overflow-hidden"
                          >
                            {/* Header da Meta */}
                            <div className="flex items-center gap-3 px-4 py-3 bg-gray-400/50 border-b border-gray-200">
                              <button
                                type="button"
                                onClick={() => toggleMeta(meta.id)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                              >
                                {expandedMetas.has(meta.id) ? (
                                  <ChevronDown className="h-4 w-4 text-gray-700" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-700" />
                                )}
                              </button>
                              <span className="text-sm font-bold text-gray-800">
                                Meta {meta.numero}:
                              </span>
                              <input
                                type="text"
                                value={meta.titulo}
                                onChange={(e) => updateMeta(meta.id, "titulo", e.target.value)}
                                placeholder="Título da meta..."
                                className="flex-1 px-2 py-1 text-sm bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                              />
                              <button
                                type="button"
                                onClick={() => removeMeta(meta.id)}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                title="Excluir meta"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Conteúdo da Meta (expandido) */}
                            {expandedMetas.has(meta.id) && (
                              <div className="p-4 space-y-4 bg-white">
                                {/* Campos da Meta */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                                      Data Início
                                    </label>
                                    <input
                                      type="date"
                                      value={meta.dataInicio || ""}
                                      onChange={(e) => updateMeta(meta.id, "dataInicio", e.target.value)}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                                      Data Fim
                                    </label>
                                    <input
                                      type="date"
                                      value={meta.dataFim || ""}
                                      onChange={(e) => updateMeta(meta.id, "dataFim", e.target.value)}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                                    Descrição (opcional)
                                  </label>
                                  <textarea
                                    value={meta.descricao || ""}
                                    onChange={(e) => updateMeta(meta.id, "descricao", e.target.value)}
                                    placeholder="Descrição da meta..."
                                    rows={2}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 resize-none"
                                  />
                                </div>

                                {/* Etapas da Meta */}
                                <div className="border-t border-gray-100 pt-3">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                      <Milestone className="h-3.5 w-3.5" />
                                      Etapas
                                    </h4>
                                    <button
                                      type="button"
                                      onClick={() => addEtapa(meta.id)}
                                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                    >
                                      <Plus className="h-3 w-3" />
                                      Adicionar Etapa
                                    </button>
                                  </div>

                                  {meta.etapas.length === 0 ? (
                                    <p className="text-xs text-gray-400 text-center py-3 border border-dashed border-gray-200 rounded">
                                      Nenhuma etapa cadastrada
                                    </p>
                                  ) : (
                                    <div className="space-y-2 ml-4">
                                      {meta.etapas.map((etapa) => (
                                        <div
                                          key={etapa.id}
                                          className="border border-gray-200 rounded-lg overflow-hidden"
                                        >
                                          {/* Header da Etapa */}
                                          <div className="flex items-center gap-2 px-3 py-2 bg-gray-400/30 border-b border-gray-200">
                                            <button
                                              type="button"
                                              onClick={() => toggleEtapa(etapa.id)}
                                              className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                                            >
                                              {expandedEtapas.has(etapa.id) ? (
                                                <ChevronDown className="h-3.5 w-3.5 text-gray-700" />
                                              ) : (
                                                <ChevronRight className="h-3.5 w-3.5 text-gray-700" />
                                              )}
                                            </button>
                                            <Milestone className="h-3.5 w-3.5 text-gray-600 flex-shrink-0" />
                                            <span className="text-xs font-bold text-gray-800">
                                              Etapa {etapa.numero}:
                                            </span>
                                            <input
                                              type="text"
                                              value={etapa.titulo}
                                              onChange={(e) =>
                                                updateEtapa(meta.id, etapa.id, "titulo", e.target.value)
                                              }
                                              placeholder="Título da etapa..."
                                              className="flex-1 px-2 py-1 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => removeEtapa(meta.id, etapa.id)}
                                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                          </div>

                                          {/* Conteúdo da Etapa (expandido) */}
                                          {expandedEtapas.has(etapa.id) && (
                                            <div className="p-3 space-y-3 bg-white">
                                              {/* Campos da Etapa */}
                                              <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                  <label className="text-xs text-gray-500 mb-1 block">
                                                    Data Início
                                                  </label>
                                                  <input
                                                    type="date"
                                                    value={etapa.dataInicio || ""}
                                                    onChange={(e) =>
                                                      updateEtapa(meta.id, etapa.id, "dataInicio", e.target.value)
                                                    }
                                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                                                  />
                                                </div>
                                                <div>
                                                  <label className="text-xs text-gray-500 mb-1 block">
                                                    Data Fim
                                                  </label>
                                                  <input
                                                    type="date"
                                                    value={etapa.dataFim || ""}
                                                    onChange={(e) =>
                                                      updateEtapa(meta.id, etapa.id, "dataFim", e.target.value)
                                                    }
                                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                                                  />
                                                </div>
                                              </div>

                                              {/* Fases da Etapa */}
                                              <div className="border-t border-gray-100 pt-2">
                                                <div className="flex items-center justify-between mb-2">
                                                  <h5 className="text-xs font-medium text-gray-600 flex items-center gap-1">
                                                    <Flag className="h-3 w-3" />
                                                    Fases
                                                  </h5>
                                                  <button
                                                    type="button"
                                                    onClick={() => addFase(meta.id, etapa.id)}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                                  >
                                                    <Plus className="h-3 w-3" />
                                                    Fase
                                                  </button>
                                                </div>

                                                {etapa.fases.length === 0 ? (
                                                  <p className="text-xs text-gray-400 text-center py-2 border border-dashed border-gray-200 rounded">
                                                    Nenhuma fase
                                                  </p>
                                                ) : (
                                                  <div className="space-y-2 ml-3">
                                                    {etapa.fases.map((fase) => (
                                                      <div
                                                        key={fase.id}
                                                        className="flex items-center gap-2 p-2 bg-gray-100 border border-gray-300 rounded"
                                                      >
                                                        <Flag className="h-3 w-3 text-gray-600 flex-shrink-0" />
                                                        <span className="text-xs font-medium text-gray-800">
                                                          Fase {fase.numero}:
                                                        </span>
                                                        <input
                                                          type="text"
                                                          value={fase.titulo}
                                                          onChange={(e) =>
                                                            updateFase(
                                                              meta.id,
                                                              etapa.id,
                                                              fase.id,
                                                              "titulo",
                                                              e.target.value
                                                            )
                                                          }
                                                          placeholder="Título da fase..."
                                                          className="flex-1 px-2 py-1 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                                                        />
                                                        <input
                                                          type="date"
                                                          value={fase.dataInicio || ""}
                                                          onChange={(e) =>
                                                            updateFase(
                                                              meta.id,
                                                              etapa.id,
                                                              fase.id,
                                                              "dataInicio",
                                                              e.target.value
                                                            )
                                                          }
                                                          className="w-28 px-1 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                                                          title="Data início"
                                                        />
                                                        <input
                                                          type="date"
                                                          value={fase.dataFim || ""}
                                                          onChange={(e) =>
                                                            updateFase(
                                                              meta.id,
                                                              etapa.id,
                                                              fase.id,
                                                              "dataFim",
                                                              e.target.value
                                                            )
                                                          }
                                                          className="w-28 px-1 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                                                          title="Data fim"
                                                        />
                                                        <button
                                                          type="button"
                                                          onClick={() =>
                                                            removeFase(meta.id, etapa.id, fase.id)
                                                          }
                                                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                                        >
                                                          <Trash2 className="h-3 w-3" />
                                                        </button>
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
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
                  <>
                    Criar Contrato
                  </>
                )}
              </button>
            </div>
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
