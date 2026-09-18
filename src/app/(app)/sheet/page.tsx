import type { Metadata } from "next";
import Link from "next/link";
import { DrillDialog } from "@/components/drill/drill-dialog";
import { Pagination } from "@/components/pagination";
import { ExpandCollapseControls, PatternOpenProvider } from "@/components/patterns/pattern-accordion";
import { ProblemTable } from "@/components/problems/problem-table";
import type { MasteryRow } from "@/components/progress/mastery-grid";
import { PageSizeSelect } from "@/components/sheet/page-size-select";
import { PatternSections } from "@/components/sheet/pattern-sections";
import { ProgressOverview } from "@/components/sheet/progress-overview";
import { SheetToolbar } from "@/components/sheet/sheet-toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PendingRegion, UrlStateProvider } from "@/components/url-state";
import { emptyCounts, masteryLevel } from "@/lib/progress/stats";
import { firstParam, type RawSearchParams } from "@/lib/search-param";
import {
  countActiveFilters,
  parseSheetParams,
  parseSheetViewParams,
  sheetHref,
  type SheetLinkParams,
} from "@/lib/sheet/search-params";
import { requireUser } from "@/server/auth";
import {
  getCatalog,
  getDrillPatterns,
  getNextUp,
  getPatternSections,
  getProgressStats,
  getSheetPage,
} from "@/server/sheet";

export const metadata: Metadata = { title: "Pattern sheet" };

// A search that narrows the patterns view to this many patterns or fewer opens them all, so matches are visible at once.
const AUTO_OPEN_LIMIT = 12;

/**
 * The whole tracker in one place: progress, the drill, and every problem, either grouped under
 * expandable patterns or as one sortable table. Filters, view and paging all live in the URL.
 */
export default async function SheetPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const user = await requireUser();
  const raw = await searchParams;
  const params = parseSheetParams(raw);
  const { view, show, open } = parseSheetViewParams(raw);
  const { q, family, pattern, difficulty, tier, status } = params;

  const [catalog, stats, nextUp, drillPatterns, sections, list] = await Promise.all([
    getCatalog(),
    getProgressStats(user.id),
    getNextUp(user.id),
    getDrillPatterns(),
    view === "patterns" ? getPatternSections(user.id, { q, family, pattern, difficulty, tier, status, view: show }) : null,
    view === "list" ? getSheetPage(user.id, params) : null,
  ]);

  const mastery: MasteryRow[] = catalog.map((entry) => ({
    id: entry.id,
    name: entry.name,
    patterns: entry.patterns.map((item) => {
      const counts = stats.byPattern[item.id] ?? emptyCounts();
      return {
        id: item.id,
        slug: item.slug,
        name: item.name,
        solved: counts.solved,
        pending: counts.pending,
        total: counts.total,
        level: masteryLevel(counts),
      };
    }),
  }));

  const clean = parseSheetParams({});
  const shared: SheetLinkParams = { ...clean, q, family, pattern, difficulty, tier, status };
  const viewHrefs = {
    patterns: sheetHref({ ...shared, view: "patterns", show }),
    list: sheetHref({ ...shared, view: "list" }),
  };
  // Progress counts link to a filtered view of the problems below and scroll down to it.
  const filterHref = (overrides: Partial<SheetLinkParams>) => `${sheetHref({ ...clean, view }, overrides)}#problems`;
  const clearHref = sheetHref({ ...clean, view });

  const filtered = Boolean(q || pattern || difficulty || tier || status);
  const toolbar = {
    params,
    view,
    show,
    activeFilterCount: countActiveFilters(params, { view, show }),
    viewHrefs,
    families: catalog.map((entry) => ({
      id: entry.id,
      name: entry.name,
      patterns: entry.patterns.map((item) => ({ id: item.id, name: item.name })),
    })),
  };
  const patternCount = catalog.reduce((sum, entry) => sum + entry.patterns.length, 0);

  const empty = (
    <div className="mt-4">
      <EmptyState title="Nothing matches those filters">
        <Link href={clearHref} className="text-accent hover:underline">
          Clear all filters
        </Link>
      </EmptyState>
    </div>
  );

  return (
    <UrlStateProvider>
      <PageHeader
        eyebrow="The sheet"
        title="Pattern Recognition Sheet"
        description={`${patternCount} patterns in ${catalog.length} families, ${stats.overall.total} problem slots. Track by pattern, not by topic: read a statement and know what it is before you write a line.`}
        actions={
          <DrillDialog
            patterns={drillPatterns}
            families={catalog.map(({ id, name }) => ({ id, name }))}
            openOnArrival={firstParam(raw.drill) === "1"}
          />
        }
      />

      <ProgressOverview stats={stats} mastery={mastery} nextUp={nextUp} filterHref={filterHref} />

      <div className="mt-8">
        {sections && (
          <PatternOpenProvider
            patternIds={sections.flatMap((section) => section.patterns.map((item) => item.id))}
            initiallyOpen={
              q && sections.reduce((sum, section) => sum + section.patterns.length, 0) <= AUTO_OPEN_LIMIT
                ? sections.flatMap((section) => section.patterns.map((item) => item.id))
                : open
            }
            resetKey={`${q}|${open.join(",")}`}
          >
            <SheetToolbar {...toolbar} controls={<ExpandCollapseControls />} />
            <PendingRegion>
              <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
                <span>
                  <b className="text-ink tabular-nums">{sections.reduce((sum, section) => sum + section.patterns.length, 0)}</b>{" "}
                  patterns
                </span>
                {filtered && (
                  <span>
                    <b className="text-ink tabular-nums">
                      {sections.reduce(
                        (sum, section) => sum + section.patterns.reduce((count, item) => count + item.rows.length, 0),
                        0,
                      )}
                    </b>{" "}
                    matching problems
                  </span>
                )}
              </p>
              {sections.length === 0 ? empty : <PatternSections sections={sections} filtered={filtered} />}
            </PendingRegion>
          </PatternOpenProvider>
        )}

        {list && (
          <>
            <SheetToolbar {...toolbar} />
            <PendingRegion>
              <p className="mt-4 mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
                <span>
                  <b className="text-ink tabular-nums">{list.total}</b> {filtered || family ? "matching problems" : "problems"}
                </span>
                <span>
                  <b className="text-ink tabular-nums">{list.solved}</b> solved
                </span>
                <span>
                  <b className="text-ink tabular-nums">{list.total - list.solved}</b> pending
                </span>
              </p>
              {list.rows.length > 0 ? <ProblemTable rows={list.rows} caption="Problems matching the current filters" /> : empty}
              {list.total > 0 && (
                <Pagination
                  page={list.page}
                  pageCount={list.pageCount}
                  total={list.total}
                  pageSize={params.pageSize}
                  noun="problems"
                  hrefForPage={(page) => sheetHref({ ...params, view: "list" }, { page })}
                  pageSizeControl={<PageSizeSelect value={params.pageSize} />}
                />
              )}
            </PendingRegion>
          </>
        )}
      </div>
    </UrlStateProvider>
  );
}
