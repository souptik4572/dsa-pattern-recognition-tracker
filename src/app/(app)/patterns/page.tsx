import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { PATTERN_VIEWS, PatternFilters, type PatternView } from "@/components/patterns/pattern-filters";
import { StatusBar } from "@/components/progress/status-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PendingRegion, UrlStateProvider } from "@/components/url-state";
import { emptyCounts, percent, type ProgressCounts } from "@/lib/progress/stats";
import { firstParam, type RawSearchParams } from "@/lib/search-param";
import { requireUser } from "@/server/auth";
import { getCatalog, getProgressStats } from "@/server/sheet";

export const metadata: Metadata = { title: "Patterns" };

const querySchema = z.object({
  q: z.string().trim().max(100).catch(""),
  family: z.string().regex(/^\d{2}$/).optional().catch(undefined),
  show: z.enum(PATTERN_VIEWS).catch("all"),
});

function matchesView(counts: ProgressCounts, view: PatternView): boolean {
  switch (view) {
    case "all":
      return true;
    case "not-started":
      return counts.solved === 0;
    case "in-progress":
      return counts.solved > 0 && counts.solved < counts.total;
    case "complete":
      return counts.total > 0 && counts.solved === counts.total;
    case "revisit":
      return counts.revisit > 0;
  }
}

export default async function PatternsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const user = await requireUser();
  const raw = await searchParams;
  const { q, family, show } = querySchema.parse({
    q: firstParam(raw.q),
    family: firstParam(raw.family),
    show: firstParam(raw.show),
  });
  const [catalog, stats] = await Promise.all([getCatalog(), getProgressStats(user.id)]);

  const needle = q.toLowerCase();
  const sections = catalog
    .filter((entry) => !family || entry.id === family)
    .map((entry) => ({
      family: entry,
      counts: stats.byFamily[entry.id] ?? emptyCounts(),
      patterns: entry.patterns
        .map((pattern) => ({ ...pattern, counts: stats.byPattern[pattern.id] ?? emptyCounts() }))
        .filter(
          (pattern) =>
            matchesView(pattern.counts, show) &&
            (!needle || `${pattern.id} ${pattern.name} ${pattern.trigger}`.toLowerCase().includes(needle)),
        ),
    }))
    .filter((section) => section.patterns.length > 0);

  const shown = sections.reduce((sum, section) => sum + section.patterns.length, 0);

  return (
    <UrlStateProvider>
      <PageHeader
        eyebrow="Patterns"
        title="Patterns by family"
        description="Solved, pending and revisit counts for each of the named patterns. Open a pattern for its trigger, template and problems."
      />
      <PatternFilters q={q} family={family} view={show} families={catalog.map(({ id, name }) => ({ id, name }))} />

      <PendingRegion>
        <p className="mt-6 text-sm text-ink-2">
          Showing <b className="text-ink tabular-nums">{shown}</b> patterns
        </p>

        {sections.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="No patterns match">
              <Link href="/patterns" className="text-accent hover:underline">
                Reset filters
              </Link>
            </EmptyState>
          </div>
        ) : (
          sections.map(({ family: entry, counts, patterns }) => (
            <section key={entry.id} aria-labelledby={`family-${entry.id}`} className="mt-8">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-ink pb-2">
                <span className="font-mono text-2xl font-bold tracking-tight text-accent">{entry.id}</span>
                <h2 id={`family-${entry.id}`} className="flex-1 text-lg font-semibold">
                  {entry.name}
                </h2>
                <span className="font-mono text-xs text-ink-3 tabular-nums">
                  {counts.solved}/{counts.total} solved · {counts.pending} pending
                </span>
              </div>
              <p className="mt-2 max-w-3xl text-sm text-ink-2">{entry.why}</p>

              <div className="mt-3 overflow-x-auto rounded border border-rule bg-card">
                <table className="w-full min-w-[720px] text-sm">
                  <caption className="sr-only">Patterns in {entry.name}</caption>
                  <thead>
                    <tr className="border-b border-rule text-left font-mono text-[11px] tracking-[0.1em] text-ink-3 uppercase">
                      <th scope="col" className="py-2.5 pr-2 pl-4 font-semibold">
                        Pattern
                      </th>
                      <th scope="col" className="px-2 py-2.5 text-right font-semibold">
                        Problems
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
                      <th scope="col" className="w-1/4 py-2.5 pr-4 pl-2 font-semibold">
                        Progress
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {patterns.map((pattern) => (
                      <tr key={pattern.id} className="border-b border-rule-soft last:border-b-0 hover:bg-card-hover">
                        <td className="max-w-md py-2.5 pr-2 pl-4">
                          <Link href={`/patterns/${pattern.slug}`} className="font-medium hover:text-accent hover:underline">
                            <span className="font-mono text-xs font-bold text-accent">{pattern.id}</span> {pattern.name}
                          </Link>
                          <p className="line-clamp-1 text-xs text-ink-3" title={pattern.trigger}>
                            {pattern.trigger}
                          </p>
                        </td>
                        <td className="px-2 py-2.5 text-right tabular-nums">{pattern.counts.total}</td>
                        <td className="px-2 py-2.5 text-right tabular-nums">{pattern.counts.solved}</td>
                        <td className="px-2 py-2.5 text-right tabular-nums">{pattern.counts.pending}</td>
                        <td className="px-2 py-2.5 text-right tabular-nums">{pattern.counts.revisit}</td>
                        <td className="py-2.5 pr-4 pl-2">
                          <div className="flex items-center gap-2">
                            <StatusBar counts={pattern.counts} size="sm" className="flex-1" />
                            <span className="w-9 text-right text-xs text-ink-2 tabular-nums">
                              {percent(pattern.counts.solved, pattern.counts.total)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))
        )}
      </PendingRegion>
    </UrlStateProvider>
  );
}
