/**
 * Tipos relacionados a Contratos e Contratações
 * - Project People (PF vinculadas)
 * - Project Organizations (PJ vinculadas)
 * - Contract Initiation (Trilha de contratos)
 * - Contract Evaluations
 */

import type { AuditFields, IdRef } from './common';
import type { People } from './people';
import type { Organization } from './organizations';
import type { BudgetCategory, BudgetItem } from './finance';

// =============================================================================
// ENUMS
// =============================================================================

/** Status de vínculo PF/PJ (smallint no banco) */
export type ContractStatus = 0 | 1 | 2;
// 0 = PENDENTE, 1 = ATIVO, 2 = ENCERRADO

/** Status de atividade (string no banco) */
export type ActivityStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

// =============================================================================
// PROJECT PEOPLE (PF VINCULADAS)
// =============================================================================

export interface ProjectPeople extends AuditFields {
  id: number;
  projectId: number;
  personId: number;
  person?: People;
  role?: string;
  workloadHours?: number;
  institutionalLink?: string;
  contractType?: string;
  startDate?: string;
  endDate?: string;
  status?: ContractStatus;
  baseAmount?: number;
  notes?: string;
}

export interface CreateProjectPeople {
  project: IdRef;
  person: IdRef;
  role?: string;
  workloadHours?: number;
  institutionalLink?: string;
  contractType?: string;
  startDate?: string;
  endDate?: string;
  status?: ContractStatus;
  baseAmount?: number;
  notes?: string;
}

export interface UpdateProjectPeople extends Partial<Omit<CreateProjectPeople, 'project' | 'person'>> {}

// =============================================================================
// PROJECT ORGANIZATIONS (PJ VINCULADAS)
// =============================================================================

export interface ProjectOrganization extends AuditFields {
  id: number;
  projectId: number;
  organizationId: number;
  organization?: Organization;
  contractNumber?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: ContractStatus;
  totalValue?: number;
  notes?: string;
  isIncubated?: boolean;
  serviceType?: string;
}

export interface CreateProjectOrganization {
  project: IdRef;
  organization: IdRef;
  contractNumber?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: ContractStatus;
  totalValue?: number;
  notes?: string;
  isIncubated?: boolean;
  serviceType?: string;
}

export interface UpdateProjectOrganization extends Partial<Omit<CreateProjectOrganization, 'project' | 'organization'>> {}

// =============================================================================
// PROJECT ORGANIZATION BUDGET LINKS
// =============================================================================

export interface ProjectOrganizationBudgetLink {
  id: number;
  projectOrgId: number;
  categoryId: number;
  budgetItemId: number;
  createdAt?: string;
  createdBy?: number;
}

export interface CreateProjectOrganizationBudgetLink {
  projectOrg: IdRef;
  category: IdRef;
  budgetItem: IdRef;
}

/** 
 * Nota: Geralmente não há Update para tabelas de ligação (Join Tables). 
 * Se o vínculo estiver errado, remove-se o registro e cria-se um novo.
 */

// =============================================================================
// CONTRACT EVALUATIONS
// =============================================================================

export interface ContractEvaluation extends AuditFields {
  id: number;
  projectOrgId: number;
  budgetItemId?: number;
  categoryId?: number;
  rating: number;  // 1-5
  comment?: string;
  evaluatedBy: number;
  evaluatedAt: string;
}

export interface CreateContractEvaluation {
  projectOrg: IdRef;
  budgetItem?: IdRef;
  category?: IdRef;
  rating: number;
  comment?: string;
}

// =============================================================================
// CONTRACT INITIATION STAGES
// =============================================================================

export interface ContractInitiationStage extends AuditFields {
  id: number;
  name: string;
  description?: string;
  order: number;
  isFinal: boolean;
  isActive: boolean;
  slaDays?: number;
}

export interface CreateContractInitiationStage {
  name: string;
  description?: string;
  order: number;
  isFinal?: boolean;
  isActive?: boolean;
  slaDays?: number;
}

export interface UpdateContractInitiationStage extends Partial<CreateContractInitiationStage> {}

// =============================================================================
// CONTRACT INITIATION ACTIVITIES
// =============================================================================

export interface ContractInitiationActivity extends AuditFields {
  id: number;
  projectId: number;
  stageId?: number;
  stage?: ContractInitiationStage;
  title: string;
  description?: string;
  activityType: string;
  status: ActivityStatus;
  dueAt?: string;
  completedAt?: string;
  ownerUserId: number;
}

export interface CreateContractInitiationActivity {
  project: IdRef;
  stage?: IdRef;
  title: string;
  description?: string;
  activityType: string;
  status: ActivityStatus;
  dueAt?: string;
  ownerUserId: number;
}

export interface UpdateContractInitiationActivity extends Partial<Omit<CreateContractInitiationActivity, 'project'>> {
  completedAt?: string;
}

// =============================================================================
// CONTRACT INITIATION STAGE HISTORY
// =============================================================================

export interface ContractInitiationStageHistory {
  id: number;
  projectId: number;
  fromStageId?: number;
  toStageId: number;
  movedAt: string;
  movedByUserId: number;
  daysInPreviousStage?: number;
  createdAt?: string;
}

export interface CreateContractInitiationStageHistory {
  project: IdRef;
  fromStage?: IdRef;
  toStage: IdRef;
  movedByUserId: number;
  daysInPreviousStage?: number;
}
