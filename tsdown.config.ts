import { globbySync } from "globby";
import { defineConfig } from "tsdown";

export default defineConfig({
  // Type declarations must not be emitted: Directus would load them as migrations.
  entry: globbySync(["./migrations/*.ts", "!./migrations/*.d.ts"]),
  outDir: "./migrations/dist",
  format: "esm",
  platform: "node",
  external: ["directus", /@directus\//]
});
