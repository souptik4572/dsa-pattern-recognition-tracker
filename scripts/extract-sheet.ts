/**
 * Extracts the `DATA` object embedded in the original single-page tracker into
 * prisma/data/sheet.json, which `prisma db seed` loads.
 *
 * Usage: npm run sheet:extract -- [path/to/MIK-Pattern-Tracker.html]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { normalizeSheet, rawSheetSchema } from "../src/lib/sheet/normalize";

const input = path.resolve(process.argv[2] ?? "MIK-Pattern-Tracker.html");
const output = path.resolve("prisma/data/sheet.json");

const html = readFileSync(input, "utf8");
const match = html.match(/<script>\s*const DATA = (\{[\s\S]*?\});\s*<\/script>/);
if (!match) {
  console.error(`Could not find the embedded DATA object in ${input}`);
  process.exit(1);
}

const sheet = rawSheetSchema.parse(JSON.parse(match[1]));
const { families, patterns, problems, slots, warnings } = normalizeSheet(sheet);

mkdirSync(path.dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(sheet, null, 2)}\n`);

console.log(`Wrote ${path.relative(process.cwd(), output)}`);
console.log(
  `${families.length} families, ${patterns.length} patterns, ${problems.length} problems, ${slots.length} slots`,
);
for (const warning of warnings) console.warn(`warning: ${warning}`);
