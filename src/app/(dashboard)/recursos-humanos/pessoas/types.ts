// =============================================================================
// TIPOS PARA PESSOAS EM PROJETOS
// =============================================================================

// Status de vínculo com projeto
export type ProjectPersonStatus = 0 | 1 | 2; // 0=pendente, 1=ativo, 2=encerrado

export const PROJECT_PERSON_STATUS_LABELS: Record<ProjectPersonStatus, string> = {
  0: "Pendente",
  1: "Ativo",
  2: "Encerrado",
};

export const PROJECT_PERSON_STATUS_CONFIG: Record<
  ProjectPersonStatus,
  { label: string; bg: string; text: string }
> = {
  0: { label: "Pendente", bg: "bg-yellow-100", text: "text-yellow-700" },
  1: { label: "Ativo", bg: "bg-green-100", text: "text-green-700" },
  2: { label: "Encerrado", bg: "bg-gray-100", text: "text-gray-700" },
};

// Tipos de contrato
export type ContractType = "BOLSA" | "RPA" | "CLT" | "VOLUNTARIO" | "OUTRO";

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  BOLSA: "Bolsa",
  RPA: "RPA",
  CLT: "CLT",
  VOLUNTARIO: "Voluntário",
  OUTRO: "Outro",
};

// Pessoa (tabela people)
export interface Person {
  id: string;
  fullName: string;
  cpf?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  birthDate?: string;
  address?: string;
  city?: string;
  state?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

// Vínculo pessoa-projeto (tabela project_people)
export interface ProjectPerson {
  id: string;
  projectId: string;
  projectName: string; // Desnormalizado para exibição
  projectCode: string; // Código do contrato/projeto
  personId: string;
  role?: string;
  workloadHours?: number;
  institutionalLink?: string;
  contractType?: ContractType;
  startDate?: string;
  endDate?: string;
  status: ProjectPersonStatus;
  baseAmount?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

// Pessoa com seus vínculos (para exibição)
export interface PersonWithProjects extends Person {
  projects: ProjectPerson[];
  activeProjectsCount: number;
  totalProjectsCount: number;
}

// Filtros para a tabela de pessoas
export interface PersonFilters {
  search?: string;
  state?: string;
  city?: string;
  hasActiveProject?: boolean;
  projectName?: string;
}

// Filtros para vínculos de projetos
export interface ProjectPersonFilters {
  status?: ProjectPersonStatus;
  contractType?: ContractType;
  projectId?: string;
}
