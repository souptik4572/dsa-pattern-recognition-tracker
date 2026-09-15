import type { Metadata } from "next";
import Link from "next/link";
import { Pagination } from "@/components/pagination";
import { ProblemTable } from "@/components/problems/problem-table";
import { PageSizeSelect } from "@/components/sheet/page-size-select";
import { SheetFilters } from "@/components/sheet/sheet-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PendingRegion, UrlStateProvider } from "@/components/url-state";
import type { RawSearchParams } from "@/lib/search-param";
import { hasActiveFilters, parseSheetParams, sheetHref } from "@/lib/sheet/search-params";
import { requireUser } from "@/server/auth";
import { getCatalog, getSheetPage } from "@/server/sheet";

export const metadata: Metadata = { title: "Sheet" };

export default async function SheetPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const user = await requireUser();
  const params = parseSheetParams(await searchParams);
  const [catalog, result] = await Promise.all([getCatalog(), getSheetPage(user.id, params)]);

  const current = { ...params, page: result.page };
  const filtered = hasActiveFilters(params);
  const families = catalog.map((family) => ({
    id: family.id,
    name: family.name,
    patterns: family.patterns.map((pattern) => ({ id: pattern.id, name: pattern.name })),
  }));

  return (
    <UrlStateProvider>
      <PageHeader
        eyebrow="The sheet"
        title="All problems"
        description="Every problem slot in sheet order. Filter, sort and set your status inline. Changes save instantly."
      />

      <SheetFilters params={params} families={families} />

      <PendingRegion>
        <p className="mt-6 mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
          <span>
            <b className="text-ink tabular-nums">{result.total}</b> {filtered ? "matching problems" : "problems"}
          </span>
          <span>
            <b className="text-ink tabular-nums">{result.solved}</b> solved
          </span>
          <span>
            <b className="text-ink tabular-nums">{result.total - result.solved}</b> pending
          </span>
        </p>

        {result.rows.length > 0 ? (
          <ProblemTable rows={result.rows} caption="Problems matching the current filters" />
        ) : (
          <EmptyState title="Nothing matches those filters">
            <Link href="/sheet" className="text-accent hover:underline">
              Clear all filters
            </Link>
          </EmptyState>
        )}

        {result.total > 0 && (
          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            pageSize={params.pageSize}
            noun="problems"
            hrefForPage={(page) => sheetHref(current, { page })}
            pageSizeControl={<PageSizeSelect value={params.pageSize} />}
          />
        )}
      </PendingRegion>
    </UrlStateProvider>
  );
}
