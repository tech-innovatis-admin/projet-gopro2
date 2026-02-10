import { http } from '../http';
import type {
  DocumentDownloadUrlDTO,
  DocumentOwnerTypeEnum,
  DocumentResponseDTO,
} from '../types';

const BASE = '/documents';

export interface UploadDocumentPayload {
  file: File;
  ownerType: DocumentOwnerTypeEnum;
  ownerId: number;
  category?: string;
}

export interface ListDocumentsByOwnerParams {
  ownerType: DocumentOwnerTypeEnum;
  ownerId: number;
}

export interface GenerateDocumentDownloadUrlParams {
  expiresInMinutes?: number;
}

export function listDocumentsByOwner(params: ListDocumentsByOwnerParams) {
  return http.get<DocumentResponseDTO[]>(BASE, {
    query: {
      ownerType: params.ownerType,
      ownerId: params.ownerId,
    },
  });
}

export function uploadDocument(payload: UploadDocumentPayload) {
  const formData = new FormData();
  formData.append('file', payload.file);

  return http.post<DocumentResponseDTO>(BASE, {
    query: {
      ownerType: payload.ownerType,
      ownerId: payload.ownerId,
      category: payload.category,
    },
    body: formData,
  });
}

export function getDocumentById(id: string) {
  return http.get<DocumentResponseDTO>(`${BASE}/${id}`);
}

export function generateDocumentDownloadUrl(
  id: string,
  params: GenerateDocumentDownloadUrlParams = {}
) {
  return http.get<DocumentDownloadUrlDTO>(`${BASE}/${id}/download`, {
    query: {
      expiresInMinutes: params.expiresInMinutes,
    },
  });
}

export function deleteDocument(id: string) {
  return http.delete<void>(`${BASE}/${id}`);
}
