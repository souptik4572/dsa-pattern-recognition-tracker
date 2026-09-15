import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BreakdownList } from "@/components/progress/breakdown-list";
import { MasteryGrid, type MasteryRow } from "@/components/progress/mastery-grid";
import { StatTile } from "@/components/progress/stat-tile";
import { StatusBar, StatusLegend } from "@/components/progress/status-bar";
import { StatusDot } from "@/components/progress/status-dot";
import { SolutionLinks } from "@/components/problems/solution-links";
import { StatusSelect } from "@/components/status-select";
import { DifficultyBadge, TierBadge } from "@/components/ui/badges";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { formatRelativeTime } from "@/lib/format";
import { emptyCounts, masteryLevel, percent } from "@/lib/progress/stats";
import { STATUS_LABEL } from "@/lib/progress/status";
import { patternHref } from "@/lib/sheet/ids";
import { DIFFICULTIES, DIFFICULTY_LABEL, TIER_LABEL, TIERS } from "@/lib/sheet/meta";
import { sheetHref, parseSheetParams } from "@/lib/sheet/search-params";
import { requireUser } from "@/server/auth";
import { getCatalog, getNextUp, getProgressStats, getRecentActivity, type NextUp } from "@/server/sheet";

export const metadata: Metadata = { title: "Dashboard" };

const NEXT_UP_REASON = {
  revisit: "Due for revisit: you needed help last time",
  core: "Next untouched core problem",
  any: "Next untouched problem",
} as const;

export default async function DashboardPage() {
  const user = await requireUser();
  const [stats, catalog, nextUp, recent] = await Promise.all([
    getProgressStats(user.id),
    getCatalog(),
    getNextUp(user.id),
    getRecentActivity(user.id),
  ]);

  const { overall } = stats;
  const defaults = parseSheetParams({});
  const masteryRows: MasteryRow[] = catalog.map((family) => ({
    id: family.id,
    name: family.name,
    patterns: family.patterns.map((pattern) => {
      const counts = stats.byPattern[pattern.id] ?? emptyCounts();
      return {
        id: pattern.id,
        slug: pattern.slug,
        name: pattern.name,
        solved: counts.solved,
        pending: counts.pending,
        total: counts.total,
        level: masteryLevel(counts),
      };
    }),
  }));
  const allPatterns = masteryRows.flatMap((row) => row.patterns);
  const patternsComplete = allPatterns.filter((pattern) => pattern.level === 4).length;
  const patternsStarted = allPatterns.filter((pattern) => pattern.level > 0 && pattern.level < 4).length;

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="Solved and pending counts across every pattern, family, tier and difficulty."
        actions={
          <>
            <ButtonLink href="/drill" variant="secondary">
              Recognition drill
            </ButtonLink>
            <ButtonLink href="/sheet">Open the sheet</ButtonLink>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Overall progress" className="lg:col-span-2">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div>
              <p className="text-5xl font-semibold tracking-tight sm:text-6xl">{percent(overall.solved, overall.total)}%</p>
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
        </Panel>

        <NextUpPanel nextUp={nextUp} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Solved"
          marker={<StatusDot status="SOLVED_CLEAN" />}
          value={overall.solved}
          detail={`${overall.byStatus.SOLVED_CLEAN} clean · ${overall.byStatus.SOLVED_SLOW} slow`}
          href={sheetHref(defaults, { status: "SOLVED" })}
        />
        <StatTile
          label="Pending"
          marker={<StatusDot status="NOT_STARTED" />}
          value={overall.pending}
          detail={`${overall.byStatus.NOT_STARTED} not started · ${overall.byStatus.NEEDED_HELP} needed help`}
          href={sheetHref(defaults, { status: "PENDING" })}
        />
        <StatTile
          label="Due for revisit"
          marker={<StatusDot status="NEEDED_HELP" />}
          value={overall.revisit}
          detail="Needed help or solved slowly"
          href={sheetHref(defaults, { status: "REVISIT" })}
        />
        <StatTile
          label="Patterns complete"
          value={
            <>
              {patternsComplete}
              <span className="text-lg text-ink-3">/{allPatterns.length}</span>
            </>
          }
          detail={`${patternsStarted} in progress`}
          href="/patterns?show=complete"
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Panel title="By tier">
          <BreakdownList
            rows={TIERS.map((tier) => ({
              key: tier,
              label: TIER_LABEL[tier],
              href: sheetHref(defaults, { tier }),
              counts: stats.byTier[tier],
            }))}
          />
        </Panel>
        <Panel title="By difficulty">
          <BreakdownList
            rows={DIFFICULTIES.map((difficulty) => ({
              key: difficulty,
              label: DIFFICULTY_LABEL[difficulty],
              href: sheetHref(defaults, { difficulty }),
              counts: stats.byDifficulty[difficulty],
            }))}
          />
        </Panel>
      </div>

      <Panel
        title="Pattern mastery"
        description="One cell per pattern, one row per family. Darker means more of the pattern is solved."
        action={
          <Link href="/patterns" className="font-mono text-xs text-accent hover:underline">
            All patterns →
          </Link>
        }
        className="mt-4"
      >
        <MasteryGrid rows={masteryRows} />
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="By family" className="lg:col-span-2" bodyClassName="p-0 sm:p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <caption className="sr-only">Progress by family</caption>
              <thead>
                <tr className="border-b border-rule text-left font-mono text-[11px] tracking-[0.1em] text-ink-3 uppercase">
                  <th scope="col" className="py-2.5 pr-2 pl-5 font-semibold">
                    Family
                  </th>
                  <th scope="col" className="px-2 py-2.5 text-right font-semibold">
                    Solved
                  </th>
                  <th scope="col" className="px-2 py-2.5 text-right font-semibold">
                    Pending
                  </th>
                  <th scope="col" className="px-2 py-2.5 text-right font-semibold">
                    Revisit
                  </th>
                  <th scope="col" className="py-2.5 pr-5 pl-2 font-semibold">
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody>
                {catalog.map((family) => {
                  const counts = stats.byFamily[family.id] ?? emptyCounts();
                  return (
                    <tr key={family.id} className="border-b border-rule-soft last:border-b-0">
                      <td className="py-2 pr-2 pl-5">
                        <Link href={`/patterns?family=${family.id}`} className="hover:text-accent hover:underline">
                          <span className="font-mono text-xs font-bold text-accent">{family.id}</span> {family.name}
                        </Link>
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">{counts.solved}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{counts.pending}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{counts.revisit}</td>
                      <td className="w-1/3 py-2 pr-5 pl-2">
                        <div className="flex items-center gap-2">
                          <StatusBar counts={counts} size="sm" className="flex-1" />
                          <span className="w-9 text-right text-xs text-ink-2 tabular-nums">
                            {percent(counts.solved, counts.total)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Recent activity">
          {recent.length === 0 ? (
            <p className="text-sm text-ink-2">No activity yet. Set a status on any problem and it shows up here.</p>
          ) : (
            <ul className="-my-2 divide-y divide-rule-soft">
              {recent.map((item) => (
                <li key={item.slotId} className="flex items-start gap-3 py-2.5">
                  <StatusDot status={item.status} className="mt-1" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.problem.title}</p>
                    <p className="truncate text-xs text-ink-3">
                      {STATUS_LABEL[item.status]} · {formatRelativeTime(item.updatedAt)} ·{" "}
                      <Link href={patternHref(item.pattern.id)} className="hover:text-accent">
                        {item.pattern.id} {item.pattern.name}
                      </Link>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function NextUpPanel({ nextUp }: { nextUp: NextUp }) {
  if (!nextUp) {
    return (
      <Panel title="Next up">
        <p className="text-sm text-ink-2">Every problem has a status. Go run a contest.</p>
      </Panel>
    );
  }

  const { row, reason } = nextUp;
  return (
    <Panel title="Next up" description={NEXT_UP_REASON[reason]}>
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
