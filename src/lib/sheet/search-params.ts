import { z } from "zod";
import { STATUS_FILTERS, type StatusFilter } from "@/lib/progress/status";
import { DIFFICULTIES, TIERS, type Difficulty, type Tier } from "./meta";

export const PAGE_SIZES = [10, 25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZES)[number];
export const DEFAULT_PAGE_SIZE: PageSize = 25;

export const SORT_KEYS = ["sheet", "number", "title", "difficulty", "tier"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export const SORT_LABEL: Record<SortKey, string> = {
  sheet: "Sheet order",
  number: "Problem #",
  title: "Title",
  difficulty: "Difficulty",
  tier: "Tier",
};

export type SortDirection = "asc" | "desc";

export type SheetParams = {
  q: string;
  family?: string;
  pattern?: string;
  difficulty?: Difficulty;
  tier?: Tier;
  status?: StatusFilter;
  sort: SortKey;
  dir: SortDirection;
  page: number;
  pageSize: PageSize;
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

/** Enum values travel through the URL as lowercase kebab-case: SOLVED_CLEAN ⇄ solved-clean. */
export function toParamValue(value: string): string {
  return value.toLowerCase().replaceAll("_", "-");
}

function enumParam<const T extends readonly [string, ...string[]]>(values: T) {
  return z
    .preprocess((value) => (typeof value === "string" ? value.toUpperCase().replaceAll("-", "_") : value), z.enum(values))
    .optional()
    .catch(undefined);
}

// Every field falls back to its default instead of failing: a hand-edited URL should never 500.
const schema = z.object({
  q: z.string().trim().max(100).catch(""),
  family: z.string().regex(/^\d{2}$/).optional().catch(undefined),
  pattern: z.string().regex(/^\d{1,2}\.\d{1,2}$/).optional().catch(undefined),
  difficulty: enumParam(DIFFICULTIES),
  tier: enumParam(TIERS),
  status: enumParam(STATUS_FILTERS),
  sort: z.enum(SORT_KEYS).catch("sheet"),
  dir: z.enum(["asc", "desc"]).catch("asc"),
  page: z.coerce.number().int().min(1).max(100_000).catch(1),
  pageSize: z.coerce.number().int().catch(DEFAULT_PAGE_SIZE),
});

export function parseSheetParams(raw: RawSearchParams): SheetParams {
  const flat = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
  const parsed = schema.parse(flat);
  const pageSize = (PAGE_SIZES as readonly number[]).includes(parsed.pageSize)
    ? (parsed.pageSize as PageSize)
    : DEFAULT_PAGE_SIZE;
  return { ...parsed, pageSize };
}

/** Serialises params back to a URL, omitting defaults so links stay short and canonical. */
export function sheetHref(params: SheetParams, overrides: Partial<SheetParams> = {}): string {
  const next = { ...params, ...overrides };
  const search = new URLSearchParams();
  if (next.q) search.set("q", next.q);
  if (next.family) search.set("family", next.family);
  if (next.pattern) search.set("pattern", next.pattern);
  if (next.difficulty) search.set("difficulty", toParamValue(next.difficulty));
  if (next.tier) search.set("tier", toParamValue(next.tier));
  if (next.status) search.set("status", toParamValue(next.status));
  if (next.sort !== "sheet") search.set("sort", next.sort);
  if (next.dir !== "asc") search.set("dir", next.dir);
  if (next.page > 1) search.set("page", String(next.page));
  if (next.pageSize !== DEFAULT_PAGE_SIZE) search.set("pageSize", String(next.pageSize));
  const query = search.toString();
  return query ? `/sheet?${query}` : "/sheet";
}

export function hasActiveFilters(params: SheetParams): boolean {
  return Boolean(params.q || params.family || params.pattern || params.difficulty || params.tier || params.status);
}

/** Page numbers to render, with "gap" where a run is elided: 1 … 4 5 6 7 8 … 38 */
export function paginationWindow(page: number, pageCount: number, radius = 2): (number | "gap")[] {
  if (pageCount <= 1) return [1];
  const pages = new Set([1, pageCount]);
  for (let p = Math.max(1, page - radius); p <= Math.min(pageCount, page + radius); p++) pages.add(p);

  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    const previous = sorted[i - 1];
    if (previous !== undefined && p - previous > 1) result.push(p - previous === 2 ? previous + 1 : "gap");
    result.push(p);
  });
  return result;
}
