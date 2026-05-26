import { http } from '../http';
import type {
  BudgetItemBeneficiaryAssignRequestDTO,
  BudgetItemRequestDTO,
  BudgetItemResponseDTO,
  BudgetItemUpdateDTO,
  PageResponseDTO,
} from '../types';

const BASE = '/budget-item';

export interface ListBudgetItemsParams {
  page?: number;
  size?: number;
  categoryId?: number;
  projectId?: number;
  projectCompanyId?: number;
}

export function listBudgetItems(params: ListBudgetItemsParams = {}) {
  return http.get<PageResponseDTO<BudgetItemResponseDTO>>(BASE, {
    query: {
      page: params.page ?? 0,
      size: params.size ?? 20,
      categoryId: params.categoryId,
      projectId: params.projectId,
      projectCompanyId: params.projectCompanyId,
    },
  });
}

export function getBudgetItemById(id: number | string) {
  return http.get<BudgetItemResponseDTO>(`${BASE}/${id}`);
}

export function createBudgetItem(payload: BudgetItemRequestDTO) {
  return http.post<BudgetItemResponseDTO>(BASE, { body: payload });
}

export function updateBudgetItem(id: number | string, payload: BudgetItemUpdateDTO) {
  return http.put<BudgetItemResponseDTO>(`${BASE}/${id}`, { body: payload });
}

export function deleteBudgetItem(id: number | string) {
  return http.delete<void>(`${BASE}/${id}`);
}

export function assignBudgetItemBeneficiary(
  id: number | string,
  payload: BudgetItemBeneficiaryAssignRequestDTO
) {
  return http.put<void>(`${BASE}/${id}/beneficiary`, { body: payload });
}

export function removeBudgetItemBeneficiary(id: number | string) {
  return http.delete<void>(`${BASE}/${id}/beneficiary`);
}
