import { z } from "zod";
import { patternSlug, slotId } from "./ids";

// Raw shape of the `DATA` object embedded in MIK-Pattern-Tracker.html.
const rawProblemSchema = z.object({
  n: z.number().int().positive(),
  t: z.string().min(1),
  d: z.enum(["E", "M", "H"]),
  tier: z.enum(["C", "R", "B"]),
  lc: z.url(),
  yt: z.union([z.url(), z.literal("")]),
  gh: z.url(),
  q: z.string().min(1),
});

const rawPatternSchema = z.object({
  id: z.string().regex(/^\d+\.\d+$/),
  name: z.string().min(1),
  trigger: z.string().min(1),
  tmpl: z.string().min(1),
  cx: z.string().min(1),
  probs: z.array(rawProblemSchema).min(1),
});

const rawFamilySchema = z.object({
  id: z.string().regex(/^\d{2}$/),
  name: z.string().min(1),
  why: z.string().min(1),
  patterns: z.array(rawPatternSchema).min(1),
});

export const rawSheetSchema = z.object({
  families: z.array(rawFamilySchema).min(1),
});

export type RawSheet = z.infer<typeof rawSheetSchema>;

const DIFFICULTY = { E: "EASY", M: "MEDIUM", H: "HARD" } as const;
const TIER = { C: "CORE", R: "REP", B: "BOSS" } as const;

export type NormalizedFamily = { id: string; position: number; name: string; why: string };

export type NormalizedPattern = {
  id: string;
  slug: string;
  position: number;
  familyId: string;
  name: string;
  trigger: string;
  template: string;
  complexity: string;
};

export type NormalizedProblem = {
  id: number;
  title: string;
  difficulty: (typeof DIFFICULTY)[keyof typeof DIFFICULTY];
  leetcodeUrl: string;
  videoUrl: string | null;
  codeUrl: string;
  videoSearchQuery: string;
};

export type NormalizedSlot = {
  id: string;
  position: number;
  patternId: string;
  problemId: number;
  tier: (typeof TIER)[keyof typeof TIER];
};

export type NormalizedSheet = {
  families: NormalizedFamily[];
  patterns: NormalizedPattern[];
  problems: NormalizedProblem[];
  slots: NormalizedSlot[];
  /** Data issues that were resolved automatically (e.g. duplicate entries). */
  warnings: string[];
};

function toProblem(raw: RawSheet["families"][number]["patterns"][number]["probs"][number]): NormalizedProblem {
  return {
    id: raw.n,
    title: raw.t,
    difficulty: DIFFICULTY[raw.d],
    leetcodeUrl: raw.lc,
    videoUrl: raw.yt || null,
    codeUrl: raw.gh,
    videoSearchQuery: decodeURIComponent(raw.q),
  };
}

function sameProblem(a: NormalizedProblem, b: NormalizedProblem): boolean {
  return (
    a.title === b.title &&
    a.difficulty === b.difficulty &&
    a.leetcodeUrl === b.leetcodeUrl &&
    a.videoUrl === b.videoUrl &&
    a.codeUrl === b.codeUrl
  );
}

/**
 * Flattens the nested sheet into relational rows in sheet order.
 * Throws on structural corruption (duplicate family/pattern ids); resolves
 * recoverable issues (a problem listed twice in one pattern) and reports them.
 */
export function normalizeSheet(sheet: RawSheet): NormalizedSheet {
  const families: NormalizedFamily[] = [];
  const patterns: NormalizedPattern[] = [];
  const slots: NormalizedSlot[] = [];
  const problems = new Map<number, NormalizedProblem>();
  const warnings: string[] = [];
  const familyIds = new Set<string>();
  const patternIds = new Set<string>();

  sheet.families.forEach((family, familyPosition) => {
    if (familyIds.has(family.id)) throw new Error(`Duplicate family id "${family.id}"`);
    familyIds.add(family.id);
    families.push({ id: family.id, position: familyPosition, name: family.name, why: family.why });

    for (const pattern of family.patterns) {
      if (patternIds.has(pattern.id)) throw new Error(`Duplicate pattern id "${pattern.id}"`);
      patternIds.add(pattern.id);
      patterns.push({
        id: pattern.id,
        slug: patternSlug(pattern.id),
        position: patterns.length,
        familyId: family.id,
        name: pattern.name,
        trigger: pattern.trigger,
        template: pattern.tmpl,
        complexity: pattern.cx,
      });

      const seenInPattern = new Set<number>();
      for (const raw of pattern.probs) {
        if (seenInPattern.has(raw.n)) {
          warnings.push(`Pattern ${pattern.id} lists problem ${raw.n} more than once; kept the first entry.`);
          continue;
        }
        seenInPattern.add(raw.n);

        const problem = toProblem(raw);
        const existing = problems.get(problem.id);
        if (!existing) {
          problems.set(problem.id, problem);
        } else if (!sameProblem(existing, problem)) {
          warnings.push(`Problem ${problem.id} has conflicting metadata across patterns; kept the first entry.`);
        }

        slots.push({
          id: slotId(pattern.id, raw.n),
          position: slots.length,
          patternId: pattern.id,
          problemId: raw.n,
          tier: TIER[raw.tier],
        });
      }
    }
  });

  return { families, patterns, problems: [...problems.values()], slots, warnings };
}
