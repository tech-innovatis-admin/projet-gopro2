/**
 * Tipos comuns da API GoPro 2.0
 * IDs, timestamps, paginação e tipos utilitários
 */

// =============================================================================
// TIPOS BASE
// =============================================================================

/** Campos de auditoria presentes em quase todas as entidades */
export interface AuditFields {
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
  updatedBy?: number;
}

/** Referência simples por ID (para criar/atualizar relacionamentos) */
export interface IdRef {
  id: number;
}

// =============================================================================
// PAGINAÇÃO (formato Spring)
// =============================================================================

export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable: Pageable;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
  number: number;
  size: number;
  empty: boolean;
}

// =============================================================================
// PARÂMETROS DE QUERY COMUNS
// =============================================================================

export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
}

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}
