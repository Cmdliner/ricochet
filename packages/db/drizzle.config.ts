import { defineConfig } from "drizzle-kit";

// `generate` only reads the schema. `migrate` and `studio` need DATABASE_URL, which we
// read from the repo's .env when it exists.
try {
  process.loadEnvFile("../../.env");
} catch {
  // No .env yet. Fine for `generate`.
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://ricochet:ricochet@localhost:5432/ricochet",
  },
});
