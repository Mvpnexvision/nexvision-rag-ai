"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link"; // In-add ko 'to para sa client-side routing
// Make sure this path is correct based on your file structure
import ragLogo from "../../resources/rag-logoName.png";
import { supabase } from "@/lib/supabaseClient";
import { debugLog } from "@/utils/logger";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/contexts/authContext";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("redirect") ?? undefined;
  const { showToast } = useToast();
  const { session, loading: authLoading, profile } = useAuth();
  const [role, setRole] = useState<"owner" | "admin">("owner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && session) {
      const roleFromProfile = profile?.role;
      const defaultTarget =
        roleFromProfile === "superadmin" ? "/dashboard_admin" : "/dashboard";
      router.replace(redirectTo ?? defaultTarget);
    }
  }, [authLoading, session, redirectTo, router, profile]);

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

      // Log current session after sign in
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

      // Fetch backend profile to confirm who we are logged in as
      if (accessToken) {
        // set cookie so middleware recognizes auth on next navigation
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
            showToast({
              title: "Signed in",
              message: "Signed in successfully",
              type: "success",
            });
            const backendRole = profileBody?.role;
            const defaultTarget =
              backendRole === "superadmin" ? "/dashboard_admin" : "/dashboard";
            const target = redirectTo ?? defaultTarget;
            router.replace(target);
            return; // stop further navigation below
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
      // fallback navigation if /auth/me didn't redirect earlier
      const roleFromProfile = profile?.role;
      const defaultTarget =
        roleFromProfile === "superadmin" ? "/dashboard_admin" : "/dashboard";
      const target = redirectTo ?? defaultTarget;
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

  const isOwner = role === "owner";

  return (
    // Static background gradient na lang, hindi na magbabago
    <div className="min-h-screen flex items-center justify-center px-4 bg-linear-to-br from-[#122F35] to-[#081518]">
      <div className="bg-[#141414] p-8 sm:p-12 rounded-xl shadow-2xl w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Image
            src={ragLogo}
            alt="DocuAI Logo"
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
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full p-3 border border-gray-600 bg-[#1e1e1e] text-white rounded-md text-sm focus:outline-none focus:border-white transition-colors"
            />
          </div>

          {error && <div className="mb-5 text-sm text-red-400">{error}</div>}

          {/* Fixed height (h-6) para hindi magalaw yung login button pag nawala yung link */}
          <div className="flex justify-end mb-6 text-sm h-6">
            {isOwner && (
              // Pinalitan ko yung <a> tag ng <Link> component
              <Link
                href="/register"
                className="hover:underline transition-colors text-gray-400 hover:text-white"
              >
                Don&apos;t have an account?
              </Link>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0DBBC4] text-white hover:bg-[#0aa3ab] px-5 py-3 rounded-md text-sm font-medium transition-colors"
          >
            {loading ? "Signing in..." : "Log In"}
          </button>
        </form>

        {/* Role Selection Buttons */}
        <div className="mt-8 pt-6 border-t border-gray-700 flex gap-4">
          <button
            type="button"
            onClick={() => {
              debugLog("AUTH", "Role select: admin");
              setRole("admin");
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors border ${
              role === "admin"
                ? "bg-[#0DBBC4] text-white border-[#0DBBC4]"
                : "bg-transparent border-gray-500 text-gray-400 hover:text-white hover:border-gray-400"
            }`}
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => {
              debugLog("AUTH", "Role select: owner");
              setRole("owner");
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors border ${
              role === "owner"
                ? "bg-[#0DBBC4] text-white border-[#0DBBC4]"
                : "bg-transparent border-gray-500 text-gray-400 hover:text-white hover:border-gray-400"
            }`}
          >
            Company Owner
          </button>
        </div>
      </div>
    </div>
  );
}
