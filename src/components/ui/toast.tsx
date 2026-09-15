"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "danger";
type Toast = { id: number; message: string; tone: Tone };
type ShowToast = (message: string, tone?: Tone) => void;

const ToastContext = createContext<ShowToast>(() => {});

export function Toaster({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const show = useCallback<ShowToast>((message, tone = "neutral") => {
    const id = ++nextId.current;
    setToasts((current) => [...current.slice(-2), { id, message, tone }]);
    setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4000);
  }, []);

  return (
    <ToastContext value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "max-w-md rounded-[3px] px-4 py-2.5 font-mono text-xs shadow-lg",
              toast.tone === "danger" ? "bg-danger text-card" : "bg-ink text-card",
            )}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext>
  );
}

export function useToast(): ShowToast {
  return useContext(ToastContext);
}
