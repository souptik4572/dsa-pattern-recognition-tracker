import { describe, expect, it } from "vitest";
import { buildProgressExport, MAX_IMPORT_ENTRIES, parseProgressImport } from "./transfer";

describe("parseProgressImport", () => {
  it("reads the original tracker's saved state", () => {
    const legacy = JSON.stringify({
      status: { "1.1:167": "g", "1.1:15": "y", "3.2:3": "r", "4.1:35": "" },
      open: { "1.1": true },
    });
    expect(parseProgressImport(legacy)).toEqual({
      ok: true,
      format: "legacy",
      skipped: 0,
      entries: [
        { slotId: "1.1:167", status: "SOLVED_CLEAN" },
        { slotId: "1.1:15", status: "SOLVED_SLOW" },
        { slotId: "3.2:3", status: "NEEDED_HELP" },
      ],
    });
  });

  it("round-trips this app's export format", () => {
    const exported = buildProgressExport(
      [{ slotId: "2.1:560", status: "NEEDED_HELP", updatedAt: new Date("2026-01-02T03:04:05Z") }],
      new Date("2026-09-15T00:00:00Z"),
    );
    expect(exported).toEqual({
      version: 1,
      exportedAt: "2026-09-15T00:00:00.000Z",
      progress: [{ slotId: "2.1:560", status: "NEEDED_HELP", updatedAt: "2026-01-02T03:04:05.000Z" }],
    });
    expect(parseProgressImport(JSON.stringify(exported))).toMatchObject({
      ok: true,
      format: "export",
      entries: [{ slotId: "2.1:560", status: "NEEDED_HELP" }],
    });
  });

  it("skips malformed slot ids and de-duplicates", () => {
    const result = parseProgressImport(
      JSON.stringify({
        version: 1,
        progress: [
          { slotId: "1.1:1", status: "NEEDED_HELP" },
          { slotId: "<script>", status: "SOLVED_CLEAN" },
          { slotId: "1.1:1", status: "SOLVED_CLEAN" },
        ],
      }),
    );
    expect(result).toMatchObject({ ok: true, skipped: 1, entries: [{ slotId: "1.1:1", status: "SOLVED_CLEAN" }] });
  });

  it("rejects invalid JSON, unknown shapes and oversized payloads", () => {
    expect(parseProgressImport("{nope")).toMatchObject({ ok: false });
    expect(parseProgressImport(JSON.stringify({ status: { "1.1:1": "purple" } }))).toMatchObject({ ok: false });
    expect(parseProgressImport(JSON.stringify([1, 2, 3]))).toMatchObject({ ok: false });

    const huge = { version: 1, progress: Array.from({ length: MAX_IMPORT_ENTRIES + 1 }, (_, i) => ({ slotId: `1.1:${i}`, status: "SOLVED_CLEAN" })) };
    expect(parseProgressImport(JSON.stringify(huge))).toMatchObject({ ok: false, error: expect.stringMatching(/Too many/) });
  });
});
