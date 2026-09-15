import { describe, expect, it } from "vitest";
import { buildQuestion, OPTION_COUNT, type DrillPattern } from "./drill";

const pattern = (id: string, familyId: string): DrillPattern => ({
  id,
  slug: id.replace(".", "-"),
  name: `Pattern ${id}`,
  trigger: `Trigger for ${id}`,
  familyId,
  familyName: `Family ${familyId}`,
});

const patterns = [
  pattern("1.1", "01"),
  pattern("1.2", "01"),
  pattern("1.3", "01"),
  pattern("1.4", "01"),
  pattern("2.1", "02"),
  pattern("2.2", "02"),
  pattern("3.1", "03"),
  pattern("3.2", "03"),
];

// Deterministic PRNG so failures are reproducible.
function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

describe("buildQuestion", () => {
  it("always includes the answer among unique options", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const { answer, options } = buildQuestion(patterns, null, undefined, seeded(seed));
      expect(options).toHaveLength(OPTION_COUNT);
      expect(new Set(options.map((option) => option.id)).size).toBe(OPTION_COUNT);
      expect(options).toContainEqual(answer);
    }
  });

  it("draws distractors from other families across the whole sheet", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const { answer, options } = buildQuestion(patterns, null, undefined, seeded(seed));
      const distractors = options.filter((option) => option.id !== answer.id);
      expect(distractors.every((option) => option.familyId !== answer.familyId)).toBe(true);
    }
  });

  it("stays inside the chosen family when it has enough patterns", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const { answer, options } = buildQuestion(patterns, "01", undefined, seeded(seed));
      expect(answer.familyId).toBe("01");
      expect(options.every((option) => option.familyId === "01")).toBe(true);
    }
  });

  it("tops up from other families when the chosen family is small", () => {
    const { answer, options } = buildQuestion(patterns, "02", undefined, seeded(7));
    expect(answer.familyId).toBe("02");
    expect(options).toHaveLength(OPTION_COUNT);
  });

  it("does not repeat the previous answer", () => {
    for (let seed = 1; seed <= 50; seed++) {
      expect(buildQuestion(patterns, "03", "3.1", seeded(seed)).answer.id).toBe("3.2");
    }
  });
});
