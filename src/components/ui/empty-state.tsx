import type { ReactNode } from "react";

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded border border-dashed border-rule bg-card px-6 py-12 text-center">
      <p className="font-mono text-sm font-semibold">{title}</p>
      {children && <div className="mt-2 text-sm text-ink-2">{children}</div>}
    </div>
  );
}
