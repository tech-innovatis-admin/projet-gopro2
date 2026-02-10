import { http } from '../http';
import type {
  PageResponseDTO,
  PhaseRequestDTO,
  PhaseResponseDTO,
  PhaseUpdateDTO,
} from '../types';

const BASE = '/phases';

export interface ListPhasesParams {
  page?: number;
  size?: number;
  stageId?: number;
  projectId?: number;
}

export function listPhases(params: ListPhasesParams = {}) {
  return http.get<PageResponseDTO<PhaseResponseDTO>>(BASE, {
    query: {
      page: params.page ?? 0,
      size: params.size ?? 20,
      stageId: params.stageId,
      projectId: params.projectId,
    },
  });
}

export function getPhaseById(id: number | string) {
  return http.get<PhaseResponseDTO>(`${BASE}/${id}`);
}

export function createPhase(payload: PhaseRequestDTO) {
  return http.post<PhaseResponseDTO>(BASE, { body: payload });
}

export function updatePhase(id: number | string, payload: PhaseUpdateDTO) {
  return http.put<PhaseResponseDTO>(`${BASE}/${id}`, { body: payload });
}

export function deletePhase(id: number | string) {
  return http.delete<void>(`${BASE}/${id}`);
}

export function concludePhase(id: number | string) {
  return http.patch<PhaseResponseDTO>(`${BASE}/${id}/conclude`);
}

export function reopenPhase(id: number | string) {
  return http.patch<PhaseResponseDTO>(`${BASE}/${id}/reopen`);
}
