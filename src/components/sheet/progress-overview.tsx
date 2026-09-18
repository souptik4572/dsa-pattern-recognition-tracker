import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { BreakdownList } from "@/components/progress/breakdown-list";
import { MasteryGrid, type MasteryRow } from "@/components/progress/mastery-grid";
import { NextUpCard } from "@/components/progress/next-up-card";
import { StatTile } from "@/components/progress/stat-tile";
import { StatusBar, StatusLegend } from "@/components/progress/status-bar";
import { StatusDot } from "@/components/progress/status-dot";
import { Panel } from "@/components/ui/panel";
import { percent, type ProgressStats } from "@/lib/progress/stats";
import { DIFFICULTIES, DIFFICULTY_LABEL, TIER_LABEL, TIERS } from "@/lib/sheet/meta";
import type { SheetLinkParams } from "@/lib/sheet/search-params";
import type { NextUp } from "@/server/sheet";

const subheading = "mb-3 font-mono text-[11px] font-semibold tracking-[0.12em] text-ink-3 uppercase";

export type ProgressScope = {
  /** True when filters narrow the page; every number below then covers only matching problems. */
  active: boolean;
  /** One label per active filter, e.g. ["Easy or Hard", "Core"]. */
  labels: string[];
  /** Clears every filter, keeping the current view. */
  clearHref: string;
  /** Problem slots in the whole sheet, shown for context when filtered. */
  sheetTotal: number;
};

/** Progress for the problems in scope: the whole sheet, or whatever the filters leave. */
export function ProgressOverview({
  stats,
  mastery,
  nextUp,
  scope,
  filterHref,
}: {
  stats: ProgressStats;
  mastery: MasteryRow[];
  nextUp: NextUp;
  scope: ProgressScope;
  /** Builds a link that filters the problems below and scrolls down to them. */
  filterHref: (overrides: Partial<SheetLinkParams>) => string;
}) {
  const { overall } = stats;
  const inScope = mastery.flatMap((row) => row.patterns).filter((pattern) => pattern.inScope);
  const outOfScope = mastery.reduce((sum, row) => sum + row.patterns.length, 0) - inScope.length;
  const complete = inScope.filter((pattern) => pattern.level === 4).length;
  const started = inScope.filter((pattern) => pattern.level > 0 && pattern.level < 4).length;

  // When filtered, drop breakdown rows with nothing in scope (e.g. Easy and Medium while filtering Hard).
  const difficultyRows = DIFFICULTIES.filter((difficulty) => !scope.active || stats.byDifficulty[difficulty].total > 0);
  const tierRows = TIERS.filter((tier) => !scope.active || stats.byTier[tier].total > 0);

  return (
    <section aria-label="Your progress" className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title={scope.active ? "Your progress · filtered" : "Your progress"}
          description={scope.active ? scope.labels.join(" · ") : undefined}
          action={
            scope.active ? (
              <Link href={scope.clearHref} scroll={false} className="font-mono text-xs text-accent hover:underline">
                Show all
              </Link>
            ) : undefined
          }
          className="lg:col-span-2"
        >
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div>
              <p className="text-5xl font-semibold tracking-tight">{percent(overall.solved, overall.total)}%</p>
              <p className="mt-1 text-sm text-ink-2">
                <b className="text-ink">{overall.solved}</b> of {overall.total}{" "}
                {scope.active ? "matching problems" : "problem slots"} solved
                {scope.active && <span className="text-ink-3"> · {scope.sheetTotal} in the whole sheet</span>}
              </p>
            </div>
            <p className="max-w-xs text-xs text-ink-3">
              Solved means you got there without help, slowly or cleanly. Needed-help problems stay pending until you
              solve them unaided.
            </p>
          </div>
          <StatusBar counts={overall} size="lg" className="mt-5" />
          <StatusLegend counts={overall} className="mt-4" />

          {overall.total === 0 ? (
            <p className="mt-6 border-t border-rule pt-5 text-sm text-ink-2">No problems match your filters.</p>
          ) : (
            <div className="mt-6 grid gap-6 border-t border-rule pt-5 sm:grid-cols-2">
              <div>
                <h3 className={subheading}>By difficulty</h3>
                <BreakdownList
                  rows={difficultyRows.map((difficulty) => ({
                    key: difficulty,
                    label: DIFFICULTY_LABEL[difficulty],
                    href: filterHref({ difficulty: [difficulty] }),
                    counts: stats.byDifficulty[difficulty],
                  }))}
                />
              </div>
              <div>
                <h3 className={subheading}>By tier</h3>
                <BreakdownList
                  rows={tierRows.map((tier) => ({
                    key: tier,
                    label: TIER_LABEL[tier],
                    href: filterHref({ tier: [tier] }),
                    counts: stats.byTier[tier],
                  }))}
                />
              </div>
            </div>
          )}
        </Panel>

        <NextUpCard nextUp={nextUp} scoped={scope.active} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Solved"
          marker={<StatusDot status="SOLVED_CLEAN" />}
          value={overall.solved}
          detail={`${overall.byStatus.SOLVED_CLEAN} clean · ${overall.byStatus.SOLVED_SLOW} slow`}
          href={filterHref({ status: ["SOLVED"] })}
        />
        <StatTile
          label="Pending"
          marker={<StatusDot status="NOT_STARTED" />}
          value={overall.pending}
          detail={`${overall.byStatus.NOT_STARTED} not started · ${overall.byStatus.NEEDED_HELP} needed help`}
          href={filterHref({ status: ["PENDING"] })}
        />
        <StatTile
          label="Due for revisit"
          marker={<StatusDot status="NEEDED_HELP" />}
          value={overall.revisit}
          detail="Needed help or solved slowly"
          href={filterHref({ status: ["REVISIT"] })}
        />
        <StatTile
          label="Patterns complete"
          value={
            <>
              {complete}
              <span className="text-lg text-ink-3">/{inScope.length}</span>
            </>
          }
          detail={`${started} in progress`}
          href={filterHref({ view: "patterns", show: "complete" })}
        />
      </div>

      <details className="group rounded border border-rule bg-card">
        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-card-hover sm:px-5 [&::-webkit-details-marker]:hidden">
          <ChevronRight aria-hidden className="size-4 shrink-0 text-ink-3 transition-transform group-open:rotate-90" />
          <span className="font-mono text-xs font-semibold tracking-[0.12em] text-ink-3 uppercase">Pattern mastery map</span>
          <span className="text-sm text-ink-2">
            {complete} complete · {started} in progress · {inScope.length - complete - started} nothing solved yet
            {outOfScope > 0 && ` · ${outOfScope} with no matching problems`}
          </span>
        </summary>
        <div className="border-t border-rule p-4 sm:p-5">
          <MasteryGrid rows={mastery} />
        </div>
      </details>
    </section>
  );
}
