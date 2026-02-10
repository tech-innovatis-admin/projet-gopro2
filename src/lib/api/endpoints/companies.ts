import { http } from '../http';
import type {
  CompanyRequestDTO,
  CompanyResponseDTO,
  CompanyUpdateDTO,
  PageResponseDTO,
} from '../types';

const BASE = '/companies';

export interface ListCompaniesParams {
  page?: number;
  size?: number;
}

export function listCompanies(params: ListCompaniesParams = {}) {
  return http.get<PageResponseDTO<CompanyResponseDTO>>(BASE, {
    query: {
      page: params.page ?? 0,
      size: params.size ?? 20,
    },
  });
}

export function getCompanyById(id: number | string) {
  return http.get<CompanyResponseDTO>(`${BASE}/${id}`);
}

export function createCompany(payload: CompanyRequestDTO) {
  return http.post<CompanyResponseDTO>(BASE, { body: payload });
}

export function updateCompany(id: number | string, payload: CompanyUpdateDTO) {
  return http.put<CompanyResponseDTO>(`${BASE}/${id}`, { body: payload });
}

export function deleteCompany(id: number | string) {
  return http.delete<void>(`${BASE}/${id}`);
}

