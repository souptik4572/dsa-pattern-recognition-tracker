import { describe, expect, it } from "vitest";
import type { Status } from "@/lib/progress/status";
import { scopeEntries } from "./scope";
import { parseSheetParams } from "./search-params";

const entry = (slotId: string, difficulty: "EASY" | "MEDIUM" | "HARD", tier: "CORE" | "REP" | "BOSS" = "CORE") => {
  const patternId = slotId.split(":")[0];
  return {
    slotId,
    tier,
    problem: { id: Number(slotId.split(":")[1]), title: `Problem ${slotId}`, difficulty },
    pattern: { id: patternId, name: `Pattern ${patternId}`, trigger: "trigger", familyId: "01", familyName: "Family 01" },
  };
};

// Pattern 1.1: its hard problem is solved, its easy one isn't. Pattern 1.2: nothing solved.
const entries = [entry("1.1:1", "HARD"), entry("1.1:2", "EASY"), entry("1.2:3", "HARD"), entry("1.2:4", "MEDIUM", "BOSS")];
const statuses = new Map<string, Status>([["1.1:1", "SOLVED_CLEAN"]]);
const statusOf = (slotId: string) => statuses.get(slotId) ?? "NOT_STARTED";
const ids = (raw: Record<string, string>, view: "patterns" | "list" = "patterns", show: "all" | "complete" | "not-started" = "all") =>
  scopeEntries(entries, statusOf, parseSheetParams(raw), { view, show }).map((item) => item.slotId);

describe("scopeEntries", () => {
  it("is the whole sheet without filters", () => {
    expect(ids({})).toEqual(["1.1:1", "1.1:2", "1.2:3", "1.2:4"]);
  });

  it("keeps only problems matching the problem filters", () => {
    expect(ids({ difficulty: "hard" })).toEqual(["1.1:1", "1.2:3"]);
    expect(ids({ difficulty: "hard", tier: "core" })).toEqual(["1.1:1", "1.2:3"]);
    expect(ids({ tier: "boss" })).toEqual(["1.2:4"]);
  });

  it("judges pattern progress over the filtered problems, not the whole pattern", () => {
    // Pattern 1.1 isn't complete overall, but every hard problem in it is solved.
    expect(ids({ difficulty: "hard" }, "patterns", "complete")).toEqual(["1.1:1"]);
    expect(ids({}, "patterns", "complete")).toEqual([]);
    expect(ids({ difficulty: "hard" }, "patterns", "not-started")).toEqual(["1.2:3"]);
  });

  it("ignores the pattern-progress filter in the list view", () => {
    expect(ids({ difficulty: "hard" }, "list", "complete")).toEqual(["1.1:1", "1.2:3"]);
  });
});
