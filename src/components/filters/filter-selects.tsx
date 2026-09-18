"use client";

import { X } from "lucide-react";
import { StatusDot } from "@/components/progress/status-dot";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import { useUrlState } from "@/components/url-state";
import { STATUS_FILTER_LABEL, STATUS_FILTERS, STATUSES, type Status, type StatusFilter } from "@/lib/progress/status";
import { DIFFICULTIES, DIFFICULTY_LABEL, TIER_LABEL, TIERS, type Difficulty, type Tier } from "@/lib/sheet/meta";
import { toListParam } from "@/lib/sheet/search-params";

// URL-bound problem filters. Options, labels and the query-string format live here, so every
// filter behaves the same wherever it appears.

export function FamilyFilter({
  value,
  families,
  alsoClear = [],
}: {
  value?: string;
  families: { id: string; name: string }[];
  /** Params that depend on the family and must reset with it (e.g. a pattern from another family). */
  alsoClear?: string[];
}) {
  const { navigate } = useUrlState();
  return (
    <Select
      aria-label="Family"
      value={value ?? ""}
      onChange={(event) =>
        navigate({ family: event.target.value || null, ...Object.fromEntries(alsoClear.map((key) => [key, null])) })
      }
    >
      <option value="">All families</option>
      {families.map((family) => (
        <option key={family.id} value={family.id}>
          {family.id} · {family.name}
        </option>
      ))}
    </Select>
  );
}

const DIFFICULTY_OPTIONS: MultiSelectOption<Difficulty>[] = DIFFICULTIES.map((difficulty) => ({
  value: difficulty,
  label: DIFFICULTY_LABEL[difficulty],
}));

const TIER_OPTIONS: MultiSelectOption<Tier>[] = TIERS.map((tier) => ({ value: tier, label: TIER_LABEL[tier] }));

function isStatus(value: StatusFilter): value is Status {
  return (STATUSES as readonly StatusFilter[]).includes(value);
}

// Exact statuses first, then the roll-ups the progress tiles link to.
const STATUS_OPTIONS: MultiSelectOption<StatusFilter>[] = STATUS_FILTERS.map((status) => ({
  value: status,
  label: STATUS_FILTER_LABEL[status],
  group: isStatus(status) ? "Status" : "Groups",
  marker: isStatus(status) ? <StatusDot status={status} /> : undefined,
}));

export function DifficultyFilter({ value }: { value: Difficulty[] }) {
  const { navigate } = useUrlState();
  return (
    <MultiSelect
      label="Difficulty"
      anyLabel="Any difficulty"
      options={DIFFICULTY_OPTIONS}
      value={value}
      onChange={(next) => navigate({ difficulty: toListParam(next) })}
    />
  );
}

export function TierFilter({ value }: { value: Tier[] }) {
  const { navigate } = useUrlState();
  return (
    <MultiSelect label="Tier" anyLabel="Any tier" options={TIER_OPTIONS} value={value} onChange={(next) => navigate({ tier: toListParam(next) })} />
  );
}

export function ProblemStatusFilter({ value }: { value: StatusFilter[] }) {
  const { navigate } = useUrlState();
  return (
    <MultiSelect
      label="Status"
      anyLabel="Any status"
      options={STATUS_OPTIONS}
      value={value}
      onChange={(next) => navigate({ status: toListParam(next) })}
    />
  );
}

export function ClearFiltersButton({ keys }: { keys: string[] }) {
  const { navigate } = useUrlState();
  return (
    <Button variant="ghost" size="sm" onClick={() => navigate(Object.fromEntries(keys.map((key) => [key, null])))}>
      <X aria-hidden className="size-3.5" /> Clear filters
    </Button>
  );
}
