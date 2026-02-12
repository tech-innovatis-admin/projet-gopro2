import { http } from '../http';
import type {
  PageResponseDTO,
  ProjectCompanyDetailedResponseDTO,
  ProjectCompanyRequestDTO,
  ProjectCompanyResponseDTO,
  ProjectCompanyUpdateDTO,
} from '../types';

const BASE = '/project-companies';

export interface ListProjectCompaniesParams {
  page?: number;
  size?: number;
  projectId?: number;
}

export function listProjectCompanies(params: ListProjectCompaniesParams = {}) {
  return http.get<PageResponseDTO<ProjectCompanyResponseDTO>>(BASE, {
    query: {
      page: params.page ?? 0,
      size: params.size ?? 20,
      projectId: params.projectId,
    },
  });
}

export function listProjectCompaniesDetailed(params: ListProjectCompaniesParams = {}) {
  return http.get<PageResponseDTO<ProjectCompanyDetailedResponseDTO>>(`${BASE}/detailed`, {
    query: {
      page: params.page ?? 0,
      size: params.size ?? 20,
      projectId: params.projectId,
    },
  });
}

export function getProjectCompanyById(id: number | string) {
  return http.get<ProjectCompanyResponseDTO>(`${BASE}/${id}`);
}

export function createProjectCompany(payload: ProjectCompanyRequestDTO) {
  return http.post<ProjectCompanyResponseDTO>(BASE, { body: payload });
}

export function updateProjectCompany(id: number | string, payload: ProjectCompanyUpdateDTO) {
  return http.put<ProjectCompanyResponseDTO>(`${BASE}/${id}`, { body: payload });
}

export function deleteProjectCompany(id: number | string) {
  return http.delete<void>(`${BASE}/${id}`);
}
