import { describe, expect, it } from "vitest";
import { describeFilters } from "./describe-filters";
import { countActiveFilters, parseSheetParams } from "./search-params";

describe("describeFilters", () => {
  it("is empty without filters", () => {
    expect(describeFilters(parseSheetParams({}), { view: "patterns", show: "all" })).toEqual([]);
  });

  it("labels every active filter in toolbar order, joining multi-select values with “or”", () => {
    const params = parseSheetParams({
      q: "heap",
      family: "06",
      pattern: "6.1",
      difficulty: "hard,easy",
      tier: "core",
      status: "needed-help,revisit",
    });
    expect(describeFilters(params, { view: "patterns", show: "in-progress" }, { family: "Heaps", pattern: "Top-K" })).toEqual([
      "“heap”",
      "06 Heaps",
      "6.1 Top-K",
      "Easy or Hard",
      "Core",
      "Needed help or Due for revisit",
      "In progress",
    ]);
  });

  it("matches the Filters (N) count, including when pattern progress is ignored in the list view", () => {
    const params = parseSheetParams({ difficulty: "easy,medium", status: "solved" });
    for (const view of ["patterns", "list"] as const) {
      expect(describeFilters(params, { view, show: "complete" })).toHaveLength(countActiveFilters(params, { view, show: "complete" }));
    }
  });
});
