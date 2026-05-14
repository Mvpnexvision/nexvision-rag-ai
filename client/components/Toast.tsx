"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

type ToastType = "success" | "error" | "info";
type Toast = {
  id: number;
  title?: string;
  message: string;
  type?: ToastType;
};

type ToastContextValue = {
  showToast: (t: { title?: string; message: string; type?: ToastType }) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function showToast({
    title,
    message,
    type = "info",
  }: {
    title?: string;
    message: string;
    type?: ToastType;
  }) {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const toast: Toast = { id, title, message, type };
    setToasts((s) => [toast, ...s]);
    setTimeout(() => setToasts((s) => s.filter((t) => t.id !== id)), 4500);
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`max-w-xs w-full px-4 py-3 rounded shadow-lg text-white transform transition-all duration-200 ease-out ${
              t.type === "success"
                ? "bg-emerald-500"
                : t.type === "error"
                  ? "bg-red-500"
                  : "bg-sky-500"
            }`}
          >
            {t.title && (
              <div className="font-semibold text-sm mb-1">{t.title}</div>
            )}
            <div className="text-sm">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export default ToastProvider;
