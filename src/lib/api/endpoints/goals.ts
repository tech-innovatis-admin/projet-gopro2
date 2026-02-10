import { http } from '../http';
import type {
  GoalRequestDTO,
  GoalResponseDTO,
  GoalUpdateDTO,
  PageResponseDTO,
} from '../types';

const BASE = '/goals';

export interface ListGoalsParams {
  page?: number;
  size?: number;
  projectId?: number;
}

export function listGoals(params: ListGoalsParams = {}) {
  return http.get<PageResponseDTO<GoalResponseDTO>>(BASE, {
    query: {
      page: params.page ?? 0,
      size: params.size ?? 20,
      projectId: params.projectId,
    },
  });
}

export function getGoalById(id: number | string) {
  return http.get<GoalResponseDTO>(`${BASE}/${id}`);
}

export function createGoal(payload: GoalRequestDTO) {
  return http.post<GoalResponseDTO>(BASE, { body: payload });
}

export function updateGoal(id: number | string, payload: GoalUpdateDTO) {
  return http.put<GoalResponseDTO>(`${BASE}/${id}`, { body: payload });
}

export function deleteGoal(id: number | string) {
  return http.delete<void>(`${BASE}/${id}`);
}

export function concludeGoal(id: number | string) {
  return http.patch<GoalResponseDTO>(`${BASE}/${id}/conclude`);
}

export function reopenGoal(id: number | string) {
  return http.patch<GoalResponseDTO>(`${BASE}/${id}/reopen`);
}
