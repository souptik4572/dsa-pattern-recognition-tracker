import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const control =
  "w-full rounded-[3px] border border-rule bg-card px-3 text-sm text-ink placeholder:text-ink-3 focus-visible:border-accent disabled:opacity-60 aria-invalid:border-danger";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, "h-9", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(control, "h-9 pr-8", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "py-2 font-mono text-xs", className)} {...props} />;
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn("mb-1.5 block font-mono text-[11px] font-semibold tracking-[0.12em] text-ink-3 uppercase", className)}
      {...props}
    />
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}

export function FormAlert({ tone = "danger", children }: { tone?: "danger" | "success"; children: ReactNode }) {
  return (
    <p
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "rounded-[3px] border px-3 py-2 text-sm",
        tone === "danger" ? "border-danger/40 bg-danger-soft text-danger" : "border-status-clean/40 bg-status-clean/10 text-success",
      )}
    >
      {children}
    </p>
  );
}
