import "server-only";
import type { ActionResult } from "@/lib/action-result";
import { AuthorizationError } from "./auth";

/** An error whose message is safe to show to the user. */
export class UserFacingError extends Error {}

/** Runs a server action body, converting expected failures into a result the UI can display. */
export async function runAction<T>(body: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await body() };
  } catch (error) {
    if (error instanceof AuthorizationError || error instanceof UserFacingError) {
      return { ok: false, error: error.message };
    }
    console.error("[action] unexpected error", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
