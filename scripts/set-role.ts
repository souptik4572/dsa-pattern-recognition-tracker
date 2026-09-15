/**
 * Grants or revokes the admin role. Run by an operator with database access —
 * there is deliberately no self-service path to become an admin.
 *
 * Usage: npm run user:role -- <email> <admin|user>
 */
import "dotenv/config";
import { createPrismaClient } from "../src/lib/database";

const [email, role] = process.argv.slice(2);

if (!email || (role !== "admin" && role !== "user")) {
  console.error("Usage: npm run user:role -- <email> <admin|user>");
  process.exit(1);
}

const prisma = createPrismaClient(process.env.DIRECT_URL || process.env.DATABASE_URL);

prisma.user
  .update({ where: { email: email.toLowerCase() }, data: { role }, select: { email: true, role: true } })
  .then((user) => console.log(`${user.email} is now "${user.role}".`))
  .catch((error: unknown) => {
    const notFound = typeof error === "object" && error !== null && "code" in error && error.code === "P2025";
    console.error(notFound ? `No user with email ${email}. Sign up first, then re-run.` : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
