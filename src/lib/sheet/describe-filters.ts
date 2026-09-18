import { PATTERN_VIEW_LABEL } from "@/lib/patterns/views";
import { STATUS_FILTER_LABEL } from "@/lib/progress/status";
import { DIFFICULTY_LABEL, TIER_LABEL } from "./meta";
import type { SheetParams, SheetViewParams } from "./search-params";

/**
 * Short labels for the active filters in toolbar order, e.g. ["“heap”", "Easy or Hard", "Core"].
 * One label per filter, so the list's length always equals the "Filters (N)" count.
 */
export function describeFilters(
  params: SheetParams,
  { view, show }: Pick<SheetViewParams, "view" | "show">,
  names: { family?: string; pattern?: string } = {},
): string[] {
  const labels: string[] = [];
  if (params.q) labels.push(`“${params.q}”`);
  if (params.family) labels.push(names.family ? `${params.family} ${names.family}` : `Family ${params.family}`);
  if (params.pattern) labels.push(names.pattern ? `${params.pattern} ${names.pattern}` : `Pattern ${params.pattern}`);
  if (params.difficulty.length > 0) labels.push(params.difficulty.map((value) => DIFFICULTY_LABEL[value]).join(" or "));
  if (params.tier.length > 0) labels.push(params.tier.map((value) => TIER_LABEL[value]).join(" or "));
  if (params.status.length > 0) labels.push(params.status.map((value) => STATUS_FILTER_LABEL[value]).join(" or "));
  if (view === "patterns" && show !== "all") labels.push(PATTERN_VIEW_LABEL[show]);
  return labels;
}
