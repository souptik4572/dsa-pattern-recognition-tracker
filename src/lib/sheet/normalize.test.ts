import { describe, expect, it } from "vitest";
import { patternIdFromSlug, patternSlug, slotId } from "./ids";
import { normalizeSheet, rawSheetSchema, type RawSheet } from "./normalize";

const problem = (n: number, overrides: Partial<RawSheet["families"][number]["patterns"][number]["probs"][number]> = {}) => ({
  n,
  t: `Problem ${n}`,
  d: "M" as const,
  tier: "C" as const,
  lc: `https://leetcode.com/problems/p-${n}/`,
  yt: `https://www.youtube.com/watch?v=${n}`,
  gh: `https://github.com/example/${n}.cpp`,
  q: `Problem%20${n}`,
  ...overrides,
});

const pattern = (id: string, probs: ReturnType<typeof problem>[]) => ({
  id,
  name: `Pattern ${id}`,
  trigger: "trigger",
  tmpl: "template",
  cx: "O(n)",
  probs,
});

const sheet = (patterns: ReturnType<typeof pattern>[][]): RawSheet => ({
  families: patterns.map((familyPatterns, i) => ({
    id: String(i + 1).padStart(2, "0"),
    name: `Family ${i + 1}`,
    why: "why",
    patterns: familyPatterns,
  })),
});

describe("normalizeSheet", () => {
  it("flattens families, patterns, problems and slots in sheet order", () => {
    const result = normalizeSheet(
      sheet([[pattern("1.1", [problem(1), problem(2)])], [pattern("2.1", [problem(3, { d: "H", tier: "B" })])]]),
    );

    expect(result.families.map((f) => [f.id, f.position])).toEqual([["01", 0], ["02", 1]]);
    expect(result.patterns.map((p) => [p.id, p.slug, p.position, p.familyId])).toEqual([
      ["1.1", "1-1", 0, "01"],
      ["2.1", "2-1", 1, "02"],
    ]);
    expect(result.slots.map((s) => [s.id, s.position, s.tier])).toEqual([
      ["1.1:1", 0, "CORE"],
      ["1.1:2", 1, "CORE"],
      ["2.1:3", 2, "BOSS"],
    ]);
    expect(result.problems.find((p) => p.id === 3)).toMatchObject({ difficulty: "HARD", videoSearchQuery: "Problem 3" });
    expect(result.warnings).toEqual([]);
  });

  it("stores a problem once when it appears under several patterns", () => {
    const result = normalizeSheet(sheet([[pattern("1.1", [problem(7)]), pattern("1.2", [problem(7, { tier: "R" })])]]));

    expect(result.problems).toHaveLength(1);
    expect(result.slots.map((s) => s.id)).toEqual(["1.1:7", "1.2:7"]);
  });

  it("keeps the first entry when a pattern lists the same problem twice", () => {
    const result = normalizeSheet(sheet([[pattern("14.5", [problem(1593, { tier: "R" }), problem(1593, { tier: "B" })])]]));

    expect(result.slots).toEqual([{ id: "14.5:1593", position: 0, patternId: "14.5", problemId: 1593, tier: "REP" }]);
    expect(result.warnings).toHaveLength(1);
  });

  it("warns when the same problem carries different metadata", () => {
    const result = normalizeSheet(sheet([[pattern("1.1", [problem(9)]), pattern("1.2", [problem(9, { t: "Renamed" })])]]));

    expect(result.problems[0].title).toBe("Problem 9");
    expect(result.warnings[0]).toMatch(/conflicting metadata/);
  });

  it("maps a missing video to null", () => {
    const result = normalizeSheet(sheet([[pattern("1.1", [problem(41, { yt: "" })])]]));
    expect(result.problems[0].videoUrl).toBeNull();
  });

  it("rejects duplicate pattern ids", () => {
    expect(() => normalizeSheet(sheet([[pattern("1.1", [problem(1)])], [pattern("1.1", [problem(2)])]]))).toThrow(
      /Duplicate pattern id/,
    );
  });
});

describe("rawSheetSchema", () => {
  it("rejects unknown difficulty codes", () => {
    const bad = sheet([[pattern("1.1", [problem(1)])]]);
    (bad.families[0].patterns[0].probs[0] as { d: string }).d = "X";
    expect(rawSheetSchema.safeParse(bad).success).toBe(false);
  });
});

describe("ids", () => {
  it("round-trips pattern slugs and builds legacy slot keys", () => {
    expect(patternSlug("10.2")).toBe("10-2");
    expect(patternIdFromSlug("10-2")).toBe("10.2");
    expect(slotId("1.1", 167)).toBe("1.1:167");
  });
});
