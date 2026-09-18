import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { pickNextUp } from "@/lib/progress/next-up";
import { computeProgressStats, emptyCounts, type ProgressCounts, type ProgressStats } from "@/lib/progress/stats";
import type { Status, StoredStatus } from "@/lib/progress/status";
import { querySheet, type SheetEntry } from "@/lib/sheet/query";
import type { PatternRef, ProblemRow } from "@/lib/sheet/rows";
import { scopeEntries } from "@/lib/sheet/scope";
import type { SheetParams, SheetViewParams } from "@/lib/sheet/search-params";
import { getSheetCatalog } from "./catalog";

// Pages combine the shared in-memory catalog with a single query for the user's own statuses.

// ---------------------------------------------------------------------------
// Catalog (identical for every user)
// ---------------------------------------------------------------------------

export type CatalogPattern = {
  id: string;
  slug: string;
  name: string;
  trigger: string;
  complexity: string;
  familyId: string;
  slotCount: number;
};

export type CatalogFamily = {
  id: string;
  name: string;
  why: string;
  patterns: CatalogPattern[];
};

export const getCatalog = cache(async (): Promise<CatalogFamily[]> => {
  const catalog = await getSheetCatalog();
  return catalog.families.map((family) => ({
    id: family.id,
    name: family.name,
    why: family.why,
    patterns: family.patterns.map((pattern) => ({
      id: pattern.id,
      slug: pattern.slug,
      name: pattern.name,
      trigger: pattern.trigger,
      complexity: pattern.complexity,
      familyId: pattern.familyId,
      slotCount: pattern.entries.length,
    })),
  }));
});

export const getSheetTotals = cache(async () => {
  const catalog = await getSheetCatalog();
  return {
    families: catalog.families.length,
    patterns: catalog.patterns.length,
    problems: catalog.problemCount,
    slots: catalog.entries.length,
  };
});

// ---------------------------------------------------------------------------
// Per-user progress
// ---------------------------------------------------------------------------

type OwnProgress = ReadonlyMap<string, { status: StoredStatus; updatedAt: Date }>;

/** Every status this user has set. Deduplicated per request, so each page runs it at most once. */
const getOwnProgress = cache(async (userId: string): Promise<OwnProgress> => {
  const rows = await db.userProgress.findMany({
    where: { userId },
    select: { slotId: true, status: true, updatedAt: true },
  });
  return new Map(rows.map((row) => [row.slotId, { status: row.status, updatedAt: row.updatedAt }]));
});

function statusReader(progress: OwnProgress) {
  return (slotId: string): Status => progress.get(slotId)?.status ?? "NOT_STARTED";
}

async function loadForUser(userId: string) {
  const [catalog, progress] = await Promise.all([getSheetCatalog(), getOwnProgress(userId)]);
  return { catalog, progress, statusOf: statusReader(progress) };
}

export type SheetRow = ProblemRow & {
  updatedAt: Date | null;
  pattern: PatternRef;
};

function toProblemRow(entry: SheetEntry, progress: OwnProgress): ProblemRow {
  return {
    slotId: entry.slotId,
    tier: entry.tier,
    status: progress.get(entry.slotId)?.status ?? "NOT_STARTED",
    problem: entry.problem,
  };
}

function toRow(entry: SheetEntry, progress: OwnProgress): SheetRow {
  return {
    ...toProblemRow(entry, progress),
    updatedAt: progress.get(entry.slotId)?.updatedAt ?? null,
    pattern: {
      id: entry.pattern.id,
      slug: entry.pattern.slug,
      name: entry.pattern.name,
      familyId: entry.pattern.familyId,
      familyName: entry.pattern.familyName,
    },
  };
}

export type SheetPage = {
  rows: SheetRow[];
  total: number;
  /** Solved problems among all matches, not just the current page. */
  solved: number;
  page: number;
  pageCount: number;
};

// ---------------------------------------------------------------------------
// The sheet page
// ---------------------------------------------------------------------------

export type PatternPanelData = {
  id: string;
  slug: string;
  name: string;
  trigger: string;
  template: string;
  complexity: string;
  /** Progress over the pattern's problems in scope (all of them when nothing is filtered). */
  counts: ProgressCounts;
  /** Every problem in the pattern, filtered or not. */
  totalCount: number;
  /** The pattern's problems in scope, in sheet order. */
  rows: ProblemRow[];
};

export type PatternSectionData = {
  id: string;
  name: string;
  why: string;
  counts: ProgressCounts;
  patterns: PatternPanelData[];
};

export type NextUp = { reason: "revisit" | "core" | "any"; row: SheetRow } | null;

export type SheetData = {
  /** Progress over the problems in scope, broken down every way the page shows it. */
  stats: ProgressStats;
  /** The next problem to work on, chosen from the problems in scope. */
  nextUp: NextUp;
  /** Patterns view: families and patterns that have problems in scope. */
  sections: PatternSectionData[] | null;
  /** List view: the requested page of problems in scope. */
  list: SheetPage | null;
};

/**
 * Everything the sheet shows, computed from one scope (see scopeEntries) so that the progress
 * panel, the mastery map, the headers and the results all describe the same problems.
 */
export async function getSheetData(
  userId: string,
  params: SheetParams,
  { view, show }: Pick<SheetViewParams, "view" | "show">,
): Promise<SheetData> {
  const { catalog, progress, statusOf } = await loadForUser(userId);
  const scope = scopeEntries(catalog.entries, statusOf, params, { view, show });

  const stats = computeProgressStats(
    scope.map((entry) => ({
      id: entry.slotId,
      patternId: entry.pattern.id,
      familyId: entry.pattern.familyId,
      tier: entry.tier,
      difficulty: entry.problem.difficulty,
    })),
    new Map([...progress].map(([slotId, own]) => [slotId, own.status])),
  );
  const pick = pickNextUp(scope, statusOf);
  const nextUp: NextUp = pick && { reason: pick.reason, row: toRow(pick.entry, progress) };

  if (view === "list") {
    const result = querySheet(catalog.entries, statusOf, params);
    return {
      stats,
      nextUp,
      sections: null,
      list: {
        rows: result.entries.map((entry) => toRow(entry, progress)),
        total: result.total,
        solved: result.solved,
        page: result.page,
        pageCount: result.pageCount,
      },
    };
  }

  const inScope = new Set(scope.map((entry) => entry.slotId));
  const sections = catalog.families.flatMap((family) => {
    const patterns = family.patterns.flatMap((pattern) => {
      const rows = pattern.entries.filter((entry) => inScope.has(entry.slotId));
      if (rows.length === 0) return [];
      return [
        {
          id: pattern.id,
          slug: pattern.slug,
          name: pattern.name,
          trigger: pattern.trigger,
          template: pattern.template,
          complexity: pattern.complexity,
          counts: stats.byPattern[pattern.id] ?? emptyCounts(),
          totalCount: pattern.entries.length,
          rows: rows.map((entry) => toProblemRow(entry, progress)),
        },
      ];
    });
    if (patterns.length === 0) return [];
    return [{ id: family.id, name: family.name, why: family.why, counts: stats.byFamily[family.id] ?? emptyCounts(), patterns }];
  });

  return { stats, nextUp, sections, list: null };
}

/** Pattern triggers for the recognition drill. */
export async function getDrillPatterns() {
  const catalog = await getSheetCatalog();
  return catalog.families.flatMap((family) =>
    family.patterns.map((pattern) => ({
      id: pattern.id,
      slug: pattern.slug,
      name: pattern.name,
      trigger: pattern.trigger,
      familyId: family.id,
      familyName: family.name,
    })),
  );
}
