import { defineConfig } from "vitest/config";
import { TEST_DATABASE_URL, TEST_REDIS_URL } from "./test/env.js";

export default defineConfig({
  test: {
    globals: true,
    include: ["test/**/*.e2e.ts"],
    globalSetup: ["./test/global-setup.ts"],
    // Every file boots the whole API against the same database, so they take turns.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 30_000,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: TEST_DATABASE_URL,
      REDIS_URL: TEST_REDIS_URL,
      JWT_SECRET: "e2e-secret-e2e-secret-e2e-secret-e2e-secret",
      PUSH_PROVIDER: "log",
      MEDIA_PROVIDER: "local",
      MEDIA_LOCAL_DIR: "./.media-e2e",
    },
  },
});
