#!/usr/bin/env node
import { join } from "node:path";

import { updateCheck } from "@directus/update-check";
import dotenvExpand from "dotenv-expand";
import dotenv from "dotenv-flow";

import { version } from "./version.js";

dotenvExpand.expand(
  dotenv.config({
    path: join(process.cwd(), "config")
  })
);

console.log(`=== Patched Directus CLI v${version}`);

if (process.env.DEBUG_ENV === "true") {
  console.log("Debugging environment variables:");
  console.log(process.env);
}

if (version && process.env.UPDATE_CHECK !== "false") {
  await updateCheck(version);
}

if (process.argv.includes("bootstrap") && process.env.SKIP_BOOTSTRAP === "true") {
  console.log("Skipping bootstrap for patched Directus CLI.");
  process.exit(0);
}

import("@directus/api/cli/run.js");
