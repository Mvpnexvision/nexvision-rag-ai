<<<<<<< Updated upstream
﻿"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { debugLog } from "@/utils/logger";
import { useToast } from "@/components/Toast";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("redirect") ?? undefined;
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    debugLog("AUTH", `Signup start for ${email}`);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      debugLog("AUTH", `signUp response: ${JSON.stringify(data)}`);

      if (signUpError) {
        debugLog("AUTH", `Signup failed: ${signUpError.message}`);
        setError(signUpError.message);
        showToast({
          title: "Signup failed",
          message: signUpError.message,
          type: "error",
        });
        return;
      }

      // Try to log session info after signup (may be null if email confirm required)
      let accessToken: string | undefined;
      try {
        const session = await supabase.auth.getSession();
        debugLog("AUTH", `session after signUp: ${JSON.stringify(session)}`);
        accessToken = session?.data?.session?.access_token ?? undefined;
      } catch (sErr) {
        debugLog(
          "AUTH",
          `session fetch after signUp error: ${sErr instanceof Error ? sErr.message : String(sErr)}`,
        );
      }

      if (accessToken) {
        try {
          // set cookie so middleware recognizes auth if we navigate into protected pages
          try {
            document.cookie = `sb-access-token=${accessToken}; path=/; max-age=86400`;
          } catch {}

          const res = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const body = await res.text();
          debugLog("AUTH", `/auth/me -> status=${res.status} body=${body}`);
          if (res.ok) {
            showToast({
              title: "Signed up",
              message: "Account created",
              type: "success",
            });
          } else {
            showToast({
              title: "Signed up",
              message: `Backend returned ${res.status}`,
              type: "info",
            });
          }
        } catch (fErr) {
          debugLog(
            "AUTH",
            `fetch /auth/me error: ${fErr instanceof Error ? fErr.message : String(fErr)}`,
          );
          showToast({
            title: "Signed up",
            message: "Account created (no backend profile)",
            type: "info",
          });
        }
      }

      debugLog("AUTH", "Signup success");
      const target = redirectTo ?? "/login";
      router.replace(target);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign up failed.";
      debugLog("AUTH", `Signup error: ${message}`);
      setError(message);
    } finally {
      setLoading(false);
    }
  };
=======
import { Suspense } from "react";
import RegisterClient from "./register-client";
>>>>>>> Stashed changes

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterClient />
    </Suspense>
  );
}

export default function Register() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-linear-to-br from-[#122F35] to-[#081518]" />
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
