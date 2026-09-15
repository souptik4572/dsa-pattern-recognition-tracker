import { describe, expect, it } from "vitest";
import { computeProgressStats, masteryLevel, percent, type SlotFacts } from "./stats";
import { isSolved, needsRevisit, nextStatus, STATUSES, type Status } from "./status";

const slot = (id: string, overrides: Partial<SlotFacts> = {}): SlotFacts => ({
  id,
  patternId: "1.1",
  familyId: "01",
  tier: "CORE",
  difficulty: "MEDIUM",
  ...overrides,
});

describe("status helpers", () => {
  it("cycles through statuses in the original order and wraps around", () => {
    const seen: Status[] = [];
    let status: Status = "NOT_STARTED";
    for (let i = 0; i < STATUSES.length; i++) {
      seen.push(status);
      status = nextStatus(status);
    }
    expect(seen).toEqual(["NOT_STARTED", "NEEDED_HELP", "SOLVED_SLOW", "SOLVED_CLEAN"]);
    expect(status).toBe("NOT_STARTED");
  });

  it("classifies solved and revisit statuses", () => {
    expect(STATUSES.filter(isSolved)).toEqual(["SOLVED_SLOW", "SOLVED_CLEAN"]);
    expect(STATUSES.filter(needsRevisit)).toEqual(["NEEDED_HELP", "SOLVED_SLOW"]);
  });
});

describe("computeProgressStats", () => {
  const slots = [
    slot("1.1:1"),
    slot("1.1:2", { tier: "REP", difficulty: "EASY" }),
    slot("1.2:3", { patternId: "1.2", tier: "BOSS", difficulty: "HARD" }),
    slot("2.1:4", { patternId: "2.1", familyId: "02" }),
  ];

  it("treats slots without a row as not started", () => {
    const stats = computeProgressStats(slots, new Map());
    expect(stats.overall).toMatchObject({ total: 4, solved: 0, pending: 4, revisit: 0 });
    expect(stats.overall.byStatus.NOT_STARTED).toBe(4);
  });

  it("aggregates overall, tier, difficulty, family and pattern counts", () => {
    const stats = computeProgressStats(
      slots,
      new Map<string, Status>([
        ["1.1:1", "SOLVED_CLEAN"],
        ["1.1:2", "SOLVED_SLOW"],
        ["1.2:3", "NEEDED_HELP"],
      ]),
    );

    expect(stats.overall).toMatchObject({ total: 4, solved: 2, pending: 2, revisit: 2 });
    expect(stats.byTier.CORE).toMatchObject({ total: 2, solved: 1 });
    expect(stats.byTier.BOSS.byStatus.NEEDED_HELP).toBe(1);
    expect(stats.byDifficulty.EASY).toMatchObject({ total: 1, solved: 1 });
    expect(stats.byFamily["01"]).toMatchObject({ total: 3, solved: 2 });
    expect(stats.byFamily["02"]).toMatchObject({ total: 1, solved: 0 });
    expect(stats.byPattern["1.1"]).toMatchObject({ total: 2, solved: 2, pending: 0 });
  });

  it("ignores statuses for slots that are not in the catalog", () => {
    const stats = computeProgressStats(slots, new Map<string, Status>([["9.9:999", "SOLVED_CLEAN"]]));
    expect(stats.overall.solved).toBe(0);
  });
});

describe("masteryLevel", () => {
  const counts = (solved: number, total: number) => ({
    ...computeProgressStats([], new Map()).overall,
    solved,
    total,
  });

  it("uses the original tracker's thresholds", () => {
    expect(masteryLevel(counts(0, 10))).toBe(0);
    expect(masteryLevel(counts(1, 10))).toBe(1);
    expect(masteryLevel(counts(3, 10))).toBe(2);
    expect(masteryLevel(counts(6, 10))).toBe(3);
    expect(masteryLevel(counts(10, 10))).toBe(4);
    expect(masteryLevel(counts(0, 0))).toBe(0);
  });
});

describe("percent", () => {
  it("rounds and guards against division by zero", () => {
    expect(percent(1, 3)).toBe(33);
    expect(percent(0, 0)).toBe(0);
  });
});
