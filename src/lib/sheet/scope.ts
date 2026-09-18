import { matchesView, type PatternView } from "@/lib/patterns/views";
import { countStatuses } from "@/lib/progress/stats";
import type { Status } from "@/lib/progress/status";
import { matchesFilters, type FilterableEntry, type ProblemFilters } from "./query";
import type { SheetView } from "./search-params";

type ScopeEntry = FilterableEntry & { slotId: string };

/**
 * The problems every number on the sheet describes: those matching the problem filters and, in the
 * patterns view, only those in patterns whose progress over the same problems fits the chosen
 * pattern-progress filter. With no filters it is the whole sheet.
 */
export function scopeEntries<T extends ScopeEntry>(
  entries: readonly T[],
  statusOf: (slotId: string) => Status,
  filters: ProblemFilters,
  { view, show }: { view: SheetView; show: PatternView },
): T[] {
  const matching = entries.filter((entry) => matchesFilters(entry, statusOf(entry.slotId), filters));
  if (view !== "patterns" || show === "all") return matching;

  const statusesByPattern = new Map<string, Status[]>();
  for (const entry of matching) {
    const statuses = statusesByPattern.get(entry.pattern.id) ?? [];
    statuses.push(statusOf(entry.slotId));
    statusesByPattern.set(entry.pattern.id, statuses);
  }
  const kept = new Set(
    [...statusesByPattern].filter(([, statuses]) => matchesView(countStatuses(statuses), show)).map(([patternId]) => patternId),
  );
  return matching.filter((entry) => kept.has(entry.pattern.id));
}
