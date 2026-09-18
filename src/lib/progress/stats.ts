import { DIFFICULTIES, TIERS, type Difficulty, type Tier } from "@/lib/sheet/meta";
import { isSolved, needsRevisit, type Status } from "./status";

export type ProgressCounts = {
  total: number;
  solved: number;
  pending: number;
  revisit: number;
  byStatus: Record<Status, number>;
};

export type SlotFacts = {
  id: string;
  patternId: string;
  familyId: string;
  tier: Tier;
  difficulty: Difficulty;
};

export type ProgressStats = {
  overall: ProgressCounts;
  byTier: Record<Tier, ProgressCounts>;
  byDifficulty: Record<Difficulty, ProgressCounts>;
  byFamily: Record<string, ProgressCounts>;
  byPattern: Record<string, ProgressCounts>;
};

export function emptyCounts(): ProgressCounts {
  return {
    total: 0,
    solved: 0,
    pending: 0,
    revisit: 0,
    byStatus: { NOT_STARTED: 0, NEEDED_HELP: 0, SOLVED_SLOW: 0, SOLVED_CLEAN: 0 },
  };
}

function add(counts: ProgressCounts, status: Status) {
  counts.total += 1;
  counts.byStatus[status] += 1;
  if (isSolved(status)) counts.solved += 1;
  else counts.pending += 1;
  if (needsRevisit(status)) counts.revisit += 1;
}

/** Counts for any set of statuses, e.g. the problems left after filtering. */
export function countStatuses(statuses: Iterable<Status>): ProgressCounts {
  const counts = emptyCounts();
  for (const status of statuses) add(counts, status);
  return counts;
}

function recordOf<K extends string>(keys: readonly K[]): Record<K, ProgressCounts> {
  return Object.fromEntries(keys.map((key) => [key, emptyCounts()])) as Record<K, ProgressCounts>;
}

/** Aggregates a user's statuses across every slot; slots without a status count as not started. */
export function computeProgressStats(
  slots: readonly SlotFacts[],
  statusBySlot: ReadonlyMap<string, Status>,
): ProgressStats {
  const stats: ProgressStats = {
    overall: emptyCounts(),
    byTier: recordOf(TIERS),
    byDifficulty: recordOf(DIFFICULTIES),
    byFamily: {},
    byPattern: {},
  };

  for (const slot of slots) {
    const status = statusBySlot.get(slot.id) ?? "NOT_STARTED";
    add(stats.overall, status);
    add(stats.byTier[slot.tier], status);
    add(stats.byDifficulty[slot.difficulty], status);
    add((stats.byFamily[slot.familyId] ??= emptyCounts()), status);
    add((stats.byPattern[slot.patternId] ??= emptyCounts()), status);
  }

  return stats;
}

export type MasteryLevel = 0 | 1 | 2 | 3 | 4;

export const MASTERY_LABEL: Record<MasteryLevel, string> = {
  0: "Nothing solved",
  1: "Started",
  2: "30%+ solved",
  3: "60%+ solved",
  4: "Complete",
};

/** Same thresholds as the original mastery strip, applied to solved problems. */
export function masteryLevel(counts: ProgressCounts): MasteryLevel {
  if (counts.total === 0 || counts.solved === 0) return 0;
  const ratio = counts.solved / counts.total;
  if (ratio >= 1) return 4;
  if (ratio >= 0.6) return 3;
  if (ratio >= 0.3) return 2;
  return 1;
}

export function percent(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}
