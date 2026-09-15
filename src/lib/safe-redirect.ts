export const DEFAULT_REDIRECT = "/dashboard";

const AUTH_PAGES = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password"];

/**
 * Only same-origin relative paths are allowed as post-login destinations,
 * which closes the open-redirect hole in ?callbackUrl=https://evil.example.
 */
export function safeCallbackUrl(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return DEFAULT_REDIRECT;
  }

  try {
    const base = "http://internal.invalid";
    const url = new URL(value, base);
    if (url.origin !== base) return DEFAULT_REDIRECT;
    if (AUTH_PAGES.some((page) => url.pathname === page || url.pathname.startsWith(`${page}/`))) return DEFAULT_REDIRECT;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_REDIRECT;
  }
}
