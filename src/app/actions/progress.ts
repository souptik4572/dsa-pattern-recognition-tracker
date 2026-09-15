"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { STATUSES } from "@/lib/progress/status";
import { parseProgressImport } from "@/lib/progress/transfer";
import { authorize } from "@/server/auth";
import { runAction, UserFacingError } from "@/server/errors";
import { importProgress, resetProgress, setSlotStatus } from "@/server/progress";

const setStatusInput = z.object({
  slotId: z.string().regex(/^\d{1,2}\.\d{1,2}:\d{1,5}$/),
  status: z.enum(STATUSES),
});

export async function setStatusAction(slotId: string, status: string): Promise<ActionResult> {
  return runAction(async () => {
    const user = await authorize();
    const input = setStatusInput.safeParse({ slotId, status });
    if (!input.success) throw new UserFacingError("Invalid status update.");

    await setSlotStatus(user.id, input.data.slotId, input.data.status);
    revalidatePath("/", "layout");
    return undefined;
  });
}

export async function resetProgressAction(confirmation: string): Promise<ActionResult<{ cleared: number }>> {
  return runAction(async () => {
    const user = await authorize();
    if (confirmation !== "RESET") throw new UserFacingError('Type RESET to confirm.');

    const cleared = await resetProgress(user.id);
    revalidatePath("/", "layout");
    return { cleared };
  });
}

const MAX_IMPORT_BYTES = 1024 * 1024;

export async function importProgressAction(
  text: string,
): Promise<ActionResult<{ imported: number; unknown: number; skipped: number }>> {
  return runAction(async () => {
    const user = await authorize();
    if (typeof text !== "string" || text.length === 0) throw new UserFacingError("Choose a file or paste JSON to import.");
    if (text.length > MAX_IMPORT_BYTES) throw new UserFacingError("That file is too large (max 1 MB).");

    const parsed = parseProgressImport(text);
    if (!parsed.ok) throw new UserFacingError(parsed.error);

    const { imported, unknown } = await importProgress(user.id, parsed.entries);
    revalidatePath("/", "layout");
    return { imported, unknown, skipped: parsed.skipped };
  });
}
