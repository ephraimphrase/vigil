// ─────────────────────────────────────────────────────────────
// Postgres client — the shared DB apps/api also writes to (see
// /docker-compose.yml, apps/api/db/models.py). Server-only: nothing here
// may be imported by a "use client" file, or the pg driver ships to the
// browser.
// ─────────────────────────────────────────────────────────────

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var _vigilPgPool: Pool | undefined;
}

// Reused across hot-reloads in dev so each edit doesn't open a fresh pool.
const pool =
  global._vigilPgPool ??
  new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") {
  global._vigilPgPool = pool;
}

export const db = drizzle(pool, { schema });
