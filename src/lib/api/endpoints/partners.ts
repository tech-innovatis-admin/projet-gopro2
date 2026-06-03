import { http } from '../http';
import type {
  PageResponseDTO,
  PartnerRequestDTO,
  PartnerResponseDTO,
  PartnerUpdateDTO,
  ProjectPartnerLinkResponseDTO,
} from '../types';

const BASE = '/partners';

export interface ListPartnersParams {
  page?: number;
  size?: number;
}

export function listPartners(params: ListPartnersParams = {}) {
  return http.get<PageResponseDTO<PartnerResponseDTO>>(BASE, {
    query: {
      page: params.page ?? 0,
      size: params.size ?? 20,
    },
  });
}

export function getPartnerById(id: number | string) {
  return http.get<PartnerResponseDTO>(`${BASE}/${id}`);
}

export function createPartner(payload: PartnerRequestDTO) {
  return http.post<PartnerResponseDTO>(BASE, { body: payload });
}

export function updatePartner(id: number | string, payload: PartnerUpdateDTO) {
  return http.put<PartnerResponseDTO>(`${BASE}/${id}`, { body: payload });
}

export function deletePartner(id: number | string) {
  return http.delete<void>(`${BASE}/${id}`);
}

export function listProjectPartnerLinks(
  projectId: number,
  params: { page?: number; size?: number } = {}
) {
  return http.get<PageResponseDTO<ProjectPartnerLinkResponseDTO>>(
    `/contracts/${projectId}/parceiros`,
    { query: { page: params.page ?? 0, size: params.size ?? 50 } }
  );
}

