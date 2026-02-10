import { http } from '../http';
import type {
  IncomeRequestDTO,
  IncomeResponseDTO,
  IncomeUpdateDTO,
  PageResponseDTO,
} from '../types';

const BASE = '/income';

export interface ListIncomesParams {
  page?: number;
  size?: number;
  projectId?: number;
}

export function listIncomes(params: ListIncomesParams = {}) {
  return http.get<PageResponseDTO<IncomeResponseDTO>>(BASE, {
    query: {
      page: params.page ?? 0,
      size: params.size ?? 20,
      projectId: params.projectId,
    },
  });
}

export function getIncomeById(id: number | string) {
  return http.get<IncomeResponseDTO>(`${BASE}/${id}`);
}

export function createIncome(payload: IncomeRequestDTO) {
  return http.post<IncomeResponseDTO>(BASE, { body: payload });
}

export function updateIncome(id: number | string, payload: IncomeUpdateDTO) {
  return http.put<IncomeResponseDTO>(`${BASE}/${id}`, { body: payload });
}

export function deleteIncome(id: number | string) {
  return http.delete<void>(`${BASE}/${id}`);
}
