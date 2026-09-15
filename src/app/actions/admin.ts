"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { auth } from "@/lib/auth";
import { authorize } from "@/server/auth";
import { runAction, UserFacingError } from "@/server/errors";

const userIdSchema = z.string().min(1).max(64);

async function authorizeAgainstOtherUser(targetUserId: string) {
  const admin = await authorize("admin");
  const parsed = userIdSchema.safeParse(targetUserId);
  if (!parsed.success) throw new UserFacingError("Invalid user.");
  // Guards against an admin locking themselves (and possibly everyone) out.
  if (parsed.data === admin.id) throw new UserFacingError("You can't change your own role or ban yourself.");
  return parsed.data;
}

// Better Auth's admin endpoints re-check the caller's role from the session headers,
// so authorization is enforced twice: here and inside the library.

export async function setRoleAction(userId: string, role: string): Promise<ActionResult> {
  return runAction(async () => {
    const target = await authorizeAgainstOtherUser(userId);
    const parsedRole = z.enum(["admin", "user"]).safeParse(role);
    if (!parsedRole.success) throw new UserFacingError("Invalid role.");

    await auth.api.setRole({ headers: await headers(), body: { userId: target, role: parsedRole.data } });
    revalidatePath("/admin");
    return undefined;
  });
}

export async function banUserAction(userId: string, reason: string): Promise<ActionResult> {
  return runAction(async () => {
    const target = await authorizeAgainstOtherUser(userId);
    const banReason = z.string().trim().max(200).catch("").parse(reason) || undefined;

    // Banning also revokes every active session for that user.
    await auth.api.banUser({ headers: await headers(), body: { userId: target, banReason } });
    revalidatePath("/admin");
    return undefined;
  });
}

export async function unbanUserAction(userId: string): Promise<ActionResult> {
  return runAction(async () => {
    const target = await authorizeAgainstOtherUser(userId);
    await auth.api.unbanUser({ headers: await headers(), body: { userId: target } });
    revalidatePath("/admin");
    return undefined;
  });
}
