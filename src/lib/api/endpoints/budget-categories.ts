import { http } from '../http';
import type {
  BudgetCategoryRequestDTO,
  BudgetCategoryResponseDTO,
  BudgetCategoryUpdateDTO,
  PageResponseDTO,
} from '../types';

const BASE = '/budget-categories';

export interface ListBudgetCategoriesParams {
  page?: number;
  size?: number;
  projectId?: number;
}

export function listBudgetCategories(params: ListBudgetCategoriesParams = {}) {
  return http.get<PageResponseDTO<BudgetCategoryResponseDTO>>(BASE, {
    query: {
      page: params.page ?? 0,
      size: params.size ?? 20,
      projectId: params.projectId,
    },
  });
}

export function getBudgetCategoryById(id: number | string) {
  return http.get<BudgetCategoryResponseDTO>(`${BASE}/${id}`);
}

export function createBudgetCategory(payload: BudgetCategoryRequestDTO) {
  return http.post<BudgetCategoryResponseDTO>(BASE, { body: payload });
}

export function updateBudgetCategory(
  id: number | string,
  payload: BudgetCategoryUpdateDTO
) {
  return http.put<BudgetCategoryResponseDTO>(`${BASE}/${id}`, { body: payload });
}

export function deleteBudgetCategory(id: number | string) {
  return http.delete<void>(`${BASE}/${id}`);
}
