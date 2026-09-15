import "server-only";
import { headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";

export type Role = "admin" | "user";

/** The only user shape that leaves the data layer. */
export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: Role;
};

/** Validates the session cookie against the database once per request. */
const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

export async function getCurrentSessionId(): Promise<string | null> {
  return (await getSession())?.session.id ?? null;
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session) return null;

  const { user } = session;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image ?? null,
    role: user.role === "admin" ? "admin" : "user",
  };
});

/** For pages: redirects anonymous visitors to sign in. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

/** For pages: renders the 403 boundary for signed-in non-admins. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") forbidden();
  return user;
}

export class AuthorizationError extends Error {
  constructor(readonly reason: "unauthenticated" | "forbidden") {
    super(reason === "unauthenticated" ? "You need to sign in first." : "You don't have permission to do that.");
  }
}

/** For server actions and route handlers: throws instead of redirecting. */
export async function authorize(role: Role = "user"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthorizationError("unauthenticated");
  if (role === "admin" && user.role !== "admin") throw new AuthorizationError("forbidden");
  return user;
}
