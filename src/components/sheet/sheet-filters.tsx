"use client";

import { ArrowDownWideNarrow, ArrowUpNarrowWide, X } from "lucide-react";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { useUrlState } from "@/components/url-state";
import { STATUS_FILTER_LABEL, STATUS_FILTERS } from "@/lib/progress/status";
import { DIFFICULTIES, DIFFICULTY_LABEL, TIER_LABEL, TIERS } from "@/lib/sheet/meta";
import { hasActiveFilters, SORT_KEYS, SORT_LABEL, toParamValue, type SheetParams } from "@/lib/sheet/search-params";

export type FilterFamily = { id: string; name: string; patterns: { id: string; name: string }[] };

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
        <Select
          aria-label="Family"
          value={params.family ?? ""}
          onChange={(event) => navigate({ family: event.target.value || null, pattern: null })}
        >
          <option value="">All families</option>
          {families.map((family) => (
            <option key={family.id} value={family.id}>
              {family.id} · {family.name}
            </option>
          ))}
        </Select>

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

        <Select
          aria-label="Difficulty"
          value={params.difficulty ? toParamValue(params.difficulty) : ""}
          onChange={(event) => navigate({ difficulty: event.target.value || null })}
        >
          <option value="">Any difficulty</option>
          {DIFFICULTIES.map((difficulty) => (
            <option key={difficulty} value={toParamValue(difficulty)}>
              {DIFFICULTY_LABEL[difficulty]}
            </option>
          ))}
        </Select>

        <Select aria-label="Tier" value={params.tier ? toParamValue(params.tier) : ""} onChange={(event) => navigate({ tier: event.target.value || null })}>
          <option value="">Any tier</option>
          {TIERS.map((tier) => (
            <option key={tier} value={toParamValue(tier)}>
              {TIER_LABEL[tier]}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Status"
          value={params.status ? toParamValue(params.status) : ""}
          onChange={(event) => navigate({ status: event.target.value || null })}
        >
          <option value="">Any status</option>
          {STATUS_FILTERS.map((status) => (
            <option key={status} value={toParamValue(status)}>
              {STATUS_FILTER_LABEL[status]}
            </option>
          ))}
        </Select>

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
          {active && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ q: null, family: null, pattern: null, difficulty: null, tier: null, status: null })}
            >
              <X aria-hidden className="size-3.5" /> Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
