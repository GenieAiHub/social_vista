export interface LeadPermissions {
  canViewLeads: boolean;
  canCreateLeads: boolean;
  canEditLeads: boolean;
  canDeleteLeads: boolean;
  canAssignLeads: boolean;
  canEmailLeads: boolean;
  canManageSEO: boolean;
  canManageBlog: boolean;
}

export type PermissionKey = keyof LeadPermissions;

export interface AdminUser {
  id: number;
  name: string;
  username: string;
  email?: string | null;
  role: string;
  roleId?: number | null;
  roleName?: string | null;
  permissions?: LeadPermissions;
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

/**
 * Whether the current user holds a specific lead permission. Owners always
 * pass; everyone else is checked against their resolved permission flags.
 */
export function hasPermission(key: PermissionKey): boolean {
  const user = getStoredUser();
  if (!user) return false;
  if (user.role === "owner") return true;
  return Boolean(user.permissions?.[key]);
}
