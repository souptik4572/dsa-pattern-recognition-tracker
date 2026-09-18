import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic gate: bounces visitors without a session cookie before any
 * rendering happens. It never trusts the cookie — every page, server action and
 * route handler re-validates the session against the database (src/server/auth.ts).
 *
 * Authenticated users are intentionally NOT redirected away from the auth pages
 * here: a stale cookie would ping-pong between /sign-in and /sheet. The auth
 * pages do that redirect after a real session check instead.
 */
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();

  const signIn = new URL("/sign-in", request.url);
  signIn.searchParams.set("callbackUrl", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(signIn);
}

export const config = {
  matcher: ["/sheet/:path*", "/settings/:path*", "/admin/:path*"],
};
