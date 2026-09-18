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
import { masteryLevel } from "@/lib/progress/stats";
import { firstParam, type RawSearchParams } from "@/lib/search-param";
import { describeFilters } from "@/lib/sheet/describe-filters";
import {
  countActiveFilters,
  parseSheetParams,
  parseSheetViewParams,
  sheetHref,
  type SheetLinkParams,
} from "@/lib/sheet/search-params";
import { requireUser } from "@/server/auth";
import { getCatalog, getDrillPatterns, getSheetData } from "@/server/sheet";

export const metadata: Metadata = { title: "Pattern sheet" };

// A search that narrows the patterns view to this many patterns or fewer opens them all, so matches are visible at once.
const AUTO_OPEN_LIMIT = 12;

/**
 * The whole tracker in one place: progress, the drill, and every problem, either grouped under
 * expandable patterns or as one sortable table. Filters, view and paging all live in the URL, and
 * every number on the page describes the problems the filters leave.
 */
export default async function SheetPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const user = await requireUser();
  const raw = await searchParams;
  const params = parseSheetParams(raw);
  const { view, show, open } = parseSheetViewParams(raw);
  const { q, family, pattern, difficulty, tier, status } = params;

  const [catalog, { stats, nextUp, sections, list }, drillPatterns] = await Promise.all([
    getCatalog(),
    getSheetData(user.id, params, { view, show }),
    getDrillPatterns(),
  ]);

  const mastery: MasteryRow[] = catalog.map((entry) => ({
    id: entry.id,
    name: entry.name,
    patterns: entry.patterns.map((item) => {
      // Patterns without problems in scope have no entry in the scoped stats.
      const counts = stats.byPattern[item.id];
      return {
        id: item.id,
        slug: item.slug,
        name: item.name,
        solved: counts?.solved ?? 0,
        pending: counts?.pending ?? 0,
        total: counts?.total ?? 0,
        level: counts ? masteryLevel(counts) : 0,
        inScope: Boolean(counts),
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

  const activeFilterCount = countActiveFilters(params, { view, show });
  const filtered = Boolean(q || pattern || difficulty.length > 0 || tier.length > 0 || status.length > 0);
  const patternCount = catalog.reduce((sum, entry) => sum + entry.patterns.length, 0);
  const sheetTotal = catalog.reduce((sum, entry) => sum + entry.patterns.reduce((count, item) => count + item.slotCount, 0), 0);
  const scope = {
    active: activeFilterCount > 0,
    labels: describeFilters(
      params,
      { view, show },
      {
        family: catalog.find((entry) => entry.id === family)?.name,
        pattern: catalog.flatMap((entry) => entry.patterns).find((item) => item.id === pattern)?.name,
      },
    ),
    clearHref,
    sheetTotal,
  };
  const toolbar = {
    params,
    view,
    show,
    activeFilterCount,
    viewHrefs,
    families: catalog.map((entry) => ({
      id: entry.id,
      name: entry.name,
      patterns: entry.patterns.map((item) => ({ id: item.id, name: item.name })),
    })),
  };

  const empty = (
    <div className="mt-4">
      <EmptyState title="Nothing matches those filters">
        <Link href={clearHref} className="text-accent hover:underline">
          Clear all filters
        </Link>
      </EmptyState>
    </div>
  );

  const listedPatternIds = sections?.flatMap((section) => section.patterns.map((item) => item.id)) ?? [];

  return (
    <UrlStateProvider>
      <PageHeader
        eyebrow="The sheet"
        title="Pattern Recognition Sheet"
        description={`${patternCount} patterns in ${catalog.length} families, ${sheetTotal} problem slots. Track by pattern, not by topic: read a statement and know what it is before you write a line.`}
        actions={
          <DrillDialog
            patterns={drillPatterns}
            families={catalog.map(({ id, name }) => ({ id, name }))}
            openOnArrival={firstParam(raw.drill) === "1"}
          />
        }
      />

      <PendingRegion>
        <ProgressOverview stats={stats} mastery={mastery} nextUp={nextUp} scope={scope} filterHref={filterHref} />
      </PendingRegion>

      <div className="mt-8">
        {sections && (
          <PatternOpenProvider
            patternIds={listedPatternIds}
            initiallyOpen={q && listedPatternIds.length <= AUTO_OPEN_LIMIT ? listedPatternIds : open}
            resetKey={`${q}|${open.join(",")}`}
          >
            <SheetToolbar {...toolbar} controls={<ExpandCollapseControls />} />
            <PendingRegion>
              <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
                <span>
                  <b className="text-ink tabular-nums">{listedPatternIds.length}</b> patterns
                </span>
                <span>
                  <b className="text-ink tabular-nums">{stats.overall.total}</b> {scope.active ? "matching problems" : "problems"}
                </span>
                <span>
                  <b className="text-ink tabular-nums">{stats.overall.solved}</b> solved
                </span>
                <span>
                  <b className="text-ink tabular-nums">{stats.overall.pending}</b> pending
                </span>
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
                  <b className="text-ink tabular-nums">{list.total}</b> {scope.active ? "matching problems" : "problems"}
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
