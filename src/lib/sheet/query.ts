import { isSolved, needsRevisit, type Status, type StatusFilter } from "@/lib/progress/status";
import type { Difficulty, Tier } from "./meta";
import type { SheetParams, SortKey } from "./search-params";

/** One problem slot with everything the sheet needs to filter, sort and display it. */
export type SheetEntry = {
  slotId: string;
  position: number;
  tier: Tier;
  problem: {
    id: number;
    title: string;
    difficulty: Difficulty;
    leetcodeUrl: string;
    videoUrl: string | null;
    codeUrl: string;
    videoSearchQuery: string;
  };
  pattern: { id: string; slug: string; name: string; trigger: string; familyId: string; familyName: string };
};

/** The fields filtering looks at. Sheet entries have them, and so do rows on the patterns page. */
export type FilterableEntry = {
  tier: Tier;
  problem: { id: number; title: string; difficulty: Difficulty };
  pattern: { id: string; name: string; trigger: string; familyId: string; familyName: string };
};

export type ProblemFilters = Pick<SheetParams, "q" | "family" | "pattern" | "difficulty" | "tier" | "status">;

export type SheetQueryResult = {
  /** The requested page of matches. */
  entries: SheetEntry[];
  total: number;
  /** Solved slots among all matches, not just the current page. */
  solved: number;
  page: number;
  pageCount: number;
};

const DIFFICULTY_RANK: Record<Difficulty, number> = { EASY: 0, MEDIUM: 1, HARD: 2 };
const TIER_RANK: Record<Tier, number> = { CORE: 0, REP: 1, BOSS: 2 };

export function matchesStatus(status: Status, filter: StatusFilter | undefined): boolean {
  switch (filter) {
    case undefined:
      return true;
    case "SOLVED":
      return isSolved(status);
    case "PENDING":
      return !isSolved(status);
    case "REVISIT":
      return needsRevisit(status);
    default:
      return status === filter;
  }
}

function matchesSearch(entry: FilterableEntry, search: string): boolean {
  if (!search) return true;
  const number = search.replace(/^#/, "");
  if (/^\d{1,5}$/.test(number) && entry.problem.id === Number(number)) return true;

  const needle = search.toLowerCase();
  return [entry.problem.title, entry.pattern.name, entry.pattern.trigger, entry.pattern.familyName].some((text) =>
    text.toLowerCase().includes(needle),
  );
}

/** The one definition of what the problem filters mean, shared by the sheet and the patterns page. */
export function matchesFilters(entry: FilterableEntry, status: Status, filters: ProblemFilters): boolean {
  return (
    (!filters.family || entry.pattern.familyId === filters.family) &&
    (!filters.pattern || entry.pattern.id === filters.pattern) &&
    // Multi-selects: any selected value matches, and an empty selection matches everything.
    (filters.tier.length === 0 || filters.tier.includes(entry.tier)) &&
    (filters.difficulty.length === 0 || filters.difficulty.includes(entry.problem.difficulty)) &&
    (filters.status.length === 0 || filters.status.some((filter) => matchesStatus(status, filter))) &&
    matchesSearch(entry, filters.q.trim())
  );
}

function comparator(sort: SortKey): (a: SheetEntry, b: SheetEntry) => number {
  switch (sort) {
    case "number":
      return (a, b) => a.problem.id - b.problem.id;
    case "title":
      return (a, b) => a.problem.title.localeCompare(b.problem.title, "en");
    case "difficulty":
      return (a, b) => DIFFICULTY_RANK[a.problem.difficulty] - DIFFICULTY_RANK[b.problem.difficulty];
    case "tier":
      return (a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier];
    case "sheet":
      return (a, b) => a.position - b.position;
  }
}

/**
 * Filters, sorts and paginates the sheet for one user, on the server. The sheet is a fixed, curated
 * list of under a thousand slots held in memory, so this is far faster than a database round trip.
 * Only the requested page is sent to the browser.
 */
export function querySheet(
  entries: readonly SheetEntry[],
  statusOf: (slotId: string) => Status,
  params: SheetParams,
): SheetQueryResult {
  const matches = entries.filter((entry) => matchesFilters(entry, statusOf(entry.slotId), params));

  const primary = comparator(params.sort);
  const direction = params.dir === "desc" ? -1 : 1;
  // Ties always fall back to sheet order, so paging through equal keys is stable.
  matches.sort((a, b) => primary(a, b) * direction || a.position - b.position);

  const total = matches.length;
  const pageCount = Math.max(1, Math.ceil(total / params.pageSize));
  const page = Math.min(params.page, pageCount);
  const start = (page - 1) * params.pageSize;

  return {
    entries: matches.slice(start, start + params.pageSize),
    total,
    solved: matches.filter((entry) => isSolved(statusOf(entry.slotId))).length,
    page,
    pageCount,
  };
}
