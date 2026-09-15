import Link from "next/link";
import type { ProgressCounts } from "@/lib/progress/stats";
import { StatusBar } from "./status-bar";

export function BreakdownList({
  rows,
}: {
  rows: { key: string; label: string; href: string; counts: ProgressCounts }[];
}) {
  return (
    <ul className="space-y-4">
      {rows.map((row) => (
        <li key={row.key}>
          <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
            <Link href={row.href} className="font-medium hover:text-accent hover:underline">
              {row.label}
            </Link>
            <span className="text-ink-2 tabular-nums">
              <b className="text-ink">{row.counts.solved}</b> / {row.counts.total} solved · {row.counts.pending} pending
            </span>
          </div>
          <StatusBar counts={row.counts} />
        </li>
      ))}
    </ul>
  );
}
