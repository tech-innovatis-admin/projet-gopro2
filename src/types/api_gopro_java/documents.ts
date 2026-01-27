/**
 * Tipos relacionados a Documentos
 */

import type { AuditFields, IdRef } from './common';

// =============================================================================
// ENTIDADE
// =============================================================================

export interface Document extends AuditFields {
  id: number;
  projectId: number;
  entityType: string;  // 'projects', 'expenses', 'budget_items', etc.
  entityId: number;
  documentType?: string;  // 'contrato', 'TED', 'TR', 'nota_fiscal', 'oficio'
  filename: string;
  filePath: string;
  contentType?: string;  // 'application/pdf', 'image/png', etc.
  filesize?: number;
  checksum?: string;
  notes?: string;
}

export interface CreateDocument {
  projectId: number;
  entityType: string;
  entityId: number;
  documentType?: string;
  filename: string;
  filePath: string;
  contentType?: string;
  filesize?: number;
  checksum?: string;
  notes?: string;
}

export interface UpdateDocument extends Partial<Omit<CreateDocument, 'projectId' | 'entityType' | 'entityId'>> {}
