"use client";

import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";
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
import { hasActiveFilters, SORT_KEYS, SORT_LABEL, type SheetParams } from "@/lib/sheet/search-params";

export type FilterFamily = { id: string; name: string; patterns: { id: string; name: string }[] };

const FILTER_KEYS = ["q", "family", "pattern", "difficulty", "tier", "status"];

export function SheetFilters({ params, families }: { params: SheetParams; families: FilterFamily[] }) {
  const { navigate, isPending } = useUrlState();
  const patternGroups = params.family ? families.filter((family) => family.id === params.family) : families;
  const active = hasActiveFilters(params);

  return (
    <div role="search" className="rounded border border-rule bg-card p-3 sm:p-4">
      <SearchInput
        value={params.q}
        label="Search problems, patterns, triggers or families"
        placeholder="Search by problem, number, pattern, trigger or family"
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
      </div>

      {(active || isPending) && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <span aria-live="polite" className="font-mono text-xs text-ink-3">
            {isPending ? "Updating…" : ""}
          </span>
          {active && <ClearFiltersButton keys={FILTER_KEYS} />}
        </div>
      )}
    </div>
  );
}
