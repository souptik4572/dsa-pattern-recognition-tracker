import { describe, expect, it } from "vitest";
import {
  countActiveFilters,
  hasActiveFilters,
  paginationWindow,
  parseSheetParams,
  parseSheetViewParams,
  sheetHref,
  toListParam,
} from "./search-params";

const DEFAULTS = { q: "", difficulty: [], tier: [], status: [], sort: "sheet", dir: "asc", page: 1, pageSize: 25 };

describe("parseSheetParams", () => {
  it("returns defaults for an empty query", () => {
    expect(parseSheetParams({})).toEqual(DEFAULTS);
  });

  it("parses kebab-case enum values and numbers", () => {
    expect(
      parseSheetParams({
        q: "  two sum ",
        family: "03",
        pattern: "3.2",
        difficulty: "hard",
        tier: "boss",
        status: "solved-clean",
        sort: "title",
        dir: "desc",
        page: "4",
        pageSize: "50",
      }),
    ).toEqual({
      q: "two sum",
      family: "03",
      pattern: "3.2",
      difficulty: ["HARD"],
      tier: ["BOSS"],
      status: ["SOLVED_CLEAN"],
      sort: "title",
      dir: "desc",
      page: 4,
      pageSize: 50,
    });
  });

  it("parses comma lists for multi-select filters in canonical order, without duplicates", () => {
    expect(parseSheetParams({ difficulty: "hard,easy,hard", tier: "boss, core", status: "revisit,needed-help" })).toMatchObject({
      difficulty: ["EASY", "HARD"],
      tier: ["CORE", "BOSS"],
      status: ["NEEDED_HELP", "REVISIT"],
    });
  });

  it("drops unknown values from a list but keeps the valid ones", () => {
    expect(parseSheetParams({ difficulty: "easy,impossible,,HARD" }).difficulty).toEqual(["EASY", "HARD"]);
  });

  it("falls back to defaults for invalid or tampered values instead of throwing", () => {
    expect(
      parseSheetParams({
        family: "../../etc",
        pattern: "1.1; DROP TABLE",
        difficulty: "impossible",
        status: "bogus",
        sort: "password",
        dir: "sideways",
        page: "-3",
        pageSize: "9999",
      }),
    ).toEqual(DEFAULTS);
  });

  it("merges repeated keys for multi-select filters and keeps the first for the rest", () => {
    expect(parseSheetParams({ tier: ["core", "rep"], sort: ["title", "number"] })).toMatchObject({
      tier: ["CORE", "REP"],
      sort: "title",
    });
  });
});

describe("toListParam", () => {
  it("joins values as kebab-case and drops empty lists", () => {
    expect(toListParam(["NEEDED_HELP", "SOLVED_SLOW"])).toBe("needed-help,solved-slow");
    expect(toListParam([])).toBeNull();
  });
});

describe("sheetHref", () => {
  it("omits defaults and round-trips through the parser", () => {
    const params = parseSheetParams({});
    expect(sheetHref(params)).toBe("/sheet");

    const href = sheetHref(params, { status: ["REVISIT"], difficulty: ["MEDIUM"], page: 2 });
    expect(href).toBe("/sheet?difficulty=medium&status=revisit&page=2");

    const reparsed = parseSheetParams(Object.fromEntries(new URL(href, "http://x").searchParams));
    expect(reparsed).toMatchObject({ status: ["REVISIT"], difficulty: ["MEDIUM"], page: 2 });
  });

  it("writes multi-select values as readable comma lists", () => {
    const href = sheetHref(parseSheetParams({}), { difficulty: ["EASY", "HARD"], status: ["NEEDED_HELP", "SOLVED_SLOW"] });
    expect(href).toBe("/sheet?difficulty=easy,hard&status=needed-help,solved-slow");
    expect(parseSheetParams(Object.fromEntries(new URL(href, "http://x").searchParams))).toMatchObject({
      difficulty: ["EASY", "HARD"],
      status: ["NEEDED_HELP", "SOLVED_SLOW"],
    });
  });
});

describe("hasActiveFilters", () => {
  it("ignores sorting and paging", () => {
    expect(hasActiveFilters(parseSheetParams({ sort: "title", page: "3" }))).toBe(false);
    expect(hasActiveFilters(parseSheetParams({ q: "heap" }))).toBe(true);
    expect(hasActiveFilters(parseSheetParams({ tier: "rep,boss" }))).toBe(true);
  });
});

describe("paginationWindow", () => {
  it("shows every page when there are few", () => {
    expect(paginationWindow(1, 1)).toEqual([1]);
    expect(paginationWindow(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("elides long runs but never hides a single page behind a gap", () => {
    expect(paginationWindow(10, 38)).toEqual([1, "gap", 8, 9, 10, 11, 12, "gap", 38]);
    expect(paginationWindow(4, 38)).toEqual([1, 2, 3, 4, 5, 6, "gap", 38]);
    expect(paginationWindow(38, 38)).toEqual([1, "gap", 36, 37, 38]);
  });
});

describe("parseSheetViewParams", () => {
  it("defaults to the patterns view with nothing opened", () => {
    expect(parseSheetViewParams({})).toEqual({ view: "patterns", show: "all", open: [] });
  });

  it("parses the list view, a progress filter and patterns to open, dropping junk and duplicates", () => {
    expect(parseSheetViewParams({ view: "list", show: "complete", open: "1.1,bogus,12.3,1.1" })).toEqual({
      view: "list",
      show: "complete",
      open: ["1.1", "12.3"],
    });
    expect(parseSheetViewParams({ view: "grid", show: "everything", open: "<script>" })).toEqual({
      view: "patterns",
      show: "all",
      open: [],
    });
  });
});

describe("sheetHref with view params", () => {
  it("adds non-default view params and round-trips them", () => {
    const defaults = parseSheetParams({});
    expect(sheetHref({ ...defaults, view: "list" }, { tier: ["BOSS"] })).toBe("/sheet?tier=boss&view=list");
    expect(sheetHref({ ...defaults, view: "patterns", show: "all", open: [] })).toBe("/sheet");

    const href = sheetHref(defaults, { show: "complete", open: ["1.1", "2.3"] });
    expect(href).toBe("/sheet?show=complete&open=1.1,2.3");
    expect(parseSheetViewParams(Object.fromEntries(new URL(href, "http://x").searchParams))).toEqual({
      view: "patterns",
      show: "complete",
      open: ["1.1", "2.3"],
    });
  });
});

describe("countActiveFilters", () => {
  it("counts each filter once, plus pattern progress in the patterns view only", () => {
    expect(countActiveFilters(parseSheetParams({ q: "heap", tier: "core", sort: "title", page: "2" }), { view: "list", show: "all" })).toBe(2);
    expect(countActiveFilters(parseSheetParams({ difficulty: "easy,medium,hard", status: "revisit" }), { view: "list", show: "all" })).toBe(2);
    expect(countActiveFilters(parseSheetParams({}), { view: "patterns", show: "complete" })).toBe(1);
    expect(countActiveFilters(parseSheetParams({}), { view: "list", show: "complete" })).toBe(0);
  });
});
