/**
 * Tipos da API GoPro 2.0
 * 
 * DECISÃO: Tipos simples espelhando exatamente o Swagger da API Java.
 * Sem transformações, adapters ou normalizações.
 * O frontend confia cegamente no backend.
 * 
 * @see http://localhost:8080/swagger-ui.html
 */

// =============================================================================
// ENUMS (conforme Java)
// =============================================================================

export type StatusProjects =
  | 'PRE_PROJETO'
  | 'EXECUCAO'
  | 'FINALIZADO'
  | 'SUSPENSO'
  | 'PLANEJAMENTO';

export type OrganizationType = 'FUNDACAO' | 'ORGAO_PUBLICO' | 'EMPRESA' | 'PARCEIRA' | 'CLIENTE';

export type RoleProjectPeople = 'DIRETOR' | 'BOLSISTA';

export type StatusProjectPeople = 'PENDENTE' | 'ATIVO' | 'ENCERRADO';

export type StatusProjectOrganization = 'PENDENTE' | 'ATIVO' | 'ENCERRADO';

export type DocumentType = 'CONTRATO' | 'TED' | 'TR' | 'NOTA_FISCAL' | 'OFICIO';

export type ContentType = 'PDF' | 'PNG';

export type StatusDisbursementSchedule = 'PREVISTO' | 'PARCIAL' | 'RECEBIDO' | 'CANCELADO';

// =============================================================================
// ENTIDADES (conforme Swagger)
// =============================================================================

export interface Organization {
  id: number;
  name: string;
  cnpj: string;
  organizationType: OrganizationType;
  email?: string;
  phone?: string;
  address?: string;
  zipCode?: string;
  city?: string;
  state?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface People {
  id: number;
  fullName: string;
  cpf?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  city?: string;
  state?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  name: string;
  code?: string;
  statusProjects: StatusProjects;
  areaSegmento?: string;
  orgaoFinancioador: Organization;
  executingOrg: Organization;
  cordinator?: string;
  scope?: string;
  contractValue: number;
  startDate?: string;
  endDate?: string;
  openingDate?: string;
  executionLocation?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy?: number;
}

export interface BudgetCategories {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetItems {
  id: number;
  project: Project;
  budgetCategories: BudgetCategories;
  description?: string;
  quantity?: number;
  unitCost: number;
  plannedAmount: number;
  executedAmount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DisbursementSchedule {
  id: number;
  project: Project;
  expectedMonth: string;
  expectedAmount: number;
  statusDisbursementSchedule: StatusDisbursementSchedule;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy?: number;
}

export interface Income {
  id: number;
  project: Project;
  disbursementSchedule: DisbursementSchedule;
  installment: number;
  amount: number;
  receivedAt: string;
  source?: string;
  invoiceNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy?: number;
}

export interface Document {
  id: number;
  documentType: DocumentType;
  project: Project;
  fileName: string;
  filePath: string;
  contentType: ContentType;
  uploadedAt: string;
  uploadedBy: number;
  fileSize?: number;
  checkSum?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPeople {
  id: number;
  project: Project;
  people: People;
  roleProjectPeople: RoleProjectPeople;
  startDate?: string;
  endDate?: string;
  statusProjectPeople: StatusProjectPeople;
  baseAmount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy?: number;
}

export interface ProjectOrganization {
  id: number;
  project: Project;
  organization: Organization;
  contractNumber: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  statusProjectOrganization: StatusProjectOrganization;
  totalValue?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy?: number;
}

// =============================================================================
// DTOs PARA CRIAR/ATUALIZAR
// =============================================================================

export interface CreateProject {
  name: string;
  code?: string;
  statusProjects: StatusProjects;
  areaSegmento?: string;
  orgaoFinancioador: { id: number };
  executingOrg: { id: number };
  cordinator?: string;
  scope?: string;
  contractValue: number;
  startDate?: string;
  endDate?: string;
  openingDate?: string;
  executionLocation?: string;
}

export interface CreateOrganization {
  name: string;
  cnpj: string;
  organizationType: OrganizationType;
  email?: string;
  phone?: string;
  address?: string;
  zipCode?: string;
  city?: string;
  state?: string;
  notes?: string;
}

export interface CreatePeople {
  fullName: string;
  cpf?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  city?: string;
  state?: string;
  notes?: string;
}

export interface CreateBudgetCategories {
  name: string;
  description?: string;
  active: boolean;
}

export interface CreateBudgetItems {
  project: { id: number };
  budgetCategories: { id: number };
  description?: string;
  quantity?: number;
  unitCost: number;
  plannedAmount: number;
  notes?: string;
}

export interface CreateDisbursementSchedule {
  project: { id: number };
  expectedMonth: string;
  expectedAmount: number;
  statusDisbursementSchedule: StatusDisbursementSchedule;
  notes?: string;
}

export interface CreateIncome {
  project: { id: number };
  disbursementSchedule: { id: number };
  installment: number;
  amount: number;
  receivedAt: string;
  source?: string;
  invoiceNumber?: string;
  notes?: string;
}

export interface CreateProjectPeople {
  project: { id: number };
  people: { id: number };
  roleProjectPeople: RoleProjectPeople;
  startDate?: string;
  endDate?: string;
  statusProjectPeople: StatusProjectPeople;
  baseAmount?: number;
  notes?: string;
}

export interface CreateProjectOrganization {
  project: { id: number };
  organization: { id: number };
  contractNumber: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  statusProjectOrganization: StatusProjectOrganization;
  totalValue?: number;
  notes?: string;
}
