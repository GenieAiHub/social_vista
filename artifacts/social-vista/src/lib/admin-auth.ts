export interface AdminUser {
  id: number;
  name: string;
  username: string;
  email?: string | null;
  role: string;
  active?: boolean;
  createdAt?: string;
}

const TOKEN_KEY = "sv_admin_token";
const USER_KEY = "sv_admin_user";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AdminUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: AdminUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function isOwner(): boolean {
  return getStoredUser()?.role === "owner";
}
