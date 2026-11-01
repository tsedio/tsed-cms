// Selects and runs export scripts from the exports directory.
// Usage: yarn export:data:dev [script...]   (e.g. `yarn export:data:dev all` or `yarn export:data:dev export-packages export-sponsors`)
// Without argument, the available `exports/export-*.ts` scripts are listed in a prompt. Several scripts run in order.

import path from "node:path";
import { fileURLToPath } from "node:url";

import { cli } from "@tsed-cms/infra/bootstrap/cli.js";
// Registered before the injector loads so its $onDestroy hook closes the Knex pool used by
// export-system-collections.ts. Registered from a dynamically imported script, the pool stays open and the
// process never exits.
import "@tsed-cms/infra/database/DbService.js";
import { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";
import { inject } from "@tsed/di";
import { globby } from "globby";

import { runScript, type ScriptChoice, selectScript } from "./utils/select-script.js";

const exportsScriptDir = fileURLToPath(new URL("../../exports", import.meta.url));

await cli(async () => {
  const directus = inject(DIRECTUS_SERVICE);
  const files = (await globby([path.join(exportsScriptDir, "export-*.ts")])).sort((a, b) => {
    const priority = (file: string) => (path.basename(file) === "export-all.ts" ? 0 : 1);
    return priority(a) - priority(b) || path.basename(a).localeCompare(path.basename(b));
  });

  if (files.length === 0) {
    throw new Error(`No export scripts found in ${exportsScriptDir}.`);
  }

  const choices: ScriptChoice[] = files.map((file) => {
    const fileName = path.basename(file);
    const isAll = fileName === "export-all.ts";

    return {
      name: `${fileName.replace(/^export-/, "").replace(/\.ts$/, "")} (${fileName})`,
      value: file,
      group: isAll ? "All data" : "Domain exports"
    };
  });

  const scriptNames = process.argv.slice(2);

  if (scriptNames.length <= 1) {
    await runScript(await selectScript(choices, "Select an export script to run:"), directus);
    return;
  }

  // Resolve every name first, so a typo fails before any export runs.
  const scripts = await Promise.all(scriptNames.map((name) => selectScript(choices, "", name)));

  for (const script of scripts) {
    await runScript(script, directus);
  }
});
