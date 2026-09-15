import { z } from "zod";

// Client-side validation for fast feedback. Better Auth enforces the same limits server-side.
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

const email = z.email({ error: "Enter a valid email address." }).trim().toLowerCase();

const password = z
  .string()
  .min(PASSWORD_MIN, { error: `Use at least ${PASSWORD_MIN} characters.` })
  .max(PASSWORD_MAX, { error: `Use at most ${PASSWORD_MAX} characters.` });

export const nameSchema = z
  .string()
  .trim()
  .min(1, { error: "Enter your name." })
  .max(60, { error: "Keep it under 60 characters." });

export const signInSchema = z.object({
  email,
  password: z.string().min(1, { error: "Enter your password." }),
});

export const signUpSchema = z
  .object({ name: nameSchema, email, password, confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    error: "Passwords don't match.",
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    error: "Passwords don't match.",
  });

export const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1, { error: "Enter your current password." }), password, confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    error: "Passwords don't match.",
  });

export type FieldErrors<T extends string = string> = Partial<Record<T, string>>;

/** First error message per field, for inline display. */
export function fieldErrors<T extends string>(error: z.ZodError): FieldErrors<T> {
  const result: FieldErrors<T> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as T | undefined;
    if (key && !result[key]) result[key] = issue.message;
  }
  return result;
}

/** Maps Better Auth client errors to copy that doesn't leak account existence. */
export function authErrorMessage(error: { status?: number; code?: string; message?: string }): string {
  if (error.status === 429) return "Too many attempts. Wait a minute, then try again.";
  if (error.code === "INVALID_EMAIL_OR_PASSWORD") return "Incorrect email or password.";
  if (error.code === "USER_ALREADY_EXISTS" || error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
    return "An account with this email already exists. Try signing in.";
  }
  return error.message || "Something went wrong. Please try again.";
}
