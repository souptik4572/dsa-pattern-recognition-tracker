import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { buildPoolConfig, MISSING_DATABASE_URL } from "./database-config";

type AdapterFactory = NonNullable<NonNullable<ConstructorParameters<typeof PrismaClient>[0]>["adapter"]>;

/**
 * Stands in when no connection string is configured. The client can still be constructed (Better
 * Auth inspects it at import, and `next build` imports every route), and the missing configuration
 * surfaces on the first query instead of breaking builds that never touch the database.
 */
function unconfiguredAdapter(): AdapterFactory {
  return {
    provider: "postgres",
    adapterName: "@prisma/adapter-pg",
    connect: () => Promise.reject(new Error(MISSING_DATABASE_URL)),
  };
}

/**
 * The one place a Prisma client is constructed: the app (via src/lib/db.ts) and the CLI scripts
 * share it, so every connection gets the same SSL and pooling behaviour.
 */
export function createPrismaClient(connectionString: string | undefined = process.env.DATABASE_URL): PrismaClient {
  const adapter = connectionString ? new PrismaPg(buildPoolConfig(connectionString)) : unconfiguredAdapter();
  return new PrismaClient({ adapter });
}
