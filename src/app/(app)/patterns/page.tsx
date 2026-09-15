import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { PatternOpenProvider, PatternPanel } from "@/components/patterns/pattern-accordion";
import { PatternFilters } from "@/components/patterns/pattern-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PendingRegion, UrlStateProvider } from "@/components/url-state";
import { PATTERN_VIEWS } from "@/lib/patterns/views";
import { firstParam, type RawSearchParams } from "@/lib/search-param";
import { parseSheetParams } from "@/lib/sheet/search-params";
import { requireUser } from "@/server/auth";
import { getCatalog, getPatternSections } from "@/server/sheet";

export const metadata: Metadata = { title: "Patterns" };

const PATTERN_ID = /^\d{1,2}\.\d{1,2}$/;

// A search that narrows the list to this many patterns or fewer opens them all, so matches are visible at once.
const AUTO_OPEN_LIMIT = 12;

const pageSchema = z.object({
  show: z.enum(PATTERN_VIEWS).catch("all"),
  // Patterns to open on arrival, e.g. ?open=1.1 from a link on the dashboard or the sheet.
  open: z
    .string()
    .max(200)
    .catch("")
    .transform((value) => value.split(",").filter((id) => PATTERN_ID.test(id)).slice(0, 20)),
});

export default async function PatternsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const user = await requireUser();
  const raw = await searchParams;
  const { q, family, difficulty, tier, status } = parseSheetParams(raw);
  const { show, open } = pageSchema.parse({ show: firstParam(raw.show), open: firstParam(raw.open) });

  const [catalog, sections] = await Promise.all([
    getCatalog(),
    getPatternSections(user.id, { q, family, difficulty, tier, status, view: show }),
  ]);

  const filtered = Boolean(q || difficulty || tier || status);
  const patternIds = sections.flatMap((section) => section.patterns.map((pattern) => pattern.id));
  const matchingProblems = sections.reduce(
    (sum, section) => sum + section.patterns.reduce((count, pattern) => count + pattern.rows.length, 0),
    0,
  );
  const initiallyOpen = q && patternIds.length <= AUTO_OPEN_LIMIT ? patternIds : open;

  return (
    <UrlStateProvider>
      <PageHeader
        eyebrow="Patterns"
        title="Patterns by family"
        description="Open a pattern to see how to recognise it and work through its problems. Filters apply to the problems inside every pattern."
      />

      <PatternOpenProvider patternIds={patternIds} initiallyOpen={initiallyOpen} resetKey={q}>
        <PatternFilters
          filters={{ q, family, difficulty, tier, status, view: show }}
          families={catalog.map(({ id, name }) => ({ id, name }))}
        />

        <PendingRegion>
          <p className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
            <span>
              <b className="text-ink tabular-nums">{patternIds.length}</b> patterns
            </span>
            {filtered && (
              <span>
                <b className="text-ink tabular-nums">{matchingProblems}</b> matching problems
              </span>
            )}
          </p>

          {sections.length === 0 ? (
            <div className="mt-3">
              <EmptyState title="Nothing matches those filters">
                <Link href="/patterns" className="text-accent hover:underline">
                  Clear all filters
                </Link>
              </EmptyState>
            </div>
          ) : (
            sections.map((section) => (
              <section key={section.id} aria-labelledby={`family-${section.id}`} className="mt-8">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-ink pb-2">
                  <span className="font-mono text-2xl font-bold tracking-tight text-accent">{section.id}</span>
                  <h2 id={`family-${section.id}`} className="flex-1 text-lg font-semibold">
                    {section.name}
                  </h2>
                  <span className="font-mono text-xs text-ink-3 tabular-nums">
                    {section.counts.solved}/{section.counts.total} solved · {section.counts.pending} pending
                  </span>
                </div>
                <p className="mt-2 max-w-3xl text-sm text-ink-2">{section.why}</p>
                <div className="mt-3 space-y-2">
                  {section.patterns.map((pattern) => (
                    <PatternPanel key={pattern.id} pattern={pattern} filtered={filtered} />
                  ))}
                </div>
              </section>
            ))
          )}
        </PendingRegion>
      </PatternOpenProvider>
    </UrlStateProvider>
  );
}
