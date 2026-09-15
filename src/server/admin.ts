import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export const ADMIN_PAGE_SIZE = 20;

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  banned: boolean;
  banReason: string | null;
  createdAt: Date;
  solved: number;
  tracked: number;
};

export async function listUsers({ q, page }: { q: string; page: number }) {
  const where: Prisma.UserWhereInput = q
    ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] }
    : {};

  const total = await db.user.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);

  const users = await db.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * ADMIN_PAGE_SIZE,
    take: ADMIN_PAGE_SIZE,
    select: { id: true, name: true, email: true, role: true, banned: true, banReason: true, createdAt: true },
  });

  const ids = users.map((user) => user.id);
  const [tracked, solved] = await Promise.all([
    db.userProgress.groupBy({ by: ["userId"], where: { userId: { in: ids } }, _count: { _all: true } }),
    db.userProgress.groupBy({
      by: ["userId"],
      where: { userId: { in: ids }, status: { in: ["SOLVED_SLOW", "SOLVED_CLEAN"] } },
      _count: { _all: true },
    }),
  ]);
  const trackedBy = new Map(tracked.map((row) => [row.userId, row._count._all]));
  const solvedBy = new Map(solved.map((row) => [row.userId, row._count._all]));

  const rows: AdminUserRow[] = users.map((user) => ({
    ...user,
    role: user.role === "admin" ? "admin" : "user",
    banned: Boolean(user.banned),
    tracked: trackedBy.get(user.id) ?? 0,
    solved: solvedBy.get(user.id) ?? 0,
  }));

  return { rows, total, page: currentPage, pageCount };
}

export async function getPlatformStats() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [users, admins, banned, activeThisWeek, progressRows] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "admin" } }),
    db.user.count({ where: { banned: true } }),
    db.userProgress.groupBy({ by: ["userId"], where: { updatedAt: { gte: since } } }).then((rows) => rows.length),
    db.userProgress.count(),
  ]);
  return { users, admins, banned, activeThisWeek, progressRows };
}
