export type DrillPattern = {
  id: string;
  slug: string;
  name: string;
  trigger: string;
  familyId: string;
  familyName: string;
};

export type DrillQuestion = { answer: DrillPattern; options: DrillPattern[] };

export const OPTION_COUNT = 4;

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Picks a trigger to identify plus distractors. Across the whole sheet, distractors come from
 * other families (as in the original drill). When drilling a single family they come from
 * the same family, which is the harder and more useful discrimination.
 */
export function buildQuestion(
  patterns: readonly DrillPattern[],
  familyId: string | null,
  previousAnswerId?: string,
  random: () => number = Math.random,
): DrillQuestion {
  const pool = familyId ? patterns.filter((pattern) => pattern.familyId === familyId) : patterns;
  if (pool.length === 0) throw new Error("No patterns to drill");

  const candidates = pool.length > 1 ? pool.filter((pattern) => pattern.id !== previousAnswerId) : pool;
  const answer = candidates[Math.floor(random() * candidates.length)];

  const sameFamily = patterns.filter((pattern) => pattern.familyId === answer.familyId && pattern.id !== answer.id);
  const otherFamilies = patterns.filter((pattern) => pattern.familyId !== answer.familyId);
  const [preferred, fallback] = familyId ? [sameFamily, otherFamilies] : [otherFamilies, sameFamily];

  const distractors = [...shuffle(preferred, random), ...shuffle(fallback, random)].slice(0, OPTION_COUNT - 1);
  return { answer, options: shuffle([answer, ...distractors], random) };
}
