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
