import type { Tier } from "@/lib/sheet/meta";
import type { Status } from "./status";

export type NextUpReason = "revisit" | "core" | "any";

/**
 * Same priority as the original tracker's "Next up" button: revisit the first needed-help problem,
 * otherwise the first untouched core problem, otherwise the first untouched problem.
 * `entries` must be in sheet order.
 */
export function pickNextUp<T extends { slotId: string; tier: Tier }>(
  entries: readonly T[],
  statusOf: (slotId: string) => Status,
): { reason: NextUpReason; entry: T } | null {
  const revisit = entries.find((entry) => statusOf(entry.slotId) === "NEEDED_HELP");
  if (revisit) return { reason: "revisit", entry: revisit };

  const core = entries.find((entry) => entry.tier === "CORE" && statusOf(entry.slotId) === "NOT_STARTED");
  if (core) return { reason: "core", entry: core };

  const any = entries.find((entry) => statusOf(entry.slotId) === "NOT_STARTED");
  return any ? { reason: "any", entry: any } : null;
}
