import type { Status } from "@/lib/progress/status";
import type { Tier } from "./meta";
import type { SheetEntry } from "./query";

export type ProblemInfo = SheetEntry["problem"];

export type PatternRef = { id: string; slug: string; name: string; familyId: string; familyName: string };

/** A problem slot as a table shows it: the problem, its tier within the pattern, and the viewer's status. */
export type ProblemRow = {
  slotId: string;
  tier: Tier;
  status: Status;
  problem: ProblemInfo;
  /** Omitted where the pattern is already clear from context, e.g. inside an expanded pattern. */
  pattern?: PatternRef;
};
