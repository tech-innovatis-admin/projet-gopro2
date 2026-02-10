import { http } from '../http';
import type {
  ExpenseRequestDTO,
  ExpenseResponseDTO,
  ExpenseUpdateDTO,
  PageResponseDTO,
} from '../types';

const BASE = '/expenses';

export interface ListExpensesParams {
  page?: number;
  size?: number;
  projectId?: number;
}

export function listExpenses(params: ListExpensesParams = {}) {
  return http.get<PageResponseDTO<ExpenseResponseDTO>>(BASE, {
    query: {
      page: params.page ?? 0,
      size: params.size ?? 20,
      projectId: params.projectId,
    },
  });
}

export function getExpenseById(id: number | string) {
  return http.get<ExpenseResponseDTO>(`${BASE}/${id}`);
}

export function createExpense(payload: ExpenseRequestDTO) {
  return http.post<ExpenseResponseDTO>(BASE, { body: payload });
}

export function updateExpense(id: number | string, payload: ExpenseUpdateDTO) {
  return http.put<ExpenseResponseDTO>(`${BASE}/${id}`, { body: payload });
}

export function deleteExpense(id: number | string) {
  return http.delete<void>(`${BASE}/${id}`);
}
