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
