import { describe, expect, it } from "vitest";
import { buildPoolConfig, parseSslMode } from "./database-config";
import { SUPABASE_ROOT_CA } from "./supabase-ca";

const POOLER_URL = "postgresql://postgres.abcdefgh:s3cr%40t@aws-0-eu-west-1.pooler.supabase.com:6543/postgres";

describe("buildPoolConfig", () => {
  it("refuses to run without a connection string", () => {
    expect(() => buildPoolConfig(undefined, {})).toThrow(/DATABASE_URL is not set/);
    expect(() => buildPoolConfig("", {})).toThrow(/DATABASE_URL is not set/);
  });

  it.each([
    ["an unparseable string", "not a connection string p@ss", /not a valid URL/],
    ["a URL without a host", "postgres:p@ss@db.example.com:5432", /must look like postgresql:\/\//],
    ["a non-Postgres URL", "https://user:p@ss@example.com", /must look like postgresql:\/\//],
  ])("rejects %s without echoing the password", (_label, connectionString, expected) => {
    let message = "";
    try {
      buildPoolConfig(connectionString, {});
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toMatch(expected);
    expect(message).not.toContain("p@ss");
  });

  it("strips parameters that would override the SSL and pool settings", () => {
    const { connectionString } = buildPoolConfig(`${POOLER_URL}?sslmode=require&pgbouncer=true&schema=public&application_name=tracker`, {});
    const url = new URL(connectionString!);
    expect(url.searchParams.has("sslmode")).toBe(false);
    expect(url.searchParams.has("pgbouncer")).toBe(false);
    expect(url.searchParams.has("schema")).toBe(false);
    expect(url.searchParams.get("application_name")).toBe("tracker");
    expect(url.hostname).toBe("aws-0-eu-west-1.pooler.supabase.com");
    expect(url.port).toBe("6543");
    expect(url.username).toBe("postgres.abcdefgh");
    expect(url.password).toBe("s3cr%40t");
  });

  it("verifies certificates against Supabase's CA by default", () => {
    const { ssl } = buildPoolConfig(POOLER_URL, {});
    expect(ssl).toMatchObject({ rejectUnauthorized: true });
    expect((ssl as { ca: string[] }).ca).toContain(SUPABASE_ROOT_CA);
  });

  it("supports encrypted-without-verification and plaintext modes explicitly", () => {
    expect(buildPoolConfig(POOLER_URL, { DATABASE_SSL: "require" }).ssl).toEqual({ rejectUnauthorized: false });
    expect(buildPoolConfig(POOLER_URL, { DATABASE_SSL: "disable" }).ssl).toBe(false);
  });

  it("uses one connection per instance in production unless overridden", () => {
    expect(buildPoolConfig(POOLER_URL, { NODE_ENV: "production" }).max).toBe(1);
    expect(buildPoolConfig(POOLER_URL, { NODE_ENV: "development" }).max).toBe(5);
    expect(buildPoolConfig(POOLER_URL, { NODE_ENV: "production", DATABASE_POOL_MAX: "3" }).max).toBe(3);
    expect(() => buildPoolConfig(POOLER_URL, { DATABASE_POOL_MAX: "0" })).toThrow(/positive integer/);
    expect(() => buildPoolConfig(POOLER_URL, { DATABASE_POOL_MAX: "lots" })).toThrow(/positive integer/);
  });
});

describe("parseSslMode", () => {
  it("defaults to verify-full and rejects unknown modes", () => {
    expect(parseSslMode(undefined)).toBe("verify-full");
    expect(parseSslMode("require")).toBe("require");
    expect(() => parseSslMode("prefer")).toThrow(/DATABASE_SSL must be one of/);
  });
});
