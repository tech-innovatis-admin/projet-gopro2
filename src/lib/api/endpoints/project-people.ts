import { http } from '../http';
import type {
  PageResponseDTO,
  ProjectPeopleRequestDTO,
  ProjectPeopleResponseDTO,
  ProjectPeopleUpdateDTO,
} from '../types';

const BASE = '/project-people';

export interface ListProjectPeopleParams {
  page?: number;
  size?: number;
}

export function listProjectPeople(params: ListProjectPeopleParams = {}) {
  return http.get<PageResponseDTO<ProjectPeopleResponseDTO>>(BASE, {
    query: {
      page: params.page ?? 0,
      size: params.size ?? 20,
    },
  });
}

export function getProjectPeopleById(id: number | string) {
  return http.get<ProjectPeopleResponseDTO>(`${BASE}/${id}`);
}

export function createProjectPeople(payload: ProjectPeopleRequestDTO) {
  return http.post<ProjectPeopleResponseDTO>(BASE, { body: payload });
}

export function updateProjectPeople(id: number | string, payload: ProjectPeopleUpdateDTO) {
  return http.put<ProjectPeopleResponseDTO>(`${BASE}/${id}`, { body: payload });
}

export function deleteProjectPeople(id: number | string) {
  return http.delete<void>(`${BASE}/${id}`);
}

