"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { ActionResult } from "@/lib/action-result";
import { auth } from "@/lib/auth";
import { nameSchema } from "@/lib/validation/auth";
import { getOwnSessionToken } from "@/server/account";
import { authorize, getCurrentSessionId } from "@/server/auth";
import { runAction, UserFacingError } from "@/server/errors";

export async function updateNameAction(name: string): Promise<ActionResult> {
  return runAction(async () => {
    await authorize();
    const parsed = nameSchema.safeParse(name);
    if (!parsed.success) throw new UserFacingError(parsed.error.issues[0]?.message ?? "Invalid name.");

    await auth.api.updateUser({ headers: await headers(), body: { name: parsed.data } });
    revalidatePath("/", "layout");
    return undefined;
  });
}

export async function revokeSessionAction(sessionId: string): Promise<ActionResult> {
  return runAction(async () => {
    const user = await authorize();
    if (typeof sessionId !== "string" || sessionId.length === 0 || sessionId.length > 128) {
      throw new UserFacingError("Invalid session.");
    }
    if (sessionId === (await getCurrentSessionId())) {
      throw new UserFacingError("That's this device. Use Sign out instead.");
    }

    const token = await getOwnSessionToken(user.id, sessionId);
    if (!token) throw new UserFacingError("That session has already ended.");

    await auth.api.revokeSession({ headers: await headers(), body: { token } });
    revalidatePath("/settings");
    return undefined;
  });
}

export async function revokeOtherSessionsAction(): Promise<ActionResult> {
  return runAction(async () => {
    await authorize();
    await auth.api.revokeOtherSessions({ headers: await headers() });
    revalidatePath("/settings");
    return undefined;
  });
}
