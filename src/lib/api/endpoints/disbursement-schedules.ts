import { http } from '../http';
import type {
  DisbursementScheduleRequestDTO,
  DisbursementScheduleResponseDTO,
  DisbursementScheduleUpdateDTO,
  PageResponseDTO,
} from '../types';

const BASE = '/disbursement-schedule';

export interface ListDisbursementSchedulesParams {
  page?: number;
  size?: number;
  projectId?: number;
}

export function listDisbursementSchedules(
  params: ListDisbursementSchedulesParams = {}
) {
  return http.get<PageResponseDTO<DisbursementScheduleResponseDTO>>(BASE, {
    query: {
      page: params.page ?? 0,
      size: params.size ?? 20,
      projectId: params.projectId,
    },
  });
}

export function getDisbursementScheduleById(id: number | string) {
  return http.get<DisbursementScheduleResponseDTO>(`${BASE}/${id}`);
}

export function createDisbursementSchedule(
  payload: DisbursementScheduleRequestDTO
) {
  return http.post<DisbursementScheduleResponseDTO>(BASE, { body: payload });
}

export function updateDisbursementSchedule(
  id: number | string,
  payload: DisbursementScheduleUpdateDTO
) {
  return http.put<DisbursementScheduleResponseDTO>(`${BASE}/${id}`, {
    body: payload,
  });
}

export function deleteDisbursementSchedule(id: number | string) {
  return http.delete<void>(`${BASE}/${id}`);
}
