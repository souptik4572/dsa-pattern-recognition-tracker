"use client";

import {
  ClearFiltersButton,
  DifficultyFilter,
  FamilyFilter,
  ProblemStatusFilter,
  TierFilter,
} from "@/components/filters/filter-selects";
import { ExpandCollapseControls } from "@/components/patterns/pattern-accordion";
import { SearchInput } from "@/components/search-input";
import { Select } from "@/components/ui/field";
import { useUrlState } from "@/components/url-state";
import { PATTERN_VIEW_LABEL, PATTERN_VIEWS, type PatternView } from "@/lib/patterns/views";
import type { StatusFilter } from "@/lib/progress/status";
import type { Difficulty, Tier } from "@/lib/sheet/meta";

export type PatternPageFilters = {
  q: string;
  family?: string;
  difficulty?: Difficulty;
  tier?: Tier;
  status?: StatusFilter;
  view: PatternView;
};

const FILTER_KEYS = ["q", "family", "difficulty", "tier", "status", "show"];

export function PatternFilters({
  filters,
  families,
}: {
  filters: PatternPageFilters;
  families: { id: string; name: string }[];
}) {
  const { navigate, isPending } = useUrlState();
  const active = Boolean(
    filters.q || filters.family || filters.difficulty || filters.tier || filters.status || filters.view !== "all",
  );

  return (
    <div role="search" className="rounded border border-rule bg-card p-3 sm:p-4">
      <SearchInput
        value={filters.q}
        label="Search problems, patterns, triggers or families"
        placeholder="Search by problem, number, pattern, trigger or family"
        inputClassName="h-10"
      />

      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
        <FamilyFilter value={filters.family} families={families} />
        <DifficultyFilter value={filters.difficulty} />
        <TierFilter value={filters.tier} />
        <ProblemStatusFilter value={filters.status} />
        <Select
          aria-label="Pattern progress"
          value={filters.view}
          onChange={(event) => navigate({ show: event.target.value === "all" ? null : event.target.value })}
        >
          {PATTERN_VIEWS.map((view) => (
            <option key={view} value={view}>
              {PATTERN_VIEW_LABEL[view]}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <ExpandCollapseControls />
        <div className="flex items-center gap-3">
          <span aria-live="polite" className="font-mono text-xs text-ink-3">
            {isPending ? "Updating…" : ""}
          </span>
          {active && <ClearFiltersButton keys={FILTER_KEYS} />}
        </div>
      </div>
    </div>
  );
}
