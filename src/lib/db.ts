import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "@/lib/database";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Reuse one client across hot reloads in development to avoid exhausting connections.
export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
