"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { debugLog } from "@/utils/logger";
import { useToast } from "@/components/Toast";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function Register() {
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-linear-to-br from-[#122F35] to-[#081518]">
      {/* Naka max-h-[90vh] para hindi lumagpas sa screen height, tapos flex column */}
      <div className="bg-[#141414] p-8 sm:p-10 rounded-xl shadow-2xl w-full max-w-md my-8 flex flex-col max-h-[90vh]">
        {/* Header Section (Fixed sa taas) */}
        <div className="text-center mb-6 shrink-0">
          <h2 className="text-2xl font-medium mb-2 text-white">
            Create an account
          </h2>
          <p className="text-gray-400 text-sm">
            Join us to start managing your documents with AI.
          </p>
        </div>

        <form
          onSubmit={handleRegister}
          className="flex flex-col overflow-hidden"
        >
          {/* Scrollable Container para sa Inputs */}
          {/* Nilagyan ng minimalist custom webkit scrollbar classes */}
          <div
            className="flex-1 overflow-y-auto pr-3 space-y-5 
            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-gray-700
            [&::-webkit-scrollbar-thumb]:rounded-full
            hover:[&::-webkit-scrollbar-thumb]:bg-gray-500"
          >
            <div>
              <label
                className="block text-sm font-medium mb-2 text-white"
                htmlFor="name"
              >
                Full Name
              </label>
              <input
                type="text"
                id="name"
                placeholder="John Doe"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full p-3 border border-gray-600 bg-[#1e1e1e] text-white rounded-md text-sm focus:outline-none focus:border-white transition-colors"
              />
            </div>

            <div>
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

            {/* Dinagdag ko ang pb-2 para may konting space sa pinaka-ilalim ng scroll */}
            <div className="pb-2">
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
          </div>

          {error && <div className="mt-4 text-sm text-red-400">{error}</div>}

          {/* Action Section (Fixed sa ilalim) */}
          <div className="shrink-0 mt-6 pt-2 border-t border-[#1e1e1e]">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0DBBC4] text-white hover:bg-[#0aa3ab] px-5 py-3 rounded-md text-sm font-medium transition-colors mb-6 mt-4"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>

            <p className="text-center text-sm text-gray-400 pb-2">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-white font-medium hover:underline transition-colors"
              >
                Log in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
