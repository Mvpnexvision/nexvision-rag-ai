import { NextRequest, NextResponse } from "next/server";
import { getHomePathForRole, getRequiredRoleForPath, isAppRole, ROLE_COOKIE_NAME } from "@/lib/authRoles";

const PUBLIC_PATHS = ["/login", "/register", "/"];
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function getRoleFromRequest(request: NextRequest): Promise<string | null> {
  const token =
    request.cookies.get("sb-access-token")?.value ??
    request.cookies.get(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0]}-auth-token`)?.value;

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (response.ok) {
      const profile = await response.json();
      if (isAppRole(profile?.role)) {
        return profile.role;
      }
    }
  } catch {}

  const roleCookie = request.cookies.get(ROLE_COOKIE_NAME)?.value;
  return isAppRole(roleCookie) ? roleCookie : null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const role = await getRoleFromRequest(request);
  const token =
    request.cookies.get("sb-access-token")?.value ??
    request.cookies.get(
      `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0]}-auth-token`,
    )?.value;
  const isPublic = PUBLIC_PATHS.includes(pathname);
  const requiredRole = getRequiredRoleForPath(pathname);

  if (requiredRole && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (requiredRole && role && role !== requiredRole) {
    return NextResponse.redirect(new URL(getHomePathForRole(role), request.url));
  }

  if (isPublic && token) {
    return NextResponse.redirect(new URL(getHomePathForRole(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
