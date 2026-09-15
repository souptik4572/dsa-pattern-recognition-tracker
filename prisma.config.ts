import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // The Prisma CLI needs a session-capable connection: Supabase's session pooler (port 5432)
    // or its direct connection. The running app uses the transaction pooler via DATABASE_URL.
    // Read without env() so `prisma generate` still works in builds that don't set it.
    url: process.env.DIRECT_URL,
    // Only `prisma migrate dev` uses this, to diff schema changes in a throwaway database.
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
