import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { SolutionLinks } from "@/components/problems/solution-links";
import { StatusSelect } from "@/components/status-select";
import { DifficultyBadge, TierBadge } from "@/components/ui/badges";
import { Panel } from "@/components/ui/panel";
import { patternHref } from "@/lib/sheet/ids";
import type { NextUp } from "@/server/sheet";

const REASON = {
  revisit: "Due for revisit: you needed help last time",
  core: "Next untouched core problem",
  any: "Next untouched problem",
} as const;

export function NextUpCard({ nextUp }: { nextUp: NextUp }) {
  if (!nextUp) {
    return (
      <Panel title="Next up">
        <p className="text-sm text-ink-2">Every problem has a status. Go run a contest.</p>
      </Panel>
    );
  }

  const { row, reason } = nextUp;
  return (
    <Panel title="Next up" description={REASON[reason]}>
      <p className="font-mono text-xs text-ink-3">#{row.problem.id}</p>
      <a
        href={row.problem.leetcodeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-0.5 inline-flex items-start gap-1.5 text-lg leading-snug font-semibold hover:text-accent hover:underline"
      >
        {row.problem.title}
        <ExternalLink aria-hidden className="mt-1.5 size-3.5 shrink-0 text-ink-3" />
      </a>
      <Link href={patternHref(row.pattern.id)} className="mt-1 block text-sm text-accent hover:underline">
        {row.pattern.id} {row.pattern.name}
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <DifficultyBadge difficulty={row.problem.difficulty} />
        <TierBadge tier={row.tier} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
        <StatusSelect slotId={row.slotId} status={row.status} problemTitle={row.problem.title} />
        <SolutionLinks problem={row.problem} />
      </div>
    </Panel>
  );
}
