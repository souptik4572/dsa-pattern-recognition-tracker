import type { ProgressCounts } from "@/lib/progress/stats";

/** Filters patterns by their overall progress, independent of the problem filters. */
export const PATTERN_VIEWS = ["all", "not-started", "in-progress", "complete", "revisit"] as const;
export type PatternView = (typeof PATTERN_VIEWS)[number];

export const PATTERN_VIEW_LABEL: Record<PatternView, string> = {
  all: "Any pattern progress",
  "not-started": "Nothing solved yet",
  "in-progress": "In progress",
  complete: "Complete",
  revisit: "Has problems to revisit",
};

export function matchesView(counts: ProgressCounts, view: PatternView): boolean {
  switch (view) {
    case "all":
      return true;
    case "not-started":
      return counts.solved === 0;
    case "in-progress":
      return counts.solved > 0 && counts.solved < counts.total;
    case "complete":
      return counts.total > 0 && counts.solved === counts.total;
    case "revisit":
      return counts.revisit > 0;
  }
}
