export type SessionRole = "superadmin" | "admin" | "analista" | "estagiario";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: SessionRole;
  avatarUrl?: string | null;
  avatarImageUrl?: string | null;
}

interface AuthMeResponse {
  isAuthenticated: boolean;
  user?: SessionUser;
}

let redirectingToLogin = false;

function getCurrentPathWithQuery(): string {
  if (typeof window === "undefined") {
    return "/";
  }

  return `${window.location.pathname}${window.location.search}`;
}

export async function redirectToLogin(nextPath?: string | null): Promise<void> {
  if (typeof window === "undefined" || redirectingToLogin) {
    return;
  }

  const currentPath = nextPath || getCurrentPathWithQuery();
  if (currentPath === "/login" || currentPath.startsWith("/login?")) {
    return;
  }

  redirectingToLogin = true;

  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Ignore logout cleanup failures and continue redirecting.
  }

  const loginUrl = new URL("/login", window.location.origin);
  if (currentPath.startsWith("/")) {
    loginUrl.searchParams.set("next", currentPath);
  }

  window.location.replace(loginUrl.toString());
}

export async function fetchCurrentUser(): Promise<SessionUser | null> {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 401) {
      await redirectToLogin();
    }
    return null;
  }

  const payload = (await response.json()) as AuthMeResponse;
  if (!payload.isAuthenticated || !payload.user) {
    await redirectToLogin();
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
    throw new Error("Sessão inválida. Faça login novamente.");
  }
  return userId;
}

export function isSuperAdmin(user: SessionUser | null): boolean {
  return user?.role === "superadmin";
}

export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === "superadmin" || user?.role === "admin";
}

export function isIntern(user: SessionUser | null): boolean {
  return user?.role === "estagiario";
}

export function canManageAdminArea(user: SessionUser | null): boolean {
  return isAdmin(user);
}

export function canManageInvites(user: SessionUser | null): boolean {
  return isAdmin(user);
}

export function canManageAdminAudit(user: SessionUser | null): boolean {
  return isAdmin(user);
}

export function canViewContractAudit(user: SessionUser | null): boolean {
  return Boolean(user) && !isIntern(user);
}

export function canEditContractCore(user: SessionUser | null): boolean {
  return Boolean(user);
}

export function canManageContractChildren(user: SessionUser | null): boolean {
  return Boolean(user) && !isIntern(user);
}
