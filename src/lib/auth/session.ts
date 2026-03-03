export type SessionRole = "superadmin" | "admin" | "analista" | "estagiario";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: SessionRole;
}

interface AuthMeResponse {
  isAuthenticated: boolean;
  user?: SessionUser;
}

export async function fetchCurrentUser(): Promise<SessionUser | null> {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as AuthMeResponse;
  if (!payload.isAuthenticated || !payload.user) {
    return null;
  }

  return payload.user;
}

export function toSessionUserId(user: SessionUser | null): number | null {
  if (!user) {
    return null;
  }
  const parsedId = Number(user.id);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return null;
  }
  return parsedId;
}

export async function requireCurrentUserId(): Promise<number> {
  const userId = toSessionUserId(await fetchCurrentUser());
  if (!userId) {
    throw new Error("Sessao invalida. Faca login novamente.");
  }
  return userId;
}

export function isSuperAdmin(user: SessionUser | null): boolean {
  return user?.role === "superadmin";
}

export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === "superadmin" || user?.role === "admin";
}
