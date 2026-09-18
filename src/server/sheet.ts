import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { matchesView, type PatternView } from "@/lib/patterns/views";
import { pickNextUp } from "@/lib/progress/next-up";
import { computeProgressStats, emptyCounts, type ProgressCounts, type ProgressStats } from "@/lib/progress/stats";
import type { Status, StoredStatus } from "@/lib/progress/status";
import { matchesFilters, querySheet, type ProblemFilters, type SheetEntry } from "@/lib/sheet/query";
import type { PatternRef, ProblemRow } from "@/lib/sheet/rows";
import type { SheetParams } from "@/lib/sheet/search-params";
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

export const getProgressStats = cache(async (userId: string): Promise<ProgressStats> => {
  const { catalog, progress } = await loadForUser(userId);
  return computeProgressStats(
    catalog.facts,
    new Map([...progress].map(([slotId, own]) => [slotId, own.status])),
  );
});

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

export async function getSheetPage(userId: string, params: SheetParams): Promise<SheetPage> {
  const { catalog, progress, statusOf } = await loadForUser(userId);
  const result = querySheet(catalog.entries, statusOf, params);
  return {
    rows: result.entries.map((entry) => toRow(entry, progress)),
    total: result.total,
    solved: result.solved,
    page: result.page,
    pageCount: result.pageCount,
  };
}

// ---------------------------------------------------------------------------
// Patterns page
// ---------------------------------------------------------------------------

export type PatternPanelData = {
  id: string;
  slug: string;
  name: string;
  trigger: string;
  template: string;
  complexity: string;
  /** Progress across all of the pattern's problems, regardless of filters. */
  counts: ProgressCounts;
  /** The pattern's problems that match the current filters, in sheet order. */
  rows: ProblemRow[];
};

export type PatternSectionData = {
  id: string;
  name: string;
  why: string;
  counts: ProgressCounts;
  patterns: PatternPanelData[];
};

/**
 * Families and patterns with the problems matching the filters. A pattern is listed when at least
 * one of its problems matches and its overall progress fits the chosen view.
 */
export async function getPatternSections(
  userId: string,
  { view, ...filters }: ProblemFilters & { view: PatternView },
): Promise<PatternSectionData[]> {
  const [{ catalog, progress, statusOf }, stats] = await Promise.all([loadForUser(userId), getProgressStats(userId)]);

  return catalog.families.flatMap((family) => {
    const patterns = family.patterns.flatMap((pattern) => {
      const counts = stats.byPattern[pattern.id] ?? emptyCounts();
      const rows = pattern.entries
        .filter((entry) => matchesFilters(entry, statusOf(entry.slotId), filters))
        .map((entry) => toProblemRow(entry, progress));
      if (rows.length === 0 || !matchesView(counts, view)) return [];
      return [
        {
          id: pattern.id,
          slug: pattern.slug,
          name: pattern.name,
          trigger: pattern.trigger,
          template: pattern.template,
          complexity: pattern.complexity,
          counts,
          rows,
        },
      ];
    });
    if (patterns.length === 0) return [];
    return [
      {
        id: family.id,
        name: family.name,
        why: family.why,
        counts: stats.byFamily[family.id] ?? emptyCounts(),
        patterns,
      },
    ];
  });
}

// ---------------------------------------------------------------------------
// Dashboard helpers
// ---------------------------------------------------------------------------

export type NextUp = { reason: "revisit" | "core" | "any"; row: SheetRow } | null;

export async function getNextUp(userId: string): Promise<NextUp> {
  const { catalog, progress, statusOf } = await loadForUser(userId);
  const pick = pickNextUp(catalog.entries, statusOf);
  return pick && { reason: pick.reason, row: toRow(pick.entry, progress) };
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
