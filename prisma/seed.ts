/**
 * Loads prisma/data/sheet.json into the database. Idempotent: re-running after the sheet changes
 * updates rows in place and never touches user progress.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Prisma } from "../src/generated/prisma/client";
import { createPrismaClient } from "../src/lib/database";
import { normalizeSheet, rawSheetSchema } from "../src/lib/sheet/normalize";

// A one-off script, so prefer the session pooler or direct connection when it's configured.
const prisma = createPrismaClient(process.env.DIRECT_URL || process.env.DATABASE_URL);

// Positions are unique; shifting existing rows first lets a reordered sheet be applied without collisions.
const POSITION_SHIFT = 1_000_000;
// Rows per INSERT. Keeps each statement well under Postgres's 65,535 bind-parameter limit.
const BATCH_SIZE = 500;

function batches<T>(rows: T[]): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < rows.length; i += BATCH_SIZE) result.push(rows.slice(i, i + BATCH_SIZE));
  return result;
}

async function main() {
  const file = path.resolve(process.cwd(), "prisma/data/sheet.json");
  const sheet = normalizeSheet(rawSheetSchema.parse(JSON.parse(readFileSync(file, "utf8"))));

  // Multi-row upserts instead of one round trip per row: against a hosted database, ~1,900 separate
  // upserts take minutes, while these take a handful of statements.
  await prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`UPDATE "families" SET "position" = "position" + ${POSITION_SHIFT}`;
      await tx.$executeRaw`UPDATE "patterns" SET "position" = "position" + ${POSITION_SHIFT}`;
      await tx.$executeRaw`UPDATE "pattern_problems" SET "position" = "position" + ${POSITION_SHIFT}`;

      for (const rows of batches(sheet.families)) {
        await tx.$executeRaw`
          INSERT INTO "families" ("id", "position", "name", "why")
          VALUES ${Prisma.join(rows.map((row) => Prisma.sql`(${row.id}, ${row.position}, ${row.name}, ${row.why})`))}
          ON CONFLICT ("id") DO UPDATE SET
            "position" = EXCLUDED."position", "name" = EXCLUDED."name", "why" = EXCLUDED."why"`;
      }

      for (const rows of batches(sheet.patterns)) {
        await tx.$executeRaw`
          INSERT INTO "patterns" ("id", "slug", "position", "familyId", "name", "trigger", "template", "complexity")
          VALUES ${Prisma.join(
            rows.map(
              (row) =>
                Prisma.sql`(${row.id}, ${row.slug}, ${row.position}, ${row.familyId}, ${row.name}, ${row.trigger}, ${row.template}, ${row.complexity})`,
            ),
          )}
          ON CONFLICT ("id") DO UPDATE SET
            "slug" = EXCLUDED."slug", "position" = EXCLUDED."position", "familyId" = EXCLUDED."familyId",
            "name" = EXCLUDED."name", "trigger" = EXCLUDED."trigger", "template" = EXCLUDED."template",
            "complexity" = EXCLUDED."complexity"`;
      }

      for (const rows of batches(sheet.problems)) {
        await tx.$executeRaw`
          INSERT INTO "problems" ("id", "title", "difficulty", "leetcodeUrl", "videoUrl", "codeUrl", "videoSearchQuery")
          VALUES ${Prisma.join(
            rows.map(
              (row) =>
                Prisma.sql`(${row.id}, ${row.title}, ${row.difficulty}::"Difficulty", ${row.leetcodeUrl}, ${row.videoUrl}, ${row.codeUrl}, ${row.videoSearchQuery})`,
            ),
          )}
          ON CONFLICT ("id") DO UPDATE SET
            "title" = EXCLUDED."title", "difficulty" = EXCLUDED."difficulty", "leetcodeUrl" = EXCLUDED."leetcodeUrl",
            "videoUrl" = EXCLUDED."videoUrl", "codeUrl" = EXCLUDED."codeUrl", "videoSearchQuery" = EXCLUDED."videoSearchQuery"`;
      }

      for (const rows of batches(sheet.slots)) {
        await tx.$executeRaw`
          INSERT INTO "pattern_problems" ("id", "position", "patternId", "problemId", "tier")
          VALUES ${Prisma.join(
            rows.map((row) => Prisma.sql`(${row.id}, ${row.position}, ${row.patternId}, ${row.problemId}, ${row.tier}::"Tier")`),
          )}
          ON CONFLICT ("id") DO UPDATE SET
            "position" = EXCLUDED."position", "patternId" = EXCLUDED."patternId",
            "problemId" = EXCLUDED."problemId", "tier" = EXCLUDED."tier"`;
      }
    },
    { maxWait: 30_000, timeout: 120_000 },
  );

  const staleSlots = await prisma.patternProblem.count({
    where: { id: { notIn: sheet.slots.map((slot) => slot.id) } },
  });

  console.log(
    `Seeded ${sheet.families.length} families, ${sheet.patterns.length} patterns, ` +
      `${sheet.problems.length} problems, ${sheet.slots.length} slots.`,
  );
  for (const warning of sheet.warnings) console.warn(`warning: ${warning}`);
  if (staleSlots > 0) {
    console.warn(
      `warning: ${staleSlots} slot(s) in the database are no longer in the sheet. ` +
        "They were left in place so user progress is preserved; remove them manually if intended.",
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
