import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

/**
 * Brings the database up to date. Deployments run it before the API starts (`node dist/migrate.js`), so a new version
 * never meets an old schema. Safe to run twice: migrations that were already applied are skipped.
 */
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set.");

// The SQL files ship inside the @ricochet/db package, next to its built code.
const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.resolve("@ricochet/db")));

const pool = new Pool({ connectionString: url });
try {
  await migrate(drizzle(pool), { migrationsFolder });
  console.log("Migrations are up to date.");
} finally {
  await pool.end();
}
