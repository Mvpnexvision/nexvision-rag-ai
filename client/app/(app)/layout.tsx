"use client";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
