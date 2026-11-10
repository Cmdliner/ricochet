/**
 * Where the end-to-end tests keep their data. They never touch the development database:
 * a database called ricochet_test is rebuilt on every run, and Redis database 15 is wiped.
 * Locally the defaults match docker-compose.yml. CI points DATABASE_URL and REDIS_URL at its service containers.
 */
export const TEST_DB_NAME = "ricochet_test";
export const TEST_REDIS_DB = 15;

function withPath(url: string, path: string): string {
  const parsed = new URL(url);
  parsed.pathname = path;
  return parsed.toString();
}

const databaseUrl = process.env.DATABASE_URL ?? "postgres://ricochet:ricochet@localhost:5442/ricochet";
const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6380";

export const ADMIN_DATABASE_URL = withPath(databaseUrl, "/postgres");
export const TEST_DATABASE_URL = withPath(databaseUrl, `/${TEST_DB_NAME}`);
export const TEST_REDIS_URL = withPath(redisUrl, `/${TEST_REDIS_DB}`);
