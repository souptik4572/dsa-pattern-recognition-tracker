import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { Status } from "@/lib/progress/status";
import { buildProgressExport, type ProgressEntry, type ProgressExport } from "@/lib/progress/transfer";
import { getSheetCatalog } from "./catalog";
import { UserFacingError } from "./errors";

// Every function takes the userId from the verified session (see src/server/auth.ts),
// never from client input, so a user can only ever read or write their own rows.

const IMPORT_BATCH_SIZE = 500;

export async function setSlotStatus(userId: string, slotId: string, status: Status): Promise<void> {
  const catalog = await getSheetCatalog();
  if (!catalog.entryBySlotId.has(slotId)) throw new UserFacingError("That problem no longer exists in the sheet.");

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
  const catalog = await getSheetCatalog();
  const valid = entries.filter((entry) => catalog.entryBySlotId.has(entry.slotId));

  // Multi-row upserts in one transaction: a few round trips for the whole file instead of one per
  // status, and all-or-nothing if anything fails.
  const batches: Prisma.PrismaPromise<number>[] = [];
  for (let i = 0; i < valid.length; i += IMPORT_BATCH_SIZE) {
    const rows = valid
      .slice(i, i + IMPORT_BATCH_SIZE)
      .map(({ slotId, status }) => Prisma.sql`(${userId}, ${slotId}, ${status}::"ProgressStatus", now())`);
    batches.push(db.$executeRaw`
      INSERT INTO "user_progress" ("userId", "slotId", "status", "updatedAt")
      VALUES ${Prisma.join(rows)}
      ON CONFLICT ("userId", "slotId") DO UPDATE SET "status" = EXCLUDED."status", "updatedAt" = EXCLUDED."updatedAt"`);
  }
  if (batches.length > 0) await db.$transaction(batches);

  return { imported: valid.length, unknown: entries.length - valid.length };
}

export async function exportProgress(userId: string): Promise<ProgressExport> {
  const [catalog, rows] = await Promise.all([
    getSheetCatalog(),
    db.userProgress.findMany({ where: { userId }, select: { slotId: true, status: true, updatedAt: true } }),
  ]);
  const position = (slotId: string) => catalog.entryBySlotId.get(slotId)?.position ?? Number.MAX_SAFE_INTEGER;
  return buildProgressExport(rows.sort((a, b) => position(a.slotId) - position(b.slotId)));
}
