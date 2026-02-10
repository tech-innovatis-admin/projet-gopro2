import { http } from '../http';
import type {
  PageResponseDTO,
  ProjectDashboardResponseDTO,
  ProjectLocationResponseDTO,
  ProjectMonthResponseDTO,
  ProjectPartnerResponseDTO,
  ProjectStatusEnum,
  ProjectStatusCategoryResponseDTO,
  ProjectTypeEnum,
  ProjectTypeDistributionResponseDTO,
  ProjectRequestDTO,
  ProjectResponseDTO,
  ProjectTotalsDTO,
  ProjectUpdateDTO,
} from '../types';

const BASE = '/projects';

export interface ListProjectsParams {
  page?: number;
  size?: number;
}

export interface ProjectDashboardFilters {
  projectStatus?: ProjectStatusEnum;
  projectType?: ProjectTypeEnum;
  month?: number;
  year?: number;
  location?: string;
  partnerId?: number;
}

export interface ProjectStatusCategoryFilters {
  projectStatus: ProjectStatusEnum;
}

export interface ProjectTypeDistributionFilters {
  projectType: ProjectTypeEnum;
}

export interface ProjectMonthFilters {
  month: number;
  year?: number;
}

export interface ProjectLocationFilters {
  location: string;
}

export interface ProjectPartnerFilters {
  partnerId: number;
}

export function listProjects(params: ListProjectsParams = {}) {
  return http.get<PageResponseDTO<ProjectResponseDTO>>(BASE, {
    query: {
      page: params.page ?? 0,
      size: params.size ?? 20,
    },
  });
}

export function getProjectById(id: number | string) {
  return http.get<ProjectResponseDTO>(`${BASE}/${id}`);
}

export function getProjectTotals(id: number | string) {
  return http.get<ProjectTotalsDTO>(`${BASE}/${id}/totals`);
}

export function getProjectDashboard(filters: ProjectDashboardFilters = {}) {
  return http.get<ProjectDashboardResponseDTO>(`${BASE}/dashboard`, {
    query: {
      projectStatus: filters.projectStatus,
      projectType: filters.projectType,
      month: filters.month,
      year: filters.year,
      location: filters.location,
      partnerId: filters.partnerId,
    },
  });
}

export function getProjectStatusCategoryAnalytics(filters: ProjectStatusCategoryFilters) {
  return http.get<ProjectStatusCategoryResponseDTO>(`${BASE}/analytics/status-category`, {
    query: {
      projectStatus: filters.projectStatus,
    },
  });
}

export function getProjectTypeDistributionAnalytics(filters: ProjectTypeDistributionFilters) {
  return http.get<ProjectTypeDistributionResponseDTO>(`${BASE}/analytics/type-distribution`, {
    query: {
      projectType: filters.projectType,
    },
  });
}

export function getProjectMonthAnalytics(filters: ProjectMonthFilters) {
  return http.get<ProjectMonthResponseDTO>(`${BASE}/analytics/month`, {
    query: {
      month: filters.month,
      year: filters.year,
    },
  });
}

export function getProjectLocationAnalytics(filters: ProjectLocationFilters) {
  return http.get<ProjectLocationResponseDTO>(`${BASE}/analytics/location`, {
    query: {
      location: filters.location,
    },
  });
}

export function getProjectPartnerAnalytics(filters: ProjectPartnerFilters) {
  return http.get<ProjectPartnerResponseDTO>(`${BASE}/analytics/partner`, {
    query: {
      partnerId: filters.partnerId,
    },
  });
}

export function createProject(payload: ProjectRequestDTO) {
  return http.post<ProjectResponseDTO>(BASE, { body: payload });
}

export function updateProject(id: number | string, payload: ProjectUpdateDTO) {
  return http.put<ProjectResponseDTO>(`${BASE}/${id}`, { body: payload });
}

export function deleteProject(id: number | string) {
  return http.delete<void>(`${BASE}/${id}`);
}

