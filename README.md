# Pattern Recognition Tracker

A multi-user web app for tracking DSA practice **by pattern**, built from the single-page
[`MIK-Pattern-Tracker.html`](./MIK-Pattern-Tracker.html): 129 named patterns across 22 families
and 812 curated LeetCode problems (940 problem slots), with links to codestorywithMIK's video
and code solutions.

## Features

- **Accounts.** Email/password sign-up and sign-in, password reset, optional GitHub and Google
  sign-in, a session list with remote sign-out, and self-service account deletion.
- **Roles.** Every page, server action and API route checks the session against the database.
  Users can only read and write their own progress. Admins manage roles and bans at `/admin`.
- **The sheet** (`/sheet`). Every problem slot, with server-side search, filters (family,
  pattern, difficulty, tier, status), sorting and pagination. All of it lives in the URL, so any
  view can be shared or bookmarked.
- **Progress metrics** (`/dashboard`, `/patterns`). Solved and pending counts overall and by
  pattern, family, tier and difficulty, plus a pattern mastery grid, what's due for a revisit, and
  a "next up" suggestion.
- **Pattern pages** (`/patterns/[slug]`). The trigger, template, complexity and problems for one
  pattern.
- **Recognition drill** (`/drill`). Read a trigger and name the pattern, across the whole sheet
  or within a single family.
- **Progress export and import.** JSON export, and import from either an export file or the
  original tracker's saved state (slot ids match the original storage keys, e.g. `1.1:167`).

### How progress is counted

Each slot (a problem under a pattern) has one of four statuses, in the original tracker's
order: _Not started → Needed help → Solved slowly → Solved clean_.

| Metric          | Definition                                                         |
| --------------- | ------------------------------------------------------------------ |
| Solved          | Solved slowly + Solved clean (you got there without help)          |
| Pending         | Not started + Needed help                                          |
| Due for revisit | Needed help + Solved slowly (same as the original tracker)         |
| Pattern mastery | Share of a pattern's slots solved (bands: started, 30%, 60%, 100%) |

Progress is tracked **per slot**. A problem listed under two patterns is tracked separately
under each, as in the original.

## Tech stack

- Next.js 16 (App Router, Server Components, Server Actions, `proxy.ts`), React 19, TypeScript
- Tailwind CSS 4
- PostgreSQL on **Supabase**, accessed with Prisma 7 (`@prisma/adapter-pg`)
- Better Auth: database sessions, scrypt password hashing, rate limiting, admin plugin
- Zod 4 for input validation, Vitest for unit tests

Supabase is used only as the Postgres host. Authentication stays in Better Auth, and all data
access goes through the server. Supabase Auth and the Supabase Data API are not used.

## Getting started

Requirements: Node.js 20.9+ and a Supabase project. Pick a region close to where you'll deploy.

1. **Install dependencies and create `.env`:**

   ```bash
   npm install
   cp .env.example .env
   ```

2. **Fill in `.env`.** In the Supabase dashboard, open your project and click **Connect**. Copy:
   - the **Transaction pooler** string (port `6543`) into `DATABASE_URL`, and
   - the **Session pooler** string (port `5432`) into `DIRECT_URL`,

   replacing `[YOUR-PASSWORD]` with your database password (URL-encode special characters). Then
   set `BETTER_AUTH_SECRET` with `openssl rand -base64 32`.

3. **Create the tables, load the sheet and start the app:**

   ```bash
   npm run db:deploy   # apply migrations, including the Data API lockdown
   npm run db:seed     # load the sheet (idempotent)
   npm run dev         # http://localhost:3100
   ```

### Make yourself an admin

There is deliberately no self-service way to become an admin. Sign up in the app, then run:

```bash
npm run user:role -- you@example.com admin
```

### Social sign-in (optional)

Set `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` and/or `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`
in `.env`. A provider's button only appears when both of its values are set. The OAuth callback
URL is `{BETTER_AUTH_URL}/api/auth/callback/{github|google}`.

### Importing progress from the original tracker

The original page saved its state under the storage key `mikpattern-v1`. Paste that JSON (the
object with a `status` map) into **Settings → Progress data → Import**.

## Supabase setup notes

**Two connection strings.** The app runs on serverless functions, which open many short-lived
connections. It therefore uses Supabase's transaction pooler (`DATABASE_URL`), one connection per
instance by default. Prisma migrations and the seed and admin scripts need a session-capable
connection (`DIRECT_URL`): the session pooler, or the direct connection if your network has IPv6.

**The Data API is locked down.** Supabase publishes tables in the `public` schema through its
auto-generated REST API and grants the public `anon` role access to them by default. That would
expose password hashes and session tokens. The `lock_down_data_api` migration enables row level
security with no policies on every table and revokes those grants. Any future migration that
creates a table must enable RLS on it too.

Because this app never uses the Data API, it's worth also switching it off in the dashboard under
Integrations → Data API.

**SSL.** Connections verify the server certificate against Supabase's root CA, which is bundled in
`src/lib/supabase-ca.ts`. You can also turn on **Enforce SSL** under Database Settings to reject
unencrypted connections. `DATABASE_SSL` accepts `verify-full` (default), `require` (encrypted, no
certificate check) or `disable`.

**Pool size.** `DATABASE_POOL_MAX` overrides the connections per server instance. The default is 1
in production and 5 in development.

**Changing the schema.** `npm run db:migrate -- --name <change>` runs `prisma migrate dev`, which
needs a throwaway shadow database. Point `SHADOW_DATABASE_URL` at an empty database, such as a
second Supabase project. Never point it at production.

## Scripts

| Script                                | What it does                                            |
| ------------------------------------- | ------------------------------------------------------- |
| `npm run dev` / `build` / `start`     | Next.js on port 3100                                    |
| `npm run lint` / `typecheck` / `test` | ESLint, route types + `tsc --noEmit`, Vitest            |
| `npm run db:deploy`                   | Apply pending migrations (uses `DIRECT_URL`)            |
| `npm run db:migrate`                  | Create a new migration from schema changes (dev only)   |
| `npm run db:seed`                     | Upsert the sheet from `prisma/data/sheet.json`          |
| `npm run db:studio`                   | Browse the database with Prisma Studio                  |
| `npm run sheet:extract -- [file]`     | Regenerate `sheet.json` from the original HTML          |
| `npm run user:role -- <email> <role>` | Set a user's role to `admin` or `user`                  |

## Architecture

```
src/
  proxy.ts               optimistic redirect for signed-out visitors (cookie presence only)
  app/
    (auth)/              sign-in, sign-up, forgot/reset password
    (app)/               signed-in pages: dashboard, sheet, patterns, drill, settings, admin
    actions/             server actions: thin wrappers that authorize, validate, call the data layer
    api/auth/[...all]/   Better Auth handler
    api/progress/export/ JSON export
  server/                server-only data access layer: every query takes the verified user id
  lib/
    database*.ts         Prisma client factory: SSL, pooling, connection-string hygiene
    ...                  pure logic (stats, URL params, import parsing, validation), auth setup
  components/            UI
prisma/
  schema.prisma          auth tables + Family → Pattern → PatternProblem ← Problem, UserProgress
  migrations/            includes the Supabase Data API lockdown
  data/sheet.json        sheet data extracted from the original HTML
```

**Authorization** is layered:

1. `proxy.ts` redirects requests without a session cookie. This is a convenience, not a security
   boundary.
2. Every page calls `requireUser()` / `requireAdmin()` (`src/server/auth.ts`), which validates the
   session against the database. Non-admins get a real 403.
3. Every server action and route handler calls `authorize()` itself. Actions validate input with
   Zod and never accept a user id from the client.
4. Admin actions also go through Better Auth's admin endpoints, which re-check the caller's
   role. Admins can't demote or ban themselves.

Other hardening: rate limits on sign-in, sign-up and password-reset endpoints (stored in the
database), open-redirect-safe `callbackUrl` handling, security headers, no session cookie
cache (so bans and role changes apply on the next request), and session tokens never sent to
the browser from the sessions list.

## Data notes

The original page advertises 942 slots. Two patterns list a problem twice with different tiers
(14.5 → #1593, 16.8 → #837). The original gave both copies the same status, so the seed keeps the
first entry of each, which leaves 940 slots. `npm run sheet:extract` prints these warnings.

## Deploying to Netlify

Netlify builds Next.js automatically; no plugin configuration is needed. In **Site configuration →
Environment variables**, set:

- `DATABASE_URL`: the transaction pooler string
- `BETTER_AUTH_SECRET`: a new secret for production
- `BETTER_AUTH_URL`: your site's public `https://` origin
- any OAuth credentials you use

Run `npm run db:deploy` against the production database before deploying a release that includes
new migrations. `DIRECT_URL` is only needed wherever migrations run. Set the Netlify functions
region to match your Supabase region, since every page render queries the database.

Password-reset emails currently go through a stub in `src/lib/email.ts`. It prints to the console
in development and drops messages in production. Connect a provider (Resend, SES, Postmark, …)
there before relying on password reset in production.
