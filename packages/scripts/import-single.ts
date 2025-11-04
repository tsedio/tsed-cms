// Script to import a single script from the imports directory
// Usage: node import-single.ts
// The script will display a list of available import scripts and allow the user to select one

import { join } from "node:path";

import { inject, logger } from "@tsed/di";
import { cli } from "@tsed-cms/infra/bootstrap/cli.js";
import { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";
import { globby } from "globby";
// @ts-ignore
import inquirer from "inquirer";
import path from "path";
import { fileURLToPath } from "url";

const importsScriptDir = fileURLToPath(join(path.dirname(import.meta.url), "../../imports"));

await cli(async () => {
  const directus = inject(DIRECTUS_SERVICE);

  // Get all available import scripts
  let allFiles = await globby([join(importsScriptDir, "*.ts")]);

  if (allFiles.length === 0) {
    logger().error("No import scripts found in the imports directory.");
    process.exit(1);
  }

  allFiles = allFiles.sort((a, b) => {
    const aNum = parseInt(path.basename(a).split("-")[0], 10);
    const bNum = parseInt(path.basename(b).split("-")[0], 10);
    return aNum - bNum;
  });

  // Create a list of script choices for inquirer
  const scriptChoices = allFiles.map((file) => {
    const fileName = path.basename(file);
    const scriptName = fileName.replace(/^\d+-import-/, "").replace(/\.ts$/, "");
    return {
      name: `${scriptName} (${fileName})`,
      value: file
    };
  });

  // Sort the choices alphabetically by script name

  // scriptChoices.sort((a, b) => a.name.localeCompare(b.name));

  // Use inquirer to prompt the user to select a script
  const { selectedScript } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedScript",
      message: "Select an import script to run:",
      choices: scriptChoices
    }
  ]);

  const file = selectedScript;
  logger().info(`Starting script: ${file}`);

  try {
    // Dynamically import the file
    const module = await import(file);
    if (module.default && typeof module.default === "function") {
      await module.default(directus);
      logger().info(`Successfully executed ${file}`);
    } else {
      logger().warn(`No default export found in ${file}`);
    }
  } catch (error: any) {
    logger().error(`Error importing data from ${file}: ${error.message}`);
  }
});
