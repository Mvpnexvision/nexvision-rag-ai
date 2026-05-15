"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ragLogo from "../../resources/rag-logoName.png";
import { supabase } from "@/lib/supabaseClient";
import { debugLog } from "@/utils/logger";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/contexts/authContext";
import { getHomePathForRole, getSafeRedirectTarget, isAppRole, ROLE_COOKIE_NAME } from "@/lib/authRoles";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("redirect") ?? undefined;
  const { showToast } = useToast();
  const { session, loading: authLoading, profile } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && session) {
      const roleFromProfile = profile?.role;
      const defaultTarget = getHomePathForRole(roleFromProfile);
      const target =
        redirectTo && isAppRole(roleFromProfile)
          ? getSafeRedirectTarget(redirectTo, roleFromProfile)
          : defaultTarget;
      router.replace(target);
    }
  }, [authLoading, session, redirectTo, router, profile]);

  function syncRoleCookie(role: string | null | undefined) {
    try {
      if (isAppRole(role)) {
        document.cookie = `${ROLE_COOKIE_NAME}=${role}; path=/; max-age=86400`;
      } else {
        document.cookie = `${ROLE_COOKIE_NAME}=; path=/; max-age=0`;
      }
    } catch {}
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    debugLog("AUTH", `Login start for ${email}`);

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      debugLog("AUTH", `signIn response: ${JSON.stringify(data)}`);

      if (signInError) {
        debugLog("AUTH", `Login failed: ${signInError.message}`);
        setError(signInError.message);
        showToast({
          title: "Login failed",
          message: signInError.message,
          type: "error",
        });
        return;
      }

      let accessToken: string | undefined;
      try {
        const session = await supabase.auth.getSession();
        debugLog("AUTH", `session after signIn: ${JSON.stringify(session)}`);
        accessToken = session?.data?.session?.access_token ?? undefined;
      } catch (sErr) {
        debugLog(
          "AUTH",
          `session fetch after signIn error: ${sErr instanceof Error ? sErr.message : String(sErr)}`,
        );
      }

      if (accessToken) {
        try {
          document.cookie = `sb-access-token=${accessToken}; path=/; max-age=86400`;
        } catch {}
        try {
          const res = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          debugLog("AUTH", `/auth/me -> status=${res.status}`);
          if (res.ok) {
            const profileBody = await res.json();
            debugLog(
              "AUTH",
              `/auth/me -> profile=${JSON.stringify(profileBody)}`,
            );
            syncRoleCookie(profileBody?.role);
            showToast({
              title: "Signed in",
              message: "Signed in successfully",
              type: "success",
            });
            const backendRole = profileBody?.role;
            const defaultTarget = getHomePathForRole(backendRole);
            const target =
              redirectTo && isAppRole(backendRole)
                ? getSafeRedirectTarget(redirectTo, backendRole)
                : defaultTarget;
            router.replace(target);
            return;
          } else {
            showToast({
              title: "Signed in",
              message: `Backend /auth/me returned ${res.status}`,
              type: "info",
            });
          }
        } catch (fErr) {
          debugLog(
            "AUTH",
            `fetch /auth/me error: ${fErr instanceof Error ? fErr.message : String(fErr)}`,
          );
          showToast({
            title: "Signed in",
            message: "Signed in but /auth/me failed",
            type: "info",
          });
        }
      }

      debugLog("AUTH", "Login success");
      const roleFromProfile = profile?.role;
      const defaultTarget = getHomePathForRole(roleFromProfile);
      const target =
        redirectTo && isAppRole(roleFromProfile)
          ? getSafeRedirectTarget(redirectTo, roleFromProfile)
          : defaultTarget;
      router.replace(target);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed.";
      debugLog("AUTH", `Login error: ${message}`);
      setError(message);
      showToast({ title: "Login error", message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-linear-to-br from-[#122F35] to-[#081518]">
      <div className="bg-[#141414] p-8 sm:p-12 rounded-xl shadow-2xl w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Image
            src={ragLogo}
            alt="NexVision RAG AI Logo"
            width={200}
            height={200}
            className="w-32 sm:w-40 md:w-48 h-auto object-contain"
            priority
          />
        </div>

        <form onSubmit={handleLogin}>
          <div className="mb-5">
            <label
              className="block text-sm font-medium mb-2 text-white"
              htmlFor="email"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="name@company.com"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full p-3 border border-gray-600 bg-[#1e1e1e] text-white rounded-md text-sm focus:outline-none focus:border-white transition-colors"
            />
          </div>
          <div className="mb-5">
            <label
              className="block text-sm font-medium mb-2 text-white"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full p-3 pr-10 border border-gray-600 bg-[#1e1e1e] text-white rounded-md text-sm focus:outline-none focus:border-white transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0 1 12 19c-5.523 0-10-4.477-10-10a9.97 9.97 0 0 1 1.175-4.125M3 3l18 18" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <div className="mb-5 text-sm text-red-400">{error}</div>}

          <div className="flex justify-end mb-6 text-sm h-6">
            <Link
              href="/register"
              className="hover:underline transition-colors text-gray-400 hover:text-white"
            >
              Don&apos;t have an account?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0DBBC4] text-white hover:bg-[#0aa3ab] px-5 py-3 rounded-md text-sm font-medium transition-colors"
          >
            {loading ? "Signing in..." : "Log In"}
          </button>
        </form>
      </div>
    </div>
  );
}
