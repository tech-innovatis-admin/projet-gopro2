import { http } from '../http';
import type {
  PageResponseDTO,
  PublicAgencyRequestDTO,
  PublicAgencyResponseDTO,
  PublicAgencyUpdateDTO,
} from '../types';

const BASE = '/public-agencies';

export interface ListPublicAgenciesParams {
  page?: number;
  size?: number;
}

export function listPublicAgencies(params: ListPublicAgenciesParams = {}) {
  return http.get<PageResponseDTO<PublicAgencyResponseDTO>>(BASE, {
    query: {
      page: params.page ?? 0,
      size: params.size ?? 20,
    },
  });
}

export async function listAllPublicAgencies(pageSize = 100) {
  const firstPage = await listPublicAgencies({ page: 0, size: pageSize });
  const all = [...firstPage.content];

  for (let page = 1; page < firstPage.totalPages; page++) {
    const nextPage = await listPublicAgencies({ page, size: pageSize });
    all.push(...nextPage.content);
  }

  return all;
}

export function getPublicAgencyById(id: number | string) {
  return http.get<PublicAgencyResponseDTO>(`${BASE}/${id}`);
}

export function createPublicAgency(payload: PublicAgencyRequestDTO) {
  return http.post<PublicAgencyResponseDTO>(BASE, { body: payload });
}

export function updatePublicAgency(id: number | string, payload: PublicAgencyUpdateDTO) {
  return http.put<PublicAgencyResponseDTO>(`${BASE}/${id}`, { body: payload });
}

export function deletePublicAgency(id: number | string) {
  return http.delete<void>(`${BASE}/${id}`);
}

