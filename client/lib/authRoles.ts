export type AppRole = "admin" | "superadmin";

export const ROLE_COOKIE_NAME = "sb-user-role";

export const ROLE_HOME_PATHS: Record<AppRole, string> = {
  admin: "/dashboard",
  superadmin: "/dashboard_admin",
};

export function isAppRole(role: unknown): role is AppRole {
  return role === "admin" || role === "superadmin";
}

export function getHomePathForRole(role: unknown): string {
  return isAppRole(role) ? ROLE_HOME_PATHS[role] : ROLE_HOME_PATHS.admin;
}

export function getRequiredRoleForPath(pathname: string): AppRole | null {
  if (pathname.startsWith("/dashboard_admin") || pathname.startsWith("/manage_admin")) {
    return "superadmin";
  }

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/documents") ||
    pathname.startsWith("/recommendations")
  ) {
    return "admin";
  }

  return null;
}

export function isPathAllowedForRole(pathname: string, role: unknown): boolean {
  const requiredRole = getRequiredRoleForPath(pathname);

  if (!requiredRole) {
    return true;
  }

  return requiredRole === role;
}

export function getSafeRedirectTarget(pathname: string, role: unknown): string {
  return isPathAllowedForRole(pathname, role) ? pathname : getHomePathForRole(role);
}