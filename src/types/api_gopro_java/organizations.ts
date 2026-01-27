/**
 * Tipos relacionados a Organizações (Fornecedores, Parceiros, etc.)
 */

import type { AuditFields, IdRef } from './common';

// =============================================================================
// ENUMS
// =============================================================================

/** Tipo da organização (smallint no banco) */
export type OrganizationType = 0 | 1 | 2 | 3 | 4;
// 0 = FUNDACAO, 1 = ORGAO_PUBLICO, 2 = EMPRESA, 3 = PARCEIRA, 4 = CLIENTE

/** Status ativo/inativo (smallint no banco) */
export type ActiveStatus = 0 | 1;
// 0 = INATIVO, 1 = ATIVO

// =============================================================================
// ENTIDADE PRINCIPAL
// =============================================================================

export interface Organization extends AuditFields {
  id: number;
  name: string;
  tradeName?: string;
  cnpj?: string;
  type?: OrganizationType;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  zipCode?: string;
  city?: string;
  state?: string;
  notes?: string;
  isActive: ActiveStatus;
}

// =============================================================================
// CATEGORIAS E SERVIÇOS (MASTER)
// =============================================================================

export interface OrganizationCategoryMaster {
  id: number;
  code: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrganizationServiceMaster {
  id: number;
  code: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// =============================================================================
// VÍNCULOS (ORGANIZATION <-> CATEGORY/SERVICE)
// =============================================================================

export interface OrganizationCategory {
  id: number;
  organizationId: number;
  categoryId: number;
  createdAt?: string;
  createdBy?: number;
}

export interface OrganizationService {
  id: number;
  organizationId: number;
  serviceId: number;
  createdAt?: string;
  createdBy?: number;
}

// =============================================================================
// DTOs
// =============================================================================

export interface CreateOrganization {
  name: string;
  tradeName?: string;
  cnpj?: string;
  type?: OrganizationType;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  zipCode?: string;
  city?: string;
  state?: string;
  notes?: string;
  isActive?: ActiveStatus;
}

export interface UpdateOrganization extends Partial<CreateOrganization> {}

export interface CreateOrganizationCategoryMaster {
  code: string;
  name: string;
  description?: string;
  active?: boolean;
}

export interface CreateOrganizationServiceMaster {
  code: string;
  name: string;
  description?: string;
  active?: boolean;
}

export interface CreateOrganizationCategory {
  organizationId: number;
  categoryId: number;
}

export interface CreateOrganizationService {
  organizationId: number;
  serviceId: number;
}
