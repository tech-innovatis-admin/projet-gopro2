/**
 * Tipos relacionados a Projetos
 */

import type { AuditFields, IdRef } from './common';
import type { Organization } from './organizations';

// =============================================================================
// ENUMS
// =============================================================================

/** Status do projeto (smallint no banco) */
export type ProjectStatus = 0 | 1 | 2 | 3 | 4;
// 0 = PRE_PROJETO, 1 = EM_EXECUCAO, 2 = CONCLUIDO, 3 = SUSPENSO, 4 = CANCELADO

/** Tipo Gov/IF (smallint no banco) */
export type GovIf = 0 | 1;
// 0 = Gov, 1 = IF

/** Tipo do projeto (smallint no banco) */
export type ProjectType = 0 | 1;
// 0 = PROJETO, 1 = PRODUTO

// =============================================================================
// ENTIDADE
// =============================================================================

export interface Project extends AuditFields {
  id: number;
  name: string;
  code?: string;
  status: ProjectStatus;
  areaSegmento?: string;
  orgaoFinanciadorId?: number;
  executingOrgId?: number;
  // Objetos expandidos (quando API retorna)
  orgaoFinanciador?: Organization;
  executingOrg?: Organization;
  coordinator?: string;
  govIf?: GovIf;
  projectType?: ProjectType;
  contractValue?: number;
  valorEmpenhado?: number;
  valorLiquidado?: number;
  valorPago?: number;
  startDate?: string;
  endDate?: string;
  openingDate?: string;
  executionLocation?: string;
  totalReceived: number;
  totalExpenses: number;
  saldo: number;
}

// =============================================================================
// DTOs
// =============================================================================

export interface CreateProject {
  name: string;
  code?: string;
  status: ProjectStatus;
  areaSegmento?: string;
  orgaoFinanciador?: IdRef;
  executingOrg?: IdRef;
  coordinator?: string;
  govIf?: GovIf;
  projectType?: ProjectType;
  contractValue?: number;
  valorEmpenhado?: number;
  valorLiquidado?: number;
  valorPago?: number;
  startDate?: string;
  endDate?: string;
  openingDate?: string;
  executionLocation?: string;
}

export interface UpdateProject extends Partial<CreateProject> {}
