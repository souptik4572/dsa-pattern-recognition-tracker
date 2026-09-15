import { z } from "zod";
import { STORED_STATUSES, type StoredStatus } from "./status";

export const MAX_IMPORT_ENTRIES = 5000;

export type ProgressEntry = { slotId: string; status: StoredStatus };

export type ProgressExport = {
  version: 1;
  exportedAt: string;
  progress: (ProgressEntry & { updatedAt: string })[];
};

const slotIdSchema = z.string().regex(/^\d{1,2}\.\d{1,2}:\d{1,5}$/);

/** Format written by the original single-page tracker (storage key "mikpattern-v1"). */
const legacySchema = z.object({
  status: z.record(z.string(), z.enum(["", "r", "y", "g"])),
});

const LEGACY_STATUS = { r: "NEEDED_HELP", y: "SOLVED_SLOW", g: "SOLVED_CLEAN" } as const;

const exportSchema = z.object({
  version: z.literal(1),
  progress: z.array(z.object({ slotId: z.string(), status: z.enum(STORED_STATUSES) })),
});

export type ParseResult =
  | { ok: true; format: "legacy" | "export"; entries: ProgressEntry[]; skipped: number }
  | { ok: false; error: string };

/** Accepts either this app's export file or the original tracker's saved state. */
export function parseProgressImport(text: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "That isn't valid JSON." };
  }

  let format: "legacy" | "export";
  let candidates: { slotId: string; status: StoredStatus }[];

  const asExport = exportSchema.safeParse(json);
  const asLegacy = asExport.success ? null : legacySchema.safeParse(json);

  if (asExport.success) {
    format = "export";
    candidates = asExport.data.progress;
  } else if (asLegacy?.success) {
    format = "legacy";
    candidates = Object.entries(asLegacy.data.status).flatMap(([slotId, code]) =>
      code ? [{ slotId, status: LEGACY_STATUS[code] }] : [],
    );
  } else {
    return {
      ok: false,
      error: "Unrecognised format. Use a file exported from this app or the original tracker's saved JSON.",
    };
  }

  if (candidates.length > MAX_IMPORT_ENTRIES) {
    return { ok: false, error: `Too many entries (max ${MAX_IMPORT_ENTRIES}).` };
  }

  // Last write wins for duplicate slot ids; malformed ids are skipped.
  const bySlot = new Map<string, StoredStatus>();
  let skipped = 0;
  for (const { slotId, status } of candidates) {
    if (slotIdSchema.safeParse(slotId).success) bySlot.set(slotId, status);
    else skipped += 1;
  }

  return {
    ok: true,
    format,
    entries: [...bySlot].map(([slotId, status]) => ({ slotId, status })),
    skipped,
  };
}

export function buildProgressExport(
  rows: { slotId: string; status: StoredStatus; updatedAt: Date }[],
  now = new Date(),
): ProgressExport {
  return {
    version: 1,
    exportedAt: now.toISOString(),
    progress: rows.map((row) => ({ slotId: row.slotId, status: row.status, updatedAt: row.updatedAt.toISOString() })),
  };
}
