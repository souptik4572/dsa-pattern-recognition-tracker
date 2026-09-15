import { describe, expect, it } from "vitest";
import { DEFAULT_REDIRECT, safeCallbackUrl } from "./safe-redirect";

describe("safeCallbackUrl", () => {
  it("keeps same-origin paths with their query string", () => {
    expect(safeCallbackUrl("/sheet?status=revisit&page=2")).toBe("/sheet?status=revisit&page=2");
    expect(safeCallbackUrl("/patterns/1-1")).toBe("/patterns/1-1");
  });

  it.each([
    undefined,
    "",
    "dashboard",
    "https://evil.example/phish",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "/sign-in",
    "/sign-up?callbackUrl=/admin",
  ])("falls back to the default for %s", (value) => {
    expect(safeCallbackUrl(value)).toBe(DEFAULT_REDIRECT);
  });
});
