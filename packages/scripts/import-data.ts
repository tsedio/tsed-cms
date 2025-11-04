// Script to import initial data into Directus collections using the Directus API
// This script should be run after schema application to ensure tables exist

import { join } from "node:path";

import { inject, logger } from "@tsed/di";
import { cli } from "@tsed-cms/infra/bootstrap/cli.js";
import { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";
import { globby } from "globby";
import path from "path";
import { fileURLToPath } from "url";

const importsScriptDir = fileURLToPath(join(path.dirname(import.meta.url), "../../imports"));

await cli(async () => {
  const directus = inject(DIRECTUS_SERVICE);
  let files = await globby([join(importsScriptDir, "*.ts")]);

  logger().info(`Found ${files.length} scripts in ${importsScriptDir}`);

  files = files.sort((a, b) => {
    const aNum = parseInt(path.basename(a).split("-")[0], 10);
    const bNum = parseInt(path.basename(b).split("-")[0], 10);
    return aNum - bNum;
  });

  for (const file of files) {
    logger().info(`Starting script: ${file}`);
    try {
      // Dynamically import the file
      const module = await import(file);
      if (module.default && typeof module.default === "function") {
        await module.default(directus);
        logger().info(`Successfully executing ${file}`);
      } else {
        logger().warn(`No default export found in ${file}`);
      }
    } catch (error: any) {
      logger().error(`Error importing data from ${file}: ${error.message}`);
    }
  }
});
