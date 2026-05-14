"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

export interface UserProfile {
  id: string;
  company_id: string;
  name: string;
  email: string;
  role: "superadmin" | "admin";
  status: "active" | "inactive";
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

function syncAuthCookie(accessToken: string | null | undefined) {
  try {
    if (accessToken) {
      document.cookie = `sb-access-token=${accessToken}; path=/; max-age=86400`;
    } else {
      document.cookie = `sb-access-token=; path=/; max-age=0`;
    }
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(accessToken: string): Promise<void> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        const data: UserProfile = await res.json();
        setProfile(data);
        return;
      }

      setProfile(null);
    } catch {
      setProfile(null);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      syncAuthCookie(data.session?.access_token);

      if (data.session?.access_token) {
        await fetchProfile(data.session.access_token);
      }

      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      syncAuthCookie(nextSession?.access_token);

      if (event === "SIGNED_IN" && nextSession?.access_token) {
        await fetchProfile(nextSession.access_token);
      }

      if (event === "SIGNED_OUT") {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const router = useRouter();
  const { showToast } = useToast();

  async function signOut() {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (err) {
      // ignore
    }

    // clear the simple cookie we set for middleware
    syncAuthCookie(null);

    try {
      const projectRef =
        process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0];
      if (projectRef) {
        document.cookie = `sb-${projectRef}-auth-token=; path=/; max-age=0`;
      }
    } catch {}

    setSession(null);
    setUser(null);
    setProfile(null);

    try {
      showToast({
        title: "Signed out",
        message: "You have been signed out",
        type: "info",
      });
    } catch {}

    try {
      router.replace("/login");
    } catch {}
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
