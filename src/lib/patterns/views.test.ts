import { describe, expect, it } from "vitest";
import { emptyCounts } from "@/lib/progress/stats";
import { matchesView } from "./views";

const counts = (solved: number, total: number, revisit = 0) => ({
  ...emptyCounts(),
  solved,
  total,
  pending: total - solved,
  revisit,
});

describe("matchesView", () => {
  it("classifies patterns by their overall progress", () => {
    expect(matchesView(counts(0, 5), "all")).toBe(true);
    expect(matchesView(counts(0, 5), "not-started")).toBe(true);
    expect(matchesView(counts(2, 5), "not-started")).toBe(false);
    expect(matchesView(counts(2, 5), "in-progress")).toBe(true);
    expect(matchesView(counts(5, 5), "in-progress")).toBe(false);
    expect(matchesView(counts(5, 5), "complete")).toBe(true);
    expect(matchesView(counts(0, 0), "complete")).toBe(false);
    expect(matchesView(counts(1, 5, 1), "revisit")).toBe(true);
    expect(matchesView(counts(1, 5, 0), "revisit")).toBe(false);
  });
});
