import { http } from '../http';
import type {
  BudgetTransferRequestDTO,
  BudgetTransferResponseDTO,
  BudgetTransferUpdateDTO,
  PageResponseDTO,
} from '../types';

const BASE = '/budget-transfers';

export interface ListBudgetTransfersParams {
  page?: number;
  size?: number;
  projectId?: number;
}

export function listBudgetTransfers(params: ListBudgetTransfersParams = {}) {
  return http.get<PageResponseDTO<BudgetTransferResponseDTO>>(BASE, {
    query: {
      page: params.page ?? 0,
      size: params.size ?? 20,
      projectId: params.projectId,
    },
  });
}

export function getBudgetTransferById(id: number | string) {
  return http.get<BudgetTransferResponseDTO>(`${BASE}/${id}`);
}

export function createBudgetTransfer(payload: BudgetTransferRequestDTO) {
  return http.post<BudgetTransferResponseDTO>(`${BASE}/rubrica`, { body: payload });
}

export function updateBudgetTransfer(
  id: number | string,
  payload: BudgetTransferUpdateDTO
) {
  return http.put<BudgetTransferResponseDTO>(`${BASE}/${id}`, { body: payload });
}

export function deleteBudgetTransfer(id: number | string) {
  return http.delete<void>(`${BASE}/${id}`);
}
