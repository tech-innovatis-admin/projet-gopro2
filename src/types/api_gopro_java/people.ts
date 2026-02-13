/**
 * Tipos relacionados a Pessoas (PF)
 */

import type { AuditFields } from './common';

// =============================================================================
// ENTIDADE
// =============================================================================

export interface People {
  id: number;
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
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
  updatedBy?: number;
}

// =============================================================================
// DTOs
// =============================================================================

export interface CreatePeople {
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
}

export interface UpdatePeople extends Partial<CreatePeople> {}
