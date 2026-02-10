import { http } from '../http';
import type {
  PageResponseDTO,
  StageRequestDTO,
  StageResponseDTO,
  StageUpdateDTO,
} from '../types';

const BASE = '/stages';

export interface ListStagesParams {
  page?: number;
  size?: number;
  goalId?: number;
  projectId?: number;
}

export function listStages(params: ListStagesParams = {}) {
  return http.get<PageResponseDTO<StageResponseDTO>>(BASE, {
    query: {
      page: params.page ?? 0,
      size: params.size ?? 20,
      goalId: params.goalId,
      projectId: params.projectId,
    },
  });
}

export function getStageById(id: number | string) {
  return http.get<StageResponseDTO>(`${BASE}/${id}`);
}

export function createStage(payload: StageRequestDTO) {
  return http.post<StageResponseDTO>(BASE, { body: payload });
}

export function updateStage(id: number | string, payload: StageUpdateDTO) {
  return http.put<StageResponseDTO>(`${BASE}/${id}`, { body: payload });
}

export function deleteStage(id: number | string) {
  return http.delete<void>(`${BASE}/${id}`);
}

export function concludeStage(id: number | string) {
  return http.patch<StageResponseDTO>(`${BASE}/${id}/conclude`);
}

export function reopenStage(id: number | string) {
  return http.patch<StageResponseDTO>(`${BASE}/${id}/reopen`);
}
