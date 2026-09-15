import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[3px] border font-mono text-xs tracking-wide transition-colors disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "border-ink bg-ink text-card hover:bg-ink/85",
  secondary: "border-rule bg-card text-ink hover:border-ink",
  ghost: "border-transparent bg-transparent text-ink-2 hover:bg-card hover:text-ink",
  danger: "border-danger bg-danger text-card hover:bg-danger/85",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3",
  md: "h-9 px-4",
};

type StyleProps = { variant?: Variant; size?: Size };

export function buttonClasses({ variant = "primary", size = "md", className }: StyleProps & { className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({ variant, size, className, type = "button", ...props }: ComponentProps<"button"> & StyleProps) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...props} />;
}

export function ButtonLink({ variant, size, className, ...props }: ComponentProps<typeof Link> & StyleProps) {
  return <Link className={buttonClasses({ variant, size, className })} {...props} />;
}
