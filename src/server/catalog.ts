import "server-only";
import { db } from "@/lib/db";
import type { SlotFacts } from "@/lib/progress/stats";
import type { SheetEntry } from "@/lib/sheet/query";

export type PatternRecord = {
  id: string;
  slug: string;
  name: string;
  trigger: string;
  template: string;
  complexity: string;
  familyId: string;
  /** This pattern's slots in sheet order. */
  entries: SheetEntry[];
};

export type FamilyRecord = { id: string; name: string; why: string; patterns: PatternRecord[] };

export type Catalog = {
  families: FamilyRecord[];
  patterns: PatternRecord[];
  /** Every slot in sheet order. */
  entries: SheetEntry[];
  facts: SlotFacts[];
  problemCount: number;
  patternBySlug: ReadonlyMap<string, PatternRecord>;
  entryBySlotId: ReadonlyMap<string, SheetEntry>;
};

async function loadCatalog(): Promise<Catalog> {
  // Four flat queries in parallel; relations are stitched together here instead of one query each.
  const [familyRows, patternRows, problemRows, slotRows] = await Promise.all([
    db.family.findMany({ orderBy: { position: "asc" } }),
    db.pattern.findMany({ orderBy: { position: "asc" } }),
    db.problem.findMany(),
    db.patternProblem.findMany({ orderBy: { position: "asc" } }),
  ]);

  const families: FamilyRecord[] = familyRows.map(({ id, name, why }) => ({ id, name, why, patterns: [] }));
  const familyById = new Map(families.map((family) => [family.id, family]));

  const patterns: PatternRecord[] = [];
  for (const row of patternRows) {
    const family = familyById.get(row.familyId);
    if (!family) continue;
    const pattern: PatternRecord = {
      id: row.id,
      slug: row.slug,
      name: row.name,
      trigger: row.trigger,
      template: row.template,
      complexity: row.complexity,
      familyId: row.familyId,
      entries: [],
    };
    patterns.push(pattern);
    family.patterns.push(pattern);
  }
  const patternById = new Map(patterns.map((pattern) => [pattern.id, pattern]));
  const problemById = new Map(problemRows.map((problem) => [problem.id, problem]));

  const entries: SheetEntry[] = [];
  for (const slot of slotRows) {
    const pattern = patternById.get(slot.patternId);
    const problem = problemById.get(slot.problemId);
    const family = pattern && familyById.get(pattern.familyId);
    if (!pattern || !problem || !family) continue;

    const entry: SheetEntry = {
      slotId: slot.id,
      position: slot.position,
      tier: slot.tier,
      problem: {
        id: problem.id,
        title: problem.title,
        difficulty: problem.difficulty,
        leetcodeUrl: problem.leetcodeUrl,
        videoUrl: problem.videoUrl,
        codeUrl: problem.codeUrl,
        videoSearchQuery: problem.videoSearchQuery,
      },
      pattern: {
        id: pattern.id,
        slug: pattern.slug,
        name: pattern.name,
        trigger: pattern.trigger,
        familyId: family.id,
        familyName: family.name,
      },
    };
    entries.push(entry);
    pattern.entries.push(entry);
  }

  return {
    families,
    patterns,
    entries,
    facts: entries.map((entry) => ({
      id: entry.slotId,
      patternId: entry.pattern.id,
      familyId: entry.pattern.familyId,
      tier: entry.tier,
      difficulty: entry.problem.difficulty,
    })),
    problemCount: problemRows.length,
    patternBySlug: new Map(patterns.map((pattern) => [pattern.slug, pattern])),
    entryBySlotId: new Map(entries.map((entry) => [entry.slotId, entry])),
  };
}

// The sheet is identical for every user and only changes when someone reseeds, so it's loaded once
// per server instance and shared across requests instead of being re-queried on every page. It
// reloads after a while so a reseed shows up without a restart.
const RELOAD_AFTER_MS = 10 * 60 * 1000;
let cached: { loadedAt: number; catalog: Promise<Catalog> } | undefined;

export function getSheetCatalog(): Promise<Catalog> {
  if (!cached || Date.now() - cached.loadedAt > RELOAD_AFTER_MS) {
    const entry = { loadedAt: Date.now(), catalog: loadCatalog() };
    cached = entry;
    // Never keep a failed load around; the next request retries.
    entry.catalog.catch(() => {
      if (cached === entry) cached = undefined;
    });
  }
  return cached.catalog;
}
