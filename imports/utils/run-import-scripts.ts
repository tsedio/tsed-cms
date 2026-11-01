import type { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";
import { logger } from "@tsed/di";

/**
 * Runs import scripts in the given order. Used by the `*-data.ts` bundles and `import-all.ts`.
 * Stops at the first failure.
 */
export async function runImportScripts(label: string, baseUrl: string, fileNames: readonly string[], directus: DIRECTUS_SERVICE) {
  logger().info(`[import:${label}] start ${fileNames.length} scripts`);

  for (const [index, fileName] of fileNames.entries()) {
    logger().info(`[import:${label}] step ${index + 1}/${fileNames.length} ${fileName}`);

    try {
      const module = await import(new URL(`./${fileName}`, baseUrl).href);

      if (!module.default || typeof module.default !== "function") {
        throw new Error(`No default export found in ${fileName}`);
      }

      await module.default(directus);
      logger().info(`[import:${label}] done ${fileName}`);
    } catch (error) {
      const message = error instanceof Error ? `${error.message}\n${error.stack ?? ""}` : JSON.stringify(error, null, 2);
      logger().error(`[import:${label}] fail ${fileName}\n${message}`);
      throw error;
    }
  }

  logger().info(`[import:${label}] complete`);
}
