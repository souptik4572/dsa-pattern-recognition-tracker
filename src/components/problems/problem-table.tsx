import Link from "next/link";
import { StatusSelect } from "@/components/status-select";
import { DifficultyBadge, TierBadge } from "@/components/ui/badges";
import { cn } from "@/lib/cn";
import type { SheetRow } from "@/server/sheet";
import { SolutionLinks } from "./solution-links";

const th = "px-2 py-2.5 font-semibold";

export function ProblemTable({ rows, showPattern = true, caption }: { rows: SheetRow[]; showPattern?: boolean; caption: string }) {
  return (
    <div className="overflow-x-auto rounded border border-rule bg-card">
      <table className={cn("w-full border-collapse text-sm", showPattern ? "min-w-[860px]" : "min-w-[680px]")}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-rule text-left font-mono text-[11px] tracking-[0.1em] text-ink-3 uppercase">
            <th scope="col" className={cn(th, "pl-4")}>
              Status
            </th>
            <th scope="col" className={th}>
              #
            </th>
            <th scope="col" className={th}>
              Problem
            </th>
            {showPattern && (
              <th scope="col" className={th}>
                Pattern
              </th>
            )}
            <th scope="col" className={th}>
              Level
            </th>
            <th scope="col" className={th}>
              Tier
            </th>
            <th scope="col" className={cn(th, "pr-4")}>
              Solution
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.slotId} className="border-b border-rule-soft last:border-b-0 hover:bg-card-hover">
              <td className="py-2 pr-2 pl-4">
                <StatusSelect slotId={row.slotId} status={row.status} problemTitle={row.problem.title} />
              </td>
              <td className="px-2 py-2 font-mono text-xs text-ink-3 tabular-nums">{row.problem.id}</td>
              <td className="px-2 py-2">
                <a
                  href={row.problem.leetcodeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("font-medium hover:text-accent hover:underline", row.status === "SOLVED_CLEAN" && "text-ink-3")}
                >
                  {row.problem.title}
                </a>
              </td>
              {showPattern && (
                <td className="max-w-[18rem] px-2 py-2">
                  <Link
                    href={`/patterns/${row.pattern.slug}`}
                    title={row.pattern.name}
                    className="block truncate text-ink-2 hover:text-accent"
                  >
                    <span className="font-mono text-xs font-semibold text-accent">{row.pattern.id}</span> {row.pattern.name}
                  </Link>
                  <span className="block truncate text-xs text-ink-3">{row.pattern.familyName}</span>
                </td>
              )}
              <td className="px-2 py-2">
                <DifficultyBadge difficulty={row.problem.difficulty} />
              </td>
              <td className="px-2 py-2">
                <TierBadge tier={row.tier} />
              </td>
              <td className="py-2 pr-4 pl-2">
                <SolutionLinks problem={row.problem} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
