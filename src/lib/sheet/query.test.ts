import { describe, expect, it } from "vitest";
import type { Status } from "@/lib/progress/status";
import { matchesFilters, querySheet, type SheetEntry } from "./query";
import { parseSheetParams, type RawSearchParams } from "./search-params";

let position = 0;
const entry = (
  slotId: string,
  overrides: { title?: string; id?: number; difficulty?: SheetEntry["problem"]["difficulty"]; tier?: SheetEntry["tier"]; family?: string; trigger?: string } = {},
): SheetEntry => {
  const [patternId] = slotId.split(":");
  const familyId = overrides.family ?? patternId.split(".")[0].padStart(2, "0");
  return {
    slotId,
    position: position++,
    tier: overrides.tier ?? "CORE",
    problem: {
      id: overrides.id ?? Number(slotId.split(":")[1]),
      title: overrides.title ?? `Problem ${slotId}`,
      difficulty: overrides.difficulty ?? "MEDIUM",
      leetcodeUrl: "https://leetcode.com/problems/x/",
      videoUrl: null,
      codeUrl: "https://github.com/x",
      videoSearchQuery: "x",
    },
    pattern: {
      id: patternId,
      slug: patternId.replace(".", "-"),
      name: `Pattern ${patternId}`,
      trigger: overrides.trigger ?? "trigger",
      familyId,
      familyName: `Family ${familyId}`,
    },
  };
};

const entries = [
  entry("1.1:167", { title: "Two Sum II", difficulty: "MEDIUM", tier: "CORE", trigger: "sorted array pair" }),
  entry("1.1:15", { title: "3Sum", difficulty: "MEDIUM", tier: "REP" }),
  entry("1.2:26", { title: "Remove Duplicates", difficulty: "EASY", tier: "CORE" }),
  entry("2.1:560", { title: "Subarray Sum Equals K", difficulty: "MEDIUM", tier: "BOSS" }),
  entry("2.1:1", { title: "Two Sum", difficulty: "EASY", tier: "REP" }),
  entry("3.1:239", { title: "Sliding Window Maximum", difficulty: "HARD", tier: "BOSS" }),
];

const statuses = new Map<string, Status>([
  ["1.1:167", "SOLVED_CLEAN"],
  ["1.1:15", "NEEDED_HELP"],
  ["2.1:560", "SOLVED_SLOW"],
]);
const statusOf = (slotId: string) => statuses.get(slotId) ?? "NOT_STARTED";
const run = (raw: RawSearchParams) => querySheet(entries, statusOf, parseSheetParams(raw));
const ids = (raw: RawSearchParams) => run(raw).entries.map((e) => e.slotId);

describe("querySheet", () => {
  it("returns everything in sheet order by default", () => {
    const result = run({});
    expect(result.entries.map((e) => e.slotId)).toEqual(entries.map((e) => e.slotId));
    expect(result).toMatchObject({ total: 6, solved: 2, page: 1, pageCount: 1 });
  });

  it("filters by family, pattern, tier and difficulty", () => {
    expect(ids({ family: "02" })).toEqual(["2.1:560", "2.1:1"]);
    expect(ids({ pattern: "1.1" })).toEqual(["1.1:167", "1.1:15"]);
    expect(ids({ tier: "boss" })).toEqual(["2.1:560", "3.1:239"]);
    expect(ids({ difficulty: "easy" })).toEqual(["1.2:26", "2.1:1"]);
    expect(ids({ family: "01", tier: "core", difficulty: "medium" })).toEqual(["1.1:167"]);
  });

  it("filters by exact status and by the solved / pending / revisit roll-ups", () => {
    expect(ids({ status: "not-started" })).toEqual(["1.2:26", "2.1:1", "3.1:239"]);
    expect(ids({ status: "needed-help" })).toEqual(["1.1:15"]);
    expect(ids({ status: "solved" })).toEqual(["1.1:167", "2.1:560"]);
    expect(ids({ status: "pending" })).toEqual(["1.1:15", "1.2:26", "2.1:1", "3.1:239"]);
    expect(ids({ status: "revisit" })).toEqual(["1.1:15", "2.1:560"]);
  });

  it("matches any selected value within a multi-select, and all filters together", () => {
    expect(ids({ difficulty: "easy,hard" })).toEqual(["1.2:26", "2.1:1", "3.1:239"]);
    expect(ids({ tier: "core,boss" })).toEqual(["1.1:167", "1.2:26", "2.1:560", "3.1:239"]);
    expect(ids({ status: "needed-help,solved-slow" })).toEqual(["1.1:15", "2.1:560"]);
    expect(ids({ status: "not-started,solved" })).toEqual(["1.1:167", "1.2:26", "2.1:560", "2.1:1", "3.1:239"]);
    expect(ids({ difficulty: "easy,medium", tier: "rep" })).toEqual(["1.1:15", "2.1:1"]);
    expect(ids({ difficulty: "easy,hard,medium" })).toHaveLength(entries.length);
  });

  it("searches titles, pattern names, triggers and family names case-insensitively", () => {
    expect(ids({ q: "two sum" })).toEqual(["1.1:167", "2.1:1"]);
    expect(ids({ q: "SORTED ARRAY" })).toEqual(["1.1:167"]);
    expect(ids({ q: "pattern 2.1" })).toEqual(["2.1:560", "2.1:1"]);
    expect(ids({ q: "family 03" })).toEqual(["3.1:239"]);
  });

  it("matches a problem number, with or without #", () => {
    expect(ids({ q: "239" })).toEqual(["3.1:239"]);
    expect(ids({ q: "#15" })).toEqual(["1.1:15"]);
  });

  it("sorts by each key in both directions, breaking ties by sheet order", () => {
    expect(ids({ sort: "number" })).toEqual(["2.1:1", "1.1:15", "1.2:26", "1.1:167", "3.1:239", "2.1:560"]);
    expect(ids({ sort: "title" })).toEqual(["1.1:15", "1.2:26", "3.1:239", "2.1:560", "2.1:1", "1.1:167"]);
    expect(ids({ sort: "difficulty" })).toEqual(["1.2:26", "2.1:1", "1.1:167", "1.1:15", "2.1:560", "3.1:239"]);
    expect(ids({ sort: "difficulty", dir: "desc" })).toEqual(["3.1:239", "1.1:167", "1.1:15", "2.1:560", "1.2:26", "2.1:1"]);
    expect(ids({ sort: "tier" })).toEqual(["1.1:167", "1.2:26", "1.1:15", "2.1:1", "2.1:560", "3.1:239"]);
    expect(ids({ dir: "desc" })).toEqual(["3.1:239", "2.1:1", "2.1:560", "1.2:26", "1.1:15", "1.1:167"]);
  });

  it("paginates, counts solved across all matches, and clamps an out-of-range page", () => {
    expect(run({ pageSize: "10" })).toMatchObject({ total: 6, pageCount: 1 });

    const firstPage = querySheet(entries, statusOf, { ...parseSheetParams({}), pageSize: 10, page: 1 });
    expect(firstPage.entries).toHaveLength(6);

    const tiny = { ...parseSheetParams({}), pageSize: 10 as const };
    const many = Array.from({ length: 23 }, (_, i) => entry(`9.${i}:${i + 1}`));
    const paged = querySheet(many, () => "SOLVED_CLEAN", { ...tiny, page: 3 });
    expect(paged).toMatchObject({ total: 23, solved: 23, page: 3, pageCount: 3 });
    expect(paged.entries).toHaveLength(3);

    expect(querySheet(many, () => "NOT_STARTED", { ...tiny, page: 99 })).toMatchObject({ page: 3, solved: 0 });
  });

  it("applies the same filters to rows that carry only the filterable fields", () => {
    const row = {
      tier: "BOSS" as const,
      problem: { id: 239, title: "Sliding Window Maximum", difficulty: "HARD" as const },
      pattern: { id: "3.5", name: "Window + Monotonic Deque", trigger: "rolling max", familyId: "03", familyName: "Sliding Window" },
    };
    const filters = (raw: RawSearchParams) => parseSheetParams(raw);
    expect(matchesFilters(row, "NEEDED_HELP", filters({ q: "deque", tier: "boss", status: "revisit" }))).toBe(true);
    expect(matchesFilters(row, "SOLVED_CLEAN", filters({ status: "pending" }))).toBe(false);
    expect(matchesFilters(row, "NOT_STARTED", filters({ family: "04" }))).toBe(false);
  });

  it("returns an empty first page when nothing matches", () => {
    expect(run({ q: "no such problem" })).toMatchObject({ entries: [], total: 0, solved: 0, page: 1, pageCount: 1 });
  });
});
