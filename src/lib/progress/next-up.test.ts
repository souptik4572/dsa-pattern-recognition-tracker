import { describe, expect, it } from "vitest";
import { pickNextUp } from "./next-up";
import type { Status } from "./status";

const entries = [
  { slotId: "1.1:1", tier: "REP" as const },
  { slotId: "1.1:2", tier: "CORE" as const },
  { slotId: "1.2:3", tier: "BOSS" as const },
  { slotId: "1.2:4", tier: "CORE" as const },
];

const statusesOf = (statuses: Record<string, Status>) => (slotId: string) => statuses[slotId] ?? "NOT_STARTED";

describe("pickNextUp", () => {
  it("prefers the first needed-help problem in sheet order", () => {
    expect(pickNextUp(entries, statusesOf({ "1.2:3": "NEEDED_HELP", "1.2:4": "NEEDED_HELP" }))).toEqual({
      reason: "revisit",
      entry: entries[2],
    });
  });

  it("then the first untouched core problem, skipping earlier non-core ones", () => {
    expect(pickNextUp(entries, statusesOf({ "1.1:2": "SOLVED_CLEAN" }))).toEqual({ reason: "core", entry: entries[3] });
  });

  it("does not treat solved-slowly as needing help", () => {
    expect(pickNextUp(entries, statusesOf({ "1.1:1": "SOLVED_SLOW" }))?.reason).toBe("core");
  });

  it("falls back to any untouched problem once core is done", () => {
    expect(pickNextUp(entries, statusesOf({ "1.1:2": "SOLVED_CLEAN", "1.2:4": "SOLVED_SLOW" }))).toEqual({
      reason: "any",
      entry: entries[0],
    });
  });

  it("returns null when every problem has a non-help status", () => {
    const all = Object.fromEntries(entries.map((entry) => [entry.slotId, "SOLVED_CLEAN" as Status]));
    expect(pickNextUp(entries, statusesOf(all))).toBeNull();
  });
});
