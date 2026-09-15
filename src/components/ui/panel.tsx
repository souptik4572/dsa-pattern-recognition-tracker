import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Panel({
  title,
  description,
  action,
  className,
  bodyClassName,
  children,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("rounded border border-rule bg-card", className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-rule px-4 py-3 sm:px-5">
          <div className="min-w-0">
            {title && <h2 className="font-mono text-xs font-semibold tracking-[0.12em] text-ink-3 uppercase">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-ink-2">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn("p-4 sm:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function Eyebrow({ className, children }: { className?: string; children: ReactNode }) {
  return <p className={cn("font-mono text-[11px] tracking-[0.18em] text-ink-3 uppercase", className)}>{children}</p>;
}
