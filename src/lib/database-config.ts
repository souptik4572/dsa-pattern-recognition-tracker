import { rootCertificates } from "node:tls";
import type { PoolConfig } from "pg";
import { SUPABASE_ROOT_CA } from "./supabase-ca";

export const SSL_MODES = ["verify-full", "require", "disable"] as const;
export type SslMode = (typeof SSL_MODES)[number];

// pg lets connection-string parameters override explicit options, so a pasted `sslmode=` would
// silently replace the SSL settings below. Strip those, plus flags only Prisma's old query engine
// understood (pgbouncer, schema, connection_limit), so this file is the single source of truth.
const CODE_MANAGED_PARAMS = [
  "sslmode",
  "ssl",
  "sslrootcert",
  "sslcert",
  "sslkey",
  "uselibpqcompat",
  "pgbouncer",
  "schema",
  "connection_limit",
];

type DatabaseEnv = Partial<Record<"NODE_ENV" | "DATABASE_SSL" | "DATABASE_POOL_MAX", string>>;

export const MISSING_DATABASE_URL =
  "DATABASE_URL is not set. Copy your Supabase connection strings into .env (see .env.example).";

export function parseSslMode(value: string | undefined): SslMode {
  if (!value) return "verify-full";
  if ((SSL_MODES as readonly string[]).includes(value)) return value as SslMode;
  throw new Error(`DATABASE_SSL must be one of: ${SSL_MODES.join(", ")}.`);
}

function sslOptions(mode: SslMode): PoolConfig["ssl"] {
  switch (mode) {
    case "verify-full":
      // Trust Supabase's own root CA as well as the public roots, whichever one the server's
      // certificate chains to. Node verifies the hostname by default.
      return { ca: [...rootCertificates, SUPABASE_ROOT_CA], rejectUnauthorized: true };
    case "require":
      return { rejectUnauthorized: false };
    case "disable":
      return false;
  }
}

function poolSize(env: DatabaseEnv): number {
  if (env.DATABASE_POOL_MAX) {
    const size = Number(env.DATABASE_POOL_MAX);
    if (!Number.isInteger(size) || size < 1) throw new Error("DATABASE_POOL_MAX must be a positive integer.");
    return size;
  }
  // Supabase recommends one connection per serverless instance; a long-lived dev server can use more.
  return env.NODE_ENV === "production" ? 1 : 5;
}

/** Builds node-postgres pool options. Errors never echo the connection string, which contains the password. */
export function buildPoolConfig(connectionString: string | undefined, env: DatabaseEnv = process.env): PoolConfig {
  if (!connectionString) throw new Error(MISSING_DATABASE_URL);

  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error("The database connection string is not a valid URL. Check for unencoded special characters in the password.");
  }
  // Without a host, pg would silently fall back to localhost.
  if ((url.protocol !== "postgres:" && url.protocol !== "postgresql:") || !url.hostname) {
    throw new Error("The database connection string must look like postgresql://user:password@host:port/database.");
  }
  for (const param of CODE_MANAGED_PARAMS) url.searchParams.delete(param);

  return {
    connectionString: url.toString(),
    ssl: sslOptions(parseSslMode(env.DATABASE_SSL)),
    max: poolSize(env),
    // Serverless instances freeze between invocations, so don't hold idle connections for long.
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  };
}
