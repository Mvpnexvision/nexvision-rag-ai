"use client";

import { useAuth } from "@/contexts/authContext";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [session, loading, router]);

  if (loading) return <div>Loading...</div>;
  if (!session) return null;

  return <>{children}</>;
}
