// Selects and runs an import script from the imports directory.
// This script should be run after schema application to ensure tables exist.
// Usage: yarn import:data:dev [script]   (e.g. `yarn import:data:dev all` or `yarn import:data:dev 10-import-packages-data`)
// Without argument, the scripts are listed in a prompt: import-all first, then `*-data.ts` bundles, then collection imports.

import path from "node:path";
import { fileURLToPath } from "node:url";

import { customEndpoint } from "@directus/sdk";
import { cli } from "@tsed-cms/infra/bootstrap/cli.js";
import { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";
import { inject, logger } from "@tsed/di";
import { globby } from "globby";

import { runScript, type ScriptChoice, selectScript } from "./utils/select-script.js";

const importsScriptDir = fileURLToPath(new URL("../../imports", import.meta.url));

function priority(fileName: string) {
  if (fileName === "import-all.ts") return 0;
  if (fileName.endsWith("-data.ts")) return 1;
  return 2;
}

function compareImportFiles(a: string, b: string) {
  const aName = path.basename(a);
  const bName = path.basename(b);
  const aNumber = parseInt(aName, 10);
  const bNumber = parseInt(bName, 10);

  return (
    priority(aName) - priority(bName) ||
    (!Number.isNaN(aNumber) && !Number.isNaN(bNumber) ? aNumber - bNumber : 0) ||
    aName.localeCompare(bName)
  );
}

const GROUPS = ["All data", "Data bundles", "Collection imports"];

await cli(async () => {
  const directus = inject(DIRECTUS_SERVICE);
  const files = (await globby([path.join(importsScriptDir, "*.ts")])).sort(compareImportFiles);

  if (files.length === 0) {
    throw new Error(`No import scripts found in ${importsScriptDir}.`);
  }

  const choices: ScriptChoice[] = files.map((file) => {
    const fileName = path.basename(file);
    const scriptName = fileName === "import-all.ts" ? "all" : fileName.replace(/^\d+-import-/, "").replace(/\.ts$/, "");

    return {
      name: `${scriptName} (${fileName})`,
      value: file,
      group: GROUPS[priority(fileName)]
    };
  });

  // Scripts may ask extra questions (e.g. which flows to import) only when the user picked them from the prompt.
  const interactive = !process.argv[2];
  const script = await selectScript(choices, "Select an import script to run:");

  // `yarn snapshot:apply` writes the schema straight to the database: a running Directus keeps the previous schema in
  // its memory cache and answers "collection does not exist" until it is cleared.
  logger().info("Clearing Directus cache (schema included)");
  await directus.request(customEndpoint({ path: "/utils/cache/clear", method: "POST", params: { system: true } }));

  await runScript(script, directus, { interactive });
});
