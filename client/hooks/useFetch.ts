"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import axios, { AxiosRequestConfig, AxiosError } from "axios";
import { supabase } from "@/lib/supabaseClient";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

interface UseFetchOptions {
  auth?: boolean;
}

interface UseFetchReturn {
  loading: boolean;
  error: string | null;
  get: <T = unknown>(path: string, config?: AxiosRequestConfig) => Promise<T>;
  post: <T = unknown>(
    path: string,
    body?: unknown,
    config?: AxiosRequestConfig,
  ) => Promise<T>;
  patch: <T = unknown>(
    path: string,
    body?: unknown,
    config?: AxiosRequestConfig,
  ) => Promise<T>;
  del: <T = unknown>(path: string, config?: AxiosRequestConfig) => Promise<T>;
}

export function useFetch({
  auth = true,
}: UseFetchOptions = {}): UseFetchReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const request = useCallback(
    async <T = unknown>(
      method: "GET" | "POST" | "PATCH" | "DELETE",
      path: string,
      body?: unknown,
      config: AxiosRequestConfig = {},
    ): Promise<T> => {
      if (isMounted.current) setLoading(true);
      if (isMounted.current) setError(null);

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(config.headers as Record<string, string>),
        };

        if (auth) {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session?.access_token) {
            throw new Error("Not authenticated. Please log in.");
          }

          headers["Authorization"] = `Bearer ${session.access_token}`;
        }

        const response = await axios.request<T>({
          method,
          url: `${BASE_URL}${path}`,
          data: body,
          ...config,
          headers,
        });

        return response.data;
      } catch (err) {
        const axiosErr = err as AxiosError<{ detail?: string }>;
        const message =
          axiosErr.response?.data?.detail ??
          axiosErr.message ??
          "An unexpected error occurred.";

        if (isMounted.current) setError(message);
        throw new Error(message);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    },
    [auth],
  );

  const get = useCallback(
    <T = unknown>(path: string, config?: AxiosRequestConfig) =>
      request<T>("GET", path, undefined, config),
    [request],
  );

  const post = useCallback(
    <T = unknown>(path: string, body?: unknown, config?: AxiosRequestConfig) =>
      request<T>("POST", path, body, config),
    [request],
  );

  const patch = useCallback(
    <T = unknown>(path: string, body?: unknown, config?: AxiosRequestConfig) =>
      request<T>("PATCH", path, body, config),
    [request],
  );

  const del = useCallback(
    <T = unknown>(path: string, config?: AxiosRequestConfig) =>
      request<T>("DELETE", path, undefined, config),
    [request],
  );

  return { loading, error, get, post, patch, del };
}
