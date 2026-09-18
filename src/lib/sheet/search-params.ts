import { z } from "zod";
import { PATTERN_VIEWS, type PatternView } from "@/lib/patterns/views";
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

export const SHEET_VIEWS = ["patterns", "list"] as const;
export type SheetView = (typeof SHEET_VIEWS)[number];

/** Parameters that shape the sheet page itself, on top of the problem filters. */
export type SheetViewParams = {
  /** "patterns" groups problems under expandable patterns; "list" is one sortable, paginated table. */
  view: SheetView;
  /** Patterns view: which patterns to list, by their overall progress. */
  show: PatternView;
  /** Patterns view: patterns to open on arrival, e.g. from the mastery map or a problem's pattern link. */
  open: string[];
};

export type SheetLinkParams = SheetParams & Partial<SheetViewParams>;

export type RawSearchParams = Record<string, string | string[] | undefined>;

const PATTERN_ID = /^\d{1,2}\.\d{1,2}$/;
const MAX_OPEN_ON_ARRIVAL = 20;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

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
  pattern: z.string().regex(PATTERN_ID).optional().catch(undefined),
  difficulty: enumParam(DIFFICULTIES),
  tier: enumParam(TIERS),
  status: enumParam(STATUS_FILTERS),
  sort: z.enum(SORT_KEYS).catch("sheet"),
  dir: z.enum(["asc", "desc"]).catch("asc"),
  page: z.coerce.number().int().min(1).max(100_000).catch(1),
  pageSize: z.coerce.number().int().catch(DEFAULT_PAGE_SIZE),
});

const viewSchema = z.object({
  view: z.enum(SHEET_VIEWS).catch("patterns"),
  show: z.enum(PATTERN_VIEWS).catch("all"),
  open: z
    .string()
    .max(200)
    .catch("")
    .transform((value) => [...new Set(value.split(",").filter((id) => PATTERN_ID.test(id)))].slice(0, MAX_OPEN_ON_ARRIVAL)),
});

export function parseSheetParams(raw: RawSearchParams): SheetParams {
  const flat = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, first(value)]));
  const parsed = schema.parse(flat);
  const pageSize = (PAGE_SIZES as readonly number[]).includes(parsed.pageSize)
    ? (parsed.pageSize as PageSize)
    : DEFAULT_PAGE_SIZE;
  return { ...parsed, pageSize };
}

export function parseSheetViewParams(raw: RawSearchParams): SheetViewParams {
  return viewSchema.parse({ view: first(raw.view), show: first(raw.show), open: first(raw.open) });
}

/** Serialises params back to a URL, omitting defaults so links stay short and canonical. */
export function sheetHref(params: SheetLinkParams, overrides: Partial<SheetLinkParams> = {}): string {
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
  if (next.view && next.view !== "patterns") search.set("view", next.view);
  if (next.show && next.show !== "all") search.set("show", next.show);
  if (next.open && next.open.length > 0) search.set("open", next.open.join(","));
  const query = search.toString();
  return query ? `/sheet?${query}` : "/sheet";
}

export function hasActiveFilters(params: SheetParams): boolean {
  return Boolean(params.q || params.family || params.pattern || params.difficulty || params.tier || params.status);
}

/** How many filters narrow the current view. Sorting, paging and the view itself don't count. */
export function countActiveFilters(params: SheetParams, { view, show }: Pick<SheetViewParams, "view" | "show">): number {
  const problemFilters = [params.q, params.family, params.pattern, params.difficulty, params.tier, params.status].filter(Boolean).length;
  return problemFilters + (view === "patterns" && show !== "all" ? 1 : 0);
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
