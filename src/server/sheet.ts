import "server-only";
import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { computeProgressStats, type ProgressStats, type SlotFacts } from "@/lib/progress/stats";
import type { Status, StoredStatus } from "@/lib/progress/status";
import type { Difficulty, Tier } from "@/lib/sheet/meta";
import type { SheetParams, SortKey } from "@/lib/sheet/search-params";

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
  const families = await db.family.findMany({
    orderBy: { position: "asc" },
    select: {
      id: true,
      name: true,
      why: true,
      patterns: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          slug: true,
          name: true,
          trigger: true,
          complexity: true,
          familyId: true,
          _count: { select: { slots: true } },
        },
      },
    },
  });

  return families.map((family) => ({
    ...family,
    patterns: family.patterns.map(({ _count, ...pattern }) => ({ ...pattern, slotCount: _count.slots })),
  }));
});

export const getSheetTotals = cache(async () => {
  const [families, patterns, problems, slots] = await Promise.all([
    db.family.count(),
    db.pattern.count(),
    db.problem.count(),
    db.patternProblem.count(),
  ]);
  return { families, patterns, problems, slots };
});

const getSlotFacts = cache(async (): Promise<SlotFacts[]> => {
  const slots = await db.patternProblem.findMany({
    orderBy: { position: "asc" },
    select: {
      id: true,
      patternId: true,
      tier: true,
      pattern: { select: { familyId: true } },
      problem: { select: { difficulty: true } },
    },
  });
  return slots.map((slot) => ({
    id: slot.id,
    patternId: slot.patternId,
    familyId: slot.pattern.familyId,
    tier: slot.tier,
    difficulty: slot.problem.difficulty,
  }));
});

// ---------------------------------------------------------------------------
// Per-user progress
// ---------------------------------------------------------------------------

export const getProgressStats = cache(async (userId: string): Promise<ProgressStats> => {
  const [slots, progress] = await Promise.all([
    getSlotFacts(),
    db.userProgress.findMany({ where: { userId }, select: { slotId: true, status: true } }),
  ]);
  return computeProgressStats(slots, new Map(progress.map((row) => [row.slotId, row.status])));
});

export type SheetRow = {
  slotId: string;
  tier: Tier;
  status: Status;
  updatedAt: Date | null;
  problem: {
    id: number;
    title: string;
    difficulty: Difficulty;
    leetcodeUrl: string;
    videoUrl: string | null;
    codeUrl: string;
    videoSearchQuery: string;
  };
  pattern: { id: string; slug: string; name: string; familyId: string; familyName: string };
};

function rowSelect(userId: string) {
  return {
    id: true,
    tier: true,
    problem: {
      select: {
        id: true,
        title: true,
        difficulty: true,
        leetcodeUrl: true,
        videoUrl: true,
        codeUrl: true,
        videoSearchQuery: true,
      },
    },
    pattern: { select: { id: true, slug: true, name: true, family: { select: { id: true, name: true } } } },
    progress: { where: { userId }, select: { status: true, updatedAt: true } },
  } satisfies Prisma.PatternProblemSelect;
}

type RowPayload = Prisma.PatternProblemGetPayload<{ select: ReturnType<typeof rowSelect> }>;

function toSheetRow(slot: RowPayload): SheetRow {
  const progress = slot.progress[0];
  return {
    slotId: slot.id,
    tier: slot.tier,
    status: progress?.status ?? "NOT_STARTED",
    updatedAt: progress?.updatedAt ?? null,
    problem: slot.problem,
    pattern: {
      id: slot.pattern.id,
      slug: slot.pattern.slug,
      name: slot.pattern.name,
      familyId: slot.pattern.family.id,
      familyName: slot.pattern.family.name,
    },
  };
}

function statusWhere(userId: string, status: SheetParams["status"]): Prisma.PatternProblemWhereInput | null {
  const withStatus = (...statuses: StoredStatus[]): Prisma.PatternProblemWhereInput => ({
    progress: { some: { userId, status: { in: statuses } } },
  });
  const notStarted: Prisma.PatternProblemWhereInput = { progress: { none: { userId } } };

  switch (status) {
    case undefined:
      return null;
    case "NOT_STARTED":
      return notStarted;
    case "SOLVED":
      return withStatus("SOLVED_SLOW", "SOLVED_CLEAN");
    case "PENDING":
      return { OR: [notStarted, withStatus("NEEDED_HELP")] };
    case "REVISIT":
      return withStatus("NEEDED_HELP", "SOLVED_SLOW");
    default:
      return withStatus(status);
  }
}

export function buildSheetWhere(userId: string, params: SheetParams): Prisma.PatternProblemWhereInput {
  const and: Prisma.PatternProblemWhereInput[] = [];

  if (params.family) and.push({ pattern: { familyId: params.family } });
  if (params.pattern) and.push({ patternId: params.pattern });
  if (params.tier) and.push({ tier: params.tier });
  if (params.difficulty) and.push({ problem: { difficulty: params.difficulty } });

  const byStatus = statusWhere(userId, params.status);
  if (byStatus) and.push(byStatus);

  if (params.q) {
    const contains = { contains: params.q, mode: "insensitive" } as const;
    const or: Prisma.PatternProblemWhereInput[] = [
      { problem: { title: contains } },
      { pattern: { name: contains } },
      { pattern: { trigger: contains } },
      { pattern: { family: { name: contains } } },
    ];
    const number = params.q.replace(/^#/, "");
    if (/^\d{1,5}$/.test(number)) or.push({ problemId: Number(number) });
    and.push({ OR: or });
  }

  return and.length ? { AND: and } : {};
}

function sheetOrderBy(sort: SortKey, dir: SheetParams["dir"]): Prisma.PatternProblemOrderByWithRelationInput[] {
  const tieBreak = { position: "asc" } as const;
  switch (sort) {
    case "number":
      return [{ problemId: dir }, tieBreak];
    case "title":
      return [{ problem: { title: dir } }, tieBreak];
    case "difficulty":
      return [{ problem: { difficulty: dir } }, tieBreak];
    case "tier":
      return [{ tier: dir }, tieBreak];
    case "sheet":
      return [{ position: dir }];
  }
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
  const where = buildSheetWhere(userId, params);
  const [total, solved] = await Promise.all([
    db.patternProblem.count({ where }),
    db.patternProblem.count({ where: { AND: [where, statusWhere(userId, "SOLVED") ?? {}] } }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / params.pageSize));
  // An out-of-range page (stale link, filters narrowed) shows the last page rather than an empty table.
  const page = Math.min(params.page, pageCount);

  const slots = await db.patternProblem.findMany({
    where,
    orderBy: sheetOrderBy(params.sort, params.dir),
    skip: (page - 1) * params.pageSize,
    take: params.pageSize,
    select: rowSelect(userId),
  });

  return { rows: slots.map(toSheetRow), total, solved, page, pageCount };
}

// ---------------------------------------------------------------------------
// Pattern detail
// ---------------------------------------------------------------------------

export type PatternDetail = {
  id: string;
  slug: string;
  name: string;
  trigger: string;
  template: string;
  complexity: string;
  family: { id: string; name: string };
  previous: { slug: string; id: string; name: string } | null;
  next: { slug: string; id: string; name: string } | null;
  rows: SheetRow[];
};

export async function getPatternDetail(userId: string, slug: string): Promise<PatternDetail | null> {
  const pattern = await db.pattern.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      trigger: true,
      template: true,
      complexity: true,
      position: true,
      family: { select: { id: true, name: true } },
      slots: { orderBy: { position: "asc" }, select: rowSelect(userId) },
    },
  });
  if (!pattern) return null;

  const neighbour = { slug: true, id: true, name: true } as const;
  const [previous, next] = await Promise.all([
    db.pattern.findFirst({ where: { position: { lt: pattern.position } }, orderBy: { position: "desc" }, select: neighbour }),
    db.pattern.findFirst({ where: { position: { gt: pattern.position } }, orderBy: { position: "asc" }, select: neighbour }),
  ]);

  const { slots, position, ...rest } = pattern;
  return { ...rest, previous, next, rows: slots.map(toSheetRow) };
}

// ---------------------------------------------------------------------------
// Dashboard helpers
// ---------------------------------------------------------------------------

export type NextUp = { reason: "revisit" | "core" | "any"; row: SheetRow } | null;

/** Same priority as the original "Next up" button: revisit a needed-help problem, else the next untouched core problem. */
export async function getNextUp(userId: string): Promise<NextUp> {
  const find = (where: Prisma.PatternProblemWhereInput) =>
    db.patternProblem.findFirst({ where, orderBy: { position: "asc" }, select: rowSelect(userId) });

  const revisit = await find({ progress: { some: { userId, status: "NEEDED_HELP" } } });
  if (revisit) return { reason: "revisit", row: toSheetRow(revisit) };

  const core = await find({ tier: "CORE", progress: { none: { userId } } });
  if (core) return { reason: "core", row: toSheetRow(core) };

  const any = await find({ progress: { none: { userId } } });
  return any ? { reason: "any", row: toSheetRow(any) } : null;
}

export async function getRecentActivity(userId: string, take = 6) {
  const rows = await db.userProgress.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take,
    select: {
      status: true,
      updatedAt: true,
      slot: {
        select: {
          id: true,
          problem: { select: { id: true, title: true } },
          pattern: { select: { id: true, slug: true, name: true } },
        },
      },
    },
  });
  return rows.map((row) => ({
    slotId: row.slot.id,
    status: row.status,
    updatedAt: row.updatedAt,
    problem: row.slot.problem,
    pattern: row.slot.pattern,
  }));
}

/** Pattern triggers for the recognition drill. */
export async function getDrillPatterns() {
  const catalog = await getCatalog();
  return catalog.flatMap((family) =>
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
