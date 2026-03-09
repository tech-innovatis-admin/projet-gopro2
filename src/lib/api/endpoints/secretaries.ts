import { http } from '../http';
import type {
  PageResponseDTO,
  SecretaryRequestDTO,
  SecretaryResponseDTO,
  SecretaryUpdateDTO,
} from '../types';

const BASE = '/secretaries';

export interface ListSecretariesParams {
  page?: number;
  size?: number;
}

export function listSecretaries(params: ListSecretariesParams = {}) {
  return http.get<PageResponseDTO<SecretaryResponseDTO>>(BASE, {
    query: {
      page: params.page ?? 0,
      size: params.size ?? 20,
    },
  });
}

export async function listAllSecretaries(pageSize = 100) {
  const firstPage = await listSecretaries({ page: 0, size: pageSize });
  const all = [...firstPage.content];

  for (let page = 1; page < firstPage.totalPages; page++) {
    const nextPage = await listSecretaries({ page, size: pageSize });
    all.push(...nextPage.content);
  }

  return all;
}

export function getSecretaryById(id: number | string) {
  return http.get<SecretaryResponseDTO>(`${BASE}/${id}`);
}

export function createSecretary(payload: SecretaryRequestDTO) {
  return http.post<SecretaryResponseDTO>(BASE, { body: payload });
}

export function updateSecretary(id: number | string, payload: SecretaryUpdateDTO) {
  return http.put<SecretaryResponseDTO>(`${BASE}/${id}`, { body: payload });
}

export function deleteSecretary(id: number | string) {
  return http.delete<void>(`${BASE}/${id}`);
}
