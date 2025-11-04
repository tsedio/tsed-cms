import { globbySync } from "globby";
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: globbySync("./migrations/*.ts"),
  outDir: "./migrations/dist",
  format: "esm",
  platform: "node",
  external: ["directus", /@directus\//]
});
