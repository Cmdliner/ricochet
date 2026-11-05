import { defineConfig } from "tsup";

// Builds both module formats so every consumer works: Next and Metro read the ESM build,
// NestJS (CommonJS) and the Tailwind config read the CJS build.
export default defineConfig({
  entry: ["src/index.ts", "src/tokens.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
});
