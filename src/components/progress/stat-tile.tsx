import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function StatTile({
  label,
  value,
  detail,
  href,
  marker,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  href?: string;
  marker?: ReactNode;
}) {
  const body = (
    <>
      <p className="flex items-center gap-2 text-sm text-ink-2">
        {marker}
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      {detail && <p className="mt-1 text-xs text-ink-3">{detail}</p>}
    </>
  );

  const className = "block rounded border border-rule bg-card p-4 sm:p-5";
  return href ? (
    <Link href={href} className={cn(className, "transition-colors hover:border-ink-3")}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
