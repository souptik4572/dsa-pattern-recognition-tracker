"use client";

import { ArrowDownWideNarrow, ArrowUpNarrowWide, List, ListTree } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ClearFiltersButton,
  DifficultyFilter,
  FamilyFilter,
  ProblemStatusFilter,
  TierFilter,
} from "@/components/filters/filter-selects";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { useUrlState } from "@/components/url-state";
import { cn } from "@/lib/cn";
import { PATTERN_VIEW_LABEL, PATTERN_VIEWS, type PatternView } from "@/lib/patterns/views";
import { SORT_KEYS, SORT_LABEL, type SheetParams, type SheetView } from "@/lib/sheet/search-params";

export type FilterFamily = { id: string; name: string; patterns: { id: string; name: string }[] };

// Clearing filters keeps the view, sorting and page size.
const CLEARABLE = ["q", "family", "pattern", "difficulty", "tier", "status", "show"];

/** The one set of controls for the sheet: view switch, search and every filter, bound to the URL. */
export function SheetToolbar({
  params,
  view,
  show,
  families,
  activeFilterCount,
  viewHrefs,
  controls,
}: {
  params: SheetParams;
  view: SheetView;
  show: PatternView;
  families: FilterFamily[];
  activeFilterCount: number;
  viewHrefs: Record<SheetView, string>;
  /** Extra controls for the current view, e.g. expand/collapse all. */
  controls?: ReactNode;
}) {
  const { navigate, isPending } = useUrlState();
  const patternGroups = params.family ? families.filter((family) => family.id === params.family) : families;

  return (
    <div id="problems" role="search" aria-label="Search and filter the sheet" className="scroll-mt-24 rounded border border-rule bg-card p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Sheet view" className="inline-flex rounded-[3px] border border-rule p-0.5">
          <ViewLink href={viewHrefs.patterns} active={view === "patterns"} icon={<ListTree aria-hidden className="size-3.5" />}>
            By pattern
          </ViewLink>
          <ViewLink href={viewHrefs.list} active={view === "list"} icon={<List aria-hidden className="size-3.5" />}>
            All problems
          </ViewLink>
        </nav>
        <div className="flex items-center gap-2">
          <span aria-live="polite" className="font-mono text-xs text-ink-3">
            {isPending ? "Updating…" : `Filters (${activeFilterCount})`}
          </span>
          {activeFilterCount > 0 && <ClearFiltersButton keys={CLEARABLE} />}
        </div>
      </div>

      <SearchInput
        className="mt-3"
        value={params.q}
        shortcut
        label="Search problems, patterns, triggers or families"
        placeholder="Search problems, numbers, patterns, triggers or families"
        inputClassName="h-10"
      />

      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
        <FamilyFilter value={params.family} families={families} alsoClear={["pattern"]} />

        <Select aria-label="Pattern" value={params.pattern ?? ""} onChange={(event) => navigate({ pattern: event.target.value || null })}>
          <option value="">All patterns</option>
          {patternGroups.map((family) => (
            <optgroup key={family.id} label={`${family.id} · ${family.name}`}>
              {family.patterns.map((pattern) => (
                <option key={pattern.id} value={pattern.id}>
                  {pattern.id} {pattern.name}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>

        <DifficultyFilter value={params.difficulty} />
        <TierFilter value={params.tier} />
        <ProblemStatusFilter value={params.status} />

        {view === "patterns" ? (
          <Select
            aria-label="Pattern progress"
            value={show}
            onChange={(event) => navigate({ show: event.target.value === "all" ? null : event.target.value })}
          >
            {PATTERN_VIEWS.map((option) => (
              <option key={option} value={option}>
                {PATTERN_VIEW_LABEL[option]}
              </option>
            ))}
          </Select>
        ) : (
          <div className="flex gap-2">
            <Select
              aria-label="Sort by"
              value={params.sort}
              onChange={(event) => navigate({ sort: event.target.value === "sheet" ? null : event.target.value })}
            >
              {SORT_KEYS.map((key) => (
                <option key={key} value={key}>
                  {SORT_LABEL[key]}
                </option>
              ))}
            </Select>
            <Button
              variant="secondary"
              className="w-9 shrink-0 px-0"
              aria-label={params.dir === "asc" ? "Sorted ascending. Switch to descending." : "Sorted descending. Switch to ascending."}
              onClick={() => navigate({ dir: params.dir === "asc" ? "desc" : null })}
            >
              {params.dir === "asc" ? (
                <ArrowUpNarrowWide aria-hidden className="size-4" />
              ) : (
                <ArrowDownWideNarrow aria-hidden className="size-4" />
              )}
            </Button>
          </div>
        )}
      </div>

      {controls && <div className="mt-3">{controls}</div>}
    </div>
  );
}

function ViewLink({ href, active, icon, children }: { href: string; active: boolean; icon: ReactNode; children: ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-[2px] px-3 font-mono text-xs whitespace-nowrap transition-colors",
        active ? "bg-ink text-card" : "text-ink-2 hover:bg-card-hover hover:text-ink",
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
