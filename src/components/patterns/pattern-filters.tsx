"use client";

import { SearchInput } from "@/components/search-input";
import { Select } from "@/components/ui/field";
import { useUrlState } from "@/components/url-state";

export const PATTERN_VIEWS = ["all", "not-started", "in-progress", "complete", "revisit"] as const;
export type PatternView = (typeof PATTERN_VIEWS)[number];

const VIEW_LABEL: Record<PatternView, string> = {
  all: "All patterns",
  "not-started": "Nothing solved yet",
  "in-progress": "In progress",
  complete: "Complete",
  revisit: "Has problems to revisit",
};

export function PatternFilters({
  q,
  family,
  view,
  families,
}: {
  q: string;
  family?: string;
  view: PatternView;
  families: { id: string; name: string }[];
}) {
  const { navigate } = useUrlState();

  return (
    <div role="search" className="grid gap-2 rounded border border-rule bg-card p-3 sm:grid-cols-[1fr_auto_auto] sm:p-4">
      <SearchInput value={q} label="Search patterns and triggers" placeholder="Search patterns or triggers" />
      <Select aria-label="Family" value={family ?? ""} onChange={(event) => navigate({ family: event.target.value || null })}>
        <option value="">All families</option>
        {families.map((option) => (
          <option key={option.id} value={option.id}>
            {option.id} · {option.name}
          </option>
        ))}
      </Select>
      <Select aria-label="Show" value={view} onChange={(event) => navigate({ show: event.target.value === "all" ? null : event.target.value })}>
        {PATTERN_VIEWS.map((option) => (
          <option key={option} value={option}>
            {VIEW_LABEL[option]}
          </option>
        ))}
      </Select>
    </div>
  );
}
