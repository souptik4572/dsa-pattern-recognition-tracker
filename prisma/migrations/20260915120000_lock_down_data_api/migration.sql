-- Supabase publishes tables in the public schema through its auto-generated Data API and, by
-- default, grants the anon and authenticated roles read/write access to them. Anyone holding the
-- project's public anon key could then read password hashes and session tokens.
--
-- This app never uses the Data API: every query runs on the server as the table owner. So:
--   1. enable row level security with no policies, which denies the API roles, and
--   2. revoke the grants those roles received.
-- Table owners bypass RLS, so Prisma is unaffected.
--
-- Every future migration that creates a table must enable RLS on it the same way.

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rate_limits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "families" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "patterns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "problems" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pattern_problems" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- The API roles only exist on Supabase; skip the revokes on plain Postgres (e.g. CI).
DO $$
DECLARE
  api_role text;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
      EXECUTE format(
        'REVOKE ALL ON TABLE "users", "sessions", "accounts", "verifications", "rate_limits", '
        '"families", "patterns", "problems", "pattern_problems", "user_progress", "_prisma_migrations" FROM %I',
        api_role
      );
      -- Stop tables created by future migrations from being granted to the API roles.
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I', api_role);
    END IF;
  END LOOP;
END
$$;
