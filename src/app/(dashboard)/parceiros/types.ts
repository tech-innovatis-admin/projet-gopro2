// =============================================================================
// TIPOS PARA O MÓDULO DE PARCEIROS
// =============================================================================

// Tipo do parceiro: IFES ou Fundação
export type ParceiroTipo = "IFES" | "FUNDACAO";

// Status do parceiro
export type ParceiroStatus = "ATIVO" | "INATIVO";

// Labels amigáveis para tipos
export const TIPO_LABELS: Record<ParceiroTipo, string> = {
  IFES: "Instituto Federal",
  FUNDACAO: "Fundação",
};

// Labels curtos para tipos
export const TIPO_SHORT_LABELS: Record<ParceiroTipo, string> = {
  IFES: "IFES",
  FUNDACAO: "Fundação",
};

// Cores por tipo (para badges)
export const TIPO_COLORS: Record<ParceiroTipo, { bg: string; text: string; border: string }> = {
  IFES: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  FUNDACAO: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
};

// Configuração completa de tipos (para páginas de detalhe)
import { Building, GraduationCap, type LucideIcon } from "lucide-react";

export const TIPO_CONFIG: Record<ParceiroTipo, {
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
  borderColor: string;
}> = {
  IFES: {
    label: "Instituto Federal",
    shortLabel: "IFES",
    icon: GraduationCap,
    bgColor: "bg-emerald-100",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-300",
  },
  FUNDACAO: {
    label: "Fundação",
    shortLabel: "Fundação",
    icon: Building,
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
    borderColor: "border-blue-300",
  },
};

// Configuração de status
export const STATUS_CONFIG: Record<ParceiroStatus, { label: string; bgColor: string; textColor: string }> = {
  ATIVO: { label: "Ativo", bgColor: "bg-green-100", textColor: "text-green-700" },
  INATIVO: { label: "Inativo", bgColor: "bg-red-100", textColor: "text-red-700" },
};

// Interface principal do Parceiro
export interface Parceiro {
  id: string;
  nome: string;
  sigla?: string;
  tipo: ParceiroTipo;
  cnpj?: string;
  email?: string;
  telefone?: string;
  site?: string;
  cep?: string;
  uf: string;
  municipio: string;
  endereco?: string;
  status: ParceiroStatus;
  contratosAtivos?: number;
  valorTotalContratos?: number;
  observacoes?: string;
  createdAt: string; // ISO date
  updatedAt?: string; // ISO date
}

// Contrato vinculado ao parceiro (resumido)
export interface ParceiroContratoVinculado {
  id: string;
  titulo: string;
  status: string;
  valor: number;
  dataInicio: string;
  dataFim?: string;
}

// Estado dos filtros
export interface ParceirosFiltersState {
  q: string; // busca geral
  tipo: ParceiroTipo | "";
  uf: string;
  status: ParceiroStatus | "";
  sortBy: "nome" | "uf" | "municipio" | "tipo" | "contratosAtivos";
  sortDir: "asc" | "desc";
  page: number;
  pageSize: number;
}

// Estado inicial dos filtros
export const INITIAL_FILTERS_STATE: ParceirosFiltersState = {
  q: "",
  tipo: "",
  uf: "",
  status: "",
  sortBy: "nome",
  sortDir: "asc",
  page: 1,
  pageSize: 12,
};

// Lista de UFs do Brasil
export const UF_LIST = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;
