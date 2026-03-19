/**
 * Tipos relacionados a Execução Técnica
 * - Metas (Goals)
 * - Etapas (Stages)
 * - Fases (Phases)
 * - Marcos (Milestones)
 * - Tarefas (Tasks)
 */

import type { AuditFields, IdRef } from './common';

// =============================================================================
// ENUMS
// =============================================================================

/** Status do milestone (smallint no banco) */
export type MilestoneStatus = 0 | 1 | 2;
// 0 = NAO_INICIADO, 1 = EM_ANDAMENTO, 2 = CONCLUIDO (inferido)

/** Status da task (smallint no banco) */
export type TaskStatus = 0 | 1 | 2;
// 0 = NAO_INICIADA, 1 = ANDAMENTO, 2 = CONCLUIDA

// =============================================================================
// METAS (GOALS)
// =============================================================================

export interface Goal extends AuditFields {
  id: number;
  projectId: number;
  numero: number;
  titulo: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
  hasFinancialValue?: boolean;
  financialAmount?: number;
}

export interface CreateGoal {
  project: IdRef;
  numero: number;
  titulo: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
  hasFinancialValue?: boolean;
  financialAmount?: number;
}

export interface UpdateGoal extends Partial<Omit<CreateGoal, 'project'>> {}

// =============================================================================
// ETAPAS (STAGES)
// =============================================================================

export interface Stage extends AuditFields {
  id: number;
  projectId: number;
  goalId: number;
  // Objeto expandido
  goal?: Goal;
  numero: number;
  titulo: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
  hasFinancialValue?: boolean;
  financialAmount?: number;
}

export interface CreateStage {
  project: IdRef;
  goal: IdRef;
  numero: number;
  titulo: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
  hasFinancialValue?: boolean;
  financialAmount?: number;
}

export interface UpdateStage extends Partial<Omit<CreateStage, 'project' | 'goal'>> {}

// =============================================================================
// FASES (PHASES)
// =============================================================================

export interface Phase extends AuditFields {
  id: number;
  projectId: number;
  goalId: number;
  stageId: number;
  goal?: Goal;
  stage?: Stage;
  numero: number;
  titulo: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
}

export interface CreatePhase {
  project: IdRef;
  goal: IdRef;
  stage: IdRef;
  numero: number;
  titulo: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
}

export interface UpdatePhase extends Partial<Omit<CreatePhase, 'project' | 'goal' | 'stage'>> {}

// =============================================================================
// MARCOS (MILESTONES)
// =============================================================================

export interface Milestone extends AuditFields {
  id: number;
  projectId: number;
  name: string;
  responsible?: string;
  status: MilestoneStatus;
  percentage: number;
  phase?: string;
  description?: string;
  observations?: string;
  plannedDate?: string;
  actualDate?: string;
}

export interface CreateMilestone {
  project: IdRef;
  name: string;
  responsible?: string;
  status?: MilestoneStatus;
  percentage?: number;
  phase?: string;
  description?: string;
  observations?: string;
  plannedDate?: string;
  actualDate?: string;
}

export interface UpdateMilestone extends Partial<Omit<CreateMilestone, 'project'>> {}

// =============================================================================
// TAREFAS (TASKS)
// =============================================================================

export interface Task extends AuditFields {
  id: number;
  projectId: number;
  milestoneId?: number;
  milestone?: Milestone;
  description: string;
  detail?: string;
  plannedQuantity?: number;
  executedQuantity?: number;
  measurementUnit?: string;
  unitCost?: number;
  status?: TaskStatus;
  startDate?: string;
  endDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  responsible?: string;
}

export interface CreateTask {
  project: IdRef;
  milestone?: IdRef;
  description: string;
  detail?: string;
  plannedQuantity?: number;
  executedQuantity?: number;
  measurementUnit?: string;
  unitCost?: number;
  status?: TaskStatus;
  startDate?: string;
  endDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  responsible?: string;
}

export interface UpdateTask extends Partial<Omit<CreateTask, 'project'>> {}
