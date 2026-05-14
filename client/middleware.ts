import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/documents", "/settings", "/chat"];
const PUBLIC_PATHS = ["/login", "/register", "/"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const projectRef =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0];
  const token =
    request.cookies.get("sb-access-token")?.value ??
    request.cookies.get(`sb-${projectRef}-auth-token`)?.value;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublic && token) {
    const target = pathname === "/login" ? "/dashboard" : "/dashboard";
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
