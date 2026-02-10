import { http } from '../http';
import type {
  PageResponseDTO,
  PeopleRequestDTO,
  PeopleResponseDTO,
} from '../types';

const BASE = '/peoples';

export interface ListPeopleParams {
  page?: number;
  size?: number;
}

export function listPeople(params: ListPeopleParams = {}) {
  return http.get<PageResponseDTO<PeopleResponseDTO>>(BASE, {
    query: {
      page: params.page ?? 0,
      size: params.size ?? 20,
    },
  });
}

export function getPeopleById(id: number | string) {
  return http.get<PeopleResponseDTO>(`${BASE}/${id}`);
}

export function createPeople(payload: PeopleRequestDTO) {
  return http.post<PeopleResponseDTO>(BASE, { body: payload });
}

export function updatePeople(id: number | string, payload: PeopleRequestDTO) {
  return http.put<PeopleResponseDTO>(`${BASE}/${id}`, { body: payload });
}

export function deletePeople(id: number | string) {
  return http.delete<void>(`${BASE}/${id}`);
}

