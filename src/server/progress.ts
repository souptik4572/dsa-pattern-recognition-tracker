import "server-only";
import { db } from "@/lib/db";
import type { Status } from "@/lib/progress/status";
import { buildProgressExport, type ProgressEntry, type ProgressExport } from "@/lib/progress/transfer";
import { UserFacingError } from "./errors";

// Every function takes the userId from the verified session (see src/server/auth.ts),
// never from client input, so a user can only ever read or write their own rows.

export async function setSlotStatus(userId: string, slotId: string, status: Status): Promise<void> {
  const slot = await db.patternProblem.findUnique({ where: { id: slotId }, select: { id: true } });
  if (!slot) throw new UserFacingError("That problem no longer exists in the sheet.");

  if (status === "NOT_STARTED") {
    await db.userProgress.deleteMany({ where: { userId, slotId } });
    return;
  }

  await db.userProgress.upsert({
    where: { userId_slotId: { userId, slotId } },
    create: { userId, slotId, status },
    update: { status },
  });
}

export async function resetProgress(userId: string): Promise<number> {
  const { count } = await db.userProgress.deleteMany({ where: { userId } });
  return count;
}

export async function importProgress(
  userId: string,
  entries: ProgressEntry[],
): Promise<{ imported: number; unknown: number }> {
  const known = await db.patternProblem.findMany({
    where: { id: { in: entries.map((entry) => entry.slotId) } },
    select: { id: true },
  });
  const knownIds = new Set(known.map((slot) => slot.id));
  const valid = entries.filter((entry) => knownIds.has(entry.slotId));

  await db.$transaction(
    valid.map(({ slotId, status }) =>
      db.userProgress.upsert({
        where: { userId_slotId: { userId, slotId } },
        create: { userId, slotId, status },
        update: { status },
      }),
    ),
  );

  return { imported: valid.length, unknown: entries.length - valid.length };
}

export async function exportProgress(userId: string): Promise<ProgressExport> {
  const rows = await db.userProgress.findMany({
    where: { userId },
    orderBy: { slot: { position: "asc" } },
    select: { slotId: true, status: true, updatedAt: true },
  });
  return buildProgressExport(rows);
}
