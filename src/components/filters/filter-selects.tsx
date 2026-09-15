"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { useUrlState } from "@/components/url-state";
import { STATUS_FILTER_LABEL, STATUS_FILTERS, type StatusFilter } from "@/lib/progress/status";
import { DIFFICULTIES, DIFFICULTY_LABEL, TIER_LABEL, TIERS, type Difficulty, type Tier } from "@/lib/sheet/meta";
import { toParamValue } from "@/lib/sheet/search-params";

// URL-bound problem filters shared by every page that lists problems, so options, labels and the
// query-string format stay identical between /sheet and /patterns.

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

export function DifficultyFilter({ value }: { value?: Difficulty }) {
  const { navigate } = useUrlState();
  return (
    <Select
      aria-label="Difficulty"
      value={value ? toParamValue(value) : ""}
      onChange={(event) => navigate({ difficulty: event.target.value || null })}
    >
      <option value="">Any difficulty</option>
      {DIFFICULTIES.map((difficulty) => (
        <option key={difficulty} value={toParamValue(difficulty)}>
          {DIFFICULTY_LABEL[difficulty]}
        </option>
      ))}
    </Select>
  );
}

export function TierFilter({ value }: { value?: Tier }) {
  const { navigate } = useUrlState();
  return (
    <Select aria-label="Tier" value={value ? toParamValue(value) : ""} onChange={(event) => navigate({ tier: event.target.value || null })}>
      <option value="">Any tier</option>
      {TIERS.map((tier) => (
        <option key={tier} value={toParamValue(tier)}>
          {TIER_LABEL[tier]}
        </option>
      ))}
    </Select>
  );
}

export function ProblemStatusFilter({ value }: { value?: StatusFilter }) {
  const { navigate } = useUrlState();
  return (
    <Select
      aria-label="Status"
      value={value ? toParamValue(value) : ""}
      onChange={(event) => navigate({ status: event.target.value || null })}
    >
      <option value="">Any status</option>
      {STATUS_FILTERS.map((status) => (
        <option key={status} value={toParamValue(status)}>
          {STATUS_FILTER_LABEL[status]}
        </option>
      ))}
    </Select>
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
