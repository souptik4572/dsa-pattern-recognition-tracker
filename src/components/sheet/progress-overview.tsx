import { ChevronRight } from "lucide-react";
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

/** Everything that used to be the dashboard, compact enough to sit above the problems. */
export function ProgressOverview({
  stats,
  mastery,
  nextUp,
  filterHref,
}: {
  stats: ProgressStats;
  mastery: MasteryRow[];
  nextUp: NextUp;
  /** Builds a link that filters the problems below and scrolls down to them. */
  filterHref: (overrides: Partial<SheetLinkParams>) => string;
}) {
  const { overall } = stats;
  const patterns = mastery.flatMap((row) => row.patterns);
  const complete = patterns.filter((pattern) => pattern.level === 4).length;
  const started = patterns.filter((pattern) => pattern.level > 0 && pattern.level < 4).length;

  return (
    <section aria-label="Your progress" className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Your progress" className="lg:col-span-2">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div>
              <p className="text-5xl font-semibold tracking-tight">{percent(overall.solved, overall.total)}%</p>
              <p className="mt-1 text-sm text-ink-2">
                <b className="text-ink">{overall.solved}</b> of {overall.total} problem slots solved
              </p>
            </div>
            <p className="max-w-xs text-xs text-ink-3">
              Solved means you got there without help, slowly or cleanly. Needed-help problems stay pending until you
              solve them unaided.
            </p>
          </div>
          <StatusBar counts={overall} size="lg" className="mt-5" />
          <StatusLegend counts={overall} className="mt-4" />

          <div className="mt-6 grid gap-6 border-t border-rule pt-5 sm:grid-cols-2">
            <div>
              <h3 className={subheading}>By difficulty</h3>
              <BreakdownList
                rows={DIFFICULTIES.map((difficulty) => ({
                  key: difficulty,
                  label: DIFFICULTY_LABEL[difficulty],
                  href: filterHref({ difficulty }),
                  counts: stats.byDifficulty[difficulty],
                }))}
              />
            </div>
            <div>
              <h3 className={subheading}>By tier</h3>
              <BreakdownList
                rows={TIERS.map((tier) => ({
                  key: tier,
                  label: TIER_LABEL[tier],
                  href: filterHref({ tier }),
                  counts: stats.byTier[tier],
                }))}
              />
            </div>
          </div>
        </Panel>

        <NextUpCard nextUp={nextUp} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Solved"
          marker={<StatusDot status="SOLVED_CLEAN" />}
          value={overall.solved}
          detail={`${overall.byStatus.SOLVED_CLEAN} clean · ${overall.byStatus.SOLVED_SLOW} slow`}
          href={filterHref({ status: "SOLVED" })}
        />
        <StatTile
          label="Pending"
          marker={<StatusDot status="NOT_STARTED" />}
          value={overall.pending}
          detail={`${overall.byStatus.NOT_STARTED} not started · ${overall.byStatus.NEEDED_HELP} needed help`}
          href={filterHref({ status: "PENDING" })}
        />
        <StatTile
          label="Due for revisit"
          marker={<StatusDot status="NEEDED_HELP" />}
          value={overall.revisit}
          detail="Needed help or solved slowly"
          href={filterHref({ status: "REVISIT" })}
        />
        <StatTile
          label="Patterns complete"
          value={
            <>
              {complete}
              <span className="text-lg text-ink-3">/{patterns.length}</span>
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
            {complete} complete · {started} in progress · {patterns.length - complete - started} nothing solved yet
          </span>
        </summary>
        <div className="border-t border-rule p-4 sm:p-5">
          <MasteryGrid rows={mastery} />
        </div>
      </details>
    </section>
  );
}
