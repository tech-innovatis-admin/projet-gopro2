/**
 * Tipos relacionados a Auditoria
 */

// =============================================================================
// AUDIT LOG
// =============================================================================

export interface AuditLog {
  id: number;
  entityType: string;  // nome da tabela que foi alterada
  entityId: number;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  changedAt?: string;
  userId?: number;
  changes?: Record<string, unknown>; 
}

// =============================================================================
// USER
// =============================================================================
// Essa tabela de usuário é apenas fictícia, pois usaremos um microsserviço de autenticação
export interface User {
  id: number;
  email?: string;
  hash: string;
  role?: string;
  username?: string;
  createdAt?: string;
  updatedAt?: string;
  name?: string;
  photo?: string;
  platforms?: string;
  cargo?: string;
}

/** User sem campos sensíveis (para exibição) */
export interface UserSummary {
  id: number;
  name?: string;
  email?: string;
  photo?: string;
  cargo?: string;
}
