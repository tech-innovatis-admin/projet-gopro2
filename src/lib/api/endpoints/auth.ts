import { http } from '../http';
import type {
  AdminUserResponseDTO,
  AdminUserUpdateRequestDTO,
  AllowedRegistrationCreateRequestDTO,
  AllowedRegistrationReissueRequestDTO,
  AllowedRegistrationResponseDTO,
  AllowedRegistrationStatusEnum,
  AllowedRegistrationValidationResponseDTO,
  AuditLogResponseDTO,
  AuthNotificationResponseDTO,
  AuthLoginRequestDTO,
  AuthLoginResponseDTO,
  AuthForgotPasswordRequestDTO,
  AuthForgotPasswordResponseDTO,
  AuthResetPasswordRequestDTO,
  AuthResetPasswordResponseDTO,
  AuthUserResponseDTO,
  PageResponseDTO,
  RegisterCompleteRequestDTO,
  RegisterCompleteResponseDTO,
  AuditScopeEnum,
  UserLookupResponseDTO,
  UserRoleEnum,
  UserStatusEnum,
} from '../types';

export interface ListAuditParams {
  scope?: AuditScopeEnum;
  action?: string;
  entityType?: string;
  actorUserId?: number;
  actorName?: string;
  search?: string;
  contractId?: number;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export interface ListMyAuditParams {
  page?: number;
  size?: number;
}

export interface ListMyNotificationsParams {
  size?: number;
}

export interface ListUsersParams {
  role?: UserRoleEnum;
  status?: UserStatusEnum;
  page?: number;
  size?: number;
}

export interface ListInvitesParams {
  status?: AllowedRegistrationStatusEnum;
  page?: number;
  size?: number;
}

export function login(payload: AuthLoginRequestDTO) {
  return http.post<AuthLoginResponseDTO>('/auth/login', { body: payload });
}

export function forgotPassword(payload: AuthForgotPasswordRequestDTO) {
  return http.post<AuthForgotPasswordResponseDTO>('/auth/forgot-password', {
    body: payload,
  });
}

export function resetPassword(payload: AuthResetPasswordRequestDTO) {
  return http.post<AuthResetPasswordResponseDTO>('/auth/reset-password', {
    body: payload,
  });
}

export function me() {
  return http.get<AuthUserResponseDTO>('/auth/me');
}

export function uploadMyAvatar(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  return http.post<AuthUserResponseDTO>('/auth/me/avatar', {
    body: formData,
  });
}

export function createAllowedRegistration(payload: AllowedRegistrationCreateRequestDTO) {
  return http.post<AllowedRegistrationResponseDTO>('/admin/allowed-registrations', { body: payload });
}

export function listAllowedRegistrations(params: ListInvitesParams = {}) {
  return http.get<PageResponseDTO<AllowedRegistrationResponseDTO>>('/admin/allowed-registrations', {
    query: {
      status: params.status,
      page: params.page ?? 0,
      size: params.size ?? 20,
    },
  });
}

export function cancelAllowedRegistration(id: number | string) {
  return http.patch<AllowedRegistrationResponseDTO>(`/admin/allowed-registrations/${id}/cancel`);
}

export function reissueAllowedRegistration(id: number | string, payload: AllowedRegistrationReissueRequestDTO = {}) {
  return http.post<AllowedRegistrationResponseDTO>(`/admin/allowed-registrations/${id}/reissue`, {
    body: payload,
  });
}

export function validateRegistrationToken(token: string) {
  return http.get<AllowedRegistrationValidationResponseDTO>('/register/validate', {
    query: { token },
  });
}

export function completeRegistration(payload: RegisterCompleteRequestDTO) {
  return http.post<RegisterCompleteResponseDTO>('/register/complete', { body: payload });
}

export function listAuditLogs(params: ListAuditParams = {}) {
  return http.get<PageResponseDTO<AuditLogResponseDTO>>('/admin/audit', {
    query: {
      scope: params.scope,
      action: params.action,
      entityType: params.entityType,
      actorUserId: params.actorUserId,
      actorName: params.actorName,
      search: params.search,
      contractId: params.contractId,
      from: params.from,
      to: params.to,
      page: params.page ?? 0,
      size: params.size ?? 10,
    },
  });
}

export function listContractAuditLogs(params: ListAuditParams = {}) {
  return http.get<PageResponseDTO<AuditLogResponseDTO>>('/audit-log', {
    query: {
      scope: params.scope,
      action: params.action,
      entityType: params.entityType,
      actorUserId: params.actorUserId,
      actorName: params.actorName,
      search: params.search,
      contractId: params.contractId,
      from: params.from,
      to: params.to,
      page: params.page ?? 0,
      size: params.size ?? 10,
    },
  });
}

export function listMyAuditLogs(params: ListMyAuditParams = {}) {
  return http.get<PageResponseDTO<AuditLogResponseDTO>>('/auth/me/audit', {
    query: {
      page: params.page ?? 0,
      size: params.size ?? 4,
    },
  });
}

export function listMyNotifications(params: ListMyNotificationsParams = {}) {
  return http.get<AuthNotificationResponseDTO[]>('/auth/me/notifications', {
    query: {
      size: params.size ?? 20,
    },
  });
}

export function listAdminUsers(params: ListUsersParams = {}) {
  return http.get<PageResponseDTO<AdminUserResponseDTO>>('/admin/users', {
    query: {
      role: params.role,
      status: params.status,
      page: params.page ?? 0,
      size: params.size ?? 20,
    },
  });
}

export function lookupUsersByIds(ids: number[]) {
  const normalizedIds = Array.from(
    new Set(
      ids
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0)
    )
  );

  if (normalizedIds.length === 0) {
    return Promise.resolve([] as UserLookupResponseDTO[]);
  }

  return http.get<UserLookupResponseDTO[]>('/users/lookup', {
    query: {
      ids: normalizedIds.join(','),
    },
  });
}

export function updateAdminUser(id: number | string, payload: AdminUserUpdateRequestDTO) {
  return http.patch<AdminUserResponseDTO>(`/admin/users/${id}`, {
    body: payload,
  });
}
