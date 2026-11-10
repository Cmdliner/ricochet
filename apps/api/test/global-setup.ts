import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Redis } from "ioredis";
import { Client, Pool } from "pg";
import { ADMIN_DATABASE_URL, TEST_DATABASE_URL, TEST_DB_NAME, TEST_REDIS_URL } from "./env.js";

const migrationsFolder = fileURLToPath(new URL("../../../packages/db/drizzle", import.meta.url));

/** Runs once before the first test file: a fresh database with every migration applied, and an empty Redis. */
export default async function setup() {
  const admin = new Client({ connectionString: ADMIN_DATABASE_URL });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME} WITH (FORCE)`);
  await admin.query(`CREATE DATABASE ${TEST_DB_NAME}`);
  await admin.end();

  const pool = new Pool({ connectionString: TEST_DATABASE_URL });
  await migrate(drizzle(pool), { migrationsFolder });
  await pool.end();

  const redis = new Redis(TEST_REDIS_URL);
  await redis.flushdb();
  await redis.quit();
}
