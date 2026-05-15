"use client";

import { useAuth } from "@/contexts/authContext";
import { AppRole, getHomePathForRole, isAppRole, ROLE_COOKIE_NAME } from "@/lib/authRoles";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  role?: AppRole;
}

function readRoleCookie(): AppRole | null {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie.match(
    new RegExp(`(?:^|; )${ROLE_COOKIE_NAME}=([^;]*)`),
  );

  const value = match ? decodeURIComponent(match[1]) : null;
  return isAppRole(value) ? value : null;
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { session, loading, profile } = useAuth();
  const router = useRouter();
  const currentRole = profile?.role ?? readRoleCookie();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
      return;
    }

    if (!loading && session && role && currentRole && currentRole !== role) {
      router.replace(getHomePathForRole(currentRole));
    }
  }, [session, loading, router, role, currentRole]);

  if (loading) return <div>Loading...</div>;
  if (!session) return null;

  if (role && currentRole && currentRole !== role) {
    return null;
  }

  return <>{children}</>;
}
