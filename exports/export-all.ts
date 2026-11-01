import type { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";
import { logger } from "@tsed/di";

import exportDashboards from "./export-dashboards.js";
import exportFlows from "./export-flows.js";
import exportMaintainers from "./export-maintainers.js";
import exportPackageSymbols from "./export-package-symbols.js";
import exportPackages from "./export-packages.js";
import exportPresets from "./export-presets.js";
import exportRepositories from "./export-repositories.js";
import exportRolesPermissions from "./export-roles-permissions.js";
import exportSponsors from "./export-sponsors.js";
import exportSystemCollections from "./export-system-collections.js";
import { formatError } from "./utils/export-collection.js";

type ExportScript = (directus: DIRECTUS_SERVICE) => Promise<void>;

const EXPORT_SCRIPTS: ReadonlyArray<readonly [string, ExportScript]> = [
  ["export-maintainers.ts", exportMaintainers],
  ["export-packages.ts", exportPackages],
  ["export-package-symbols.ts", exportPackageSymbols],
  ["export-repositories.ts", exportRepositories],
  ["export-sponsors.ts", exportSponsors],
  ["export-roles-permissions.ts", exportRolesPermissions],
  ["export-flows.ts", exportFlows],
  ["export-presets.ts", exportPresets],
  ["export-dashboards.ts", exportDashboards],
  ["export-system-collections.ts", exportSystemCollections]
];

export default async (directus: DIRECTUS_SERVICE) => {
  logger().info(`[export:all] start ${EXPORT_SCRIPTS.length} scripts`);

  for (const [index, [fileName, exportScript]] of EXPORT_SCRIPTS.entries()) {
    logger().info(`[export:all] step ${index + 1}/${EXPORT_SCRIPTS.length} ${fileName}`);

    try {
      await exportScript(directus);
      logger().info(`[export:all] done ${fileName}`);
    } catch (error) {
      logger().error(`[export:all] fail ${fileName}\n${formatError(error)}`);
      throw error;
    }
  }

  logger().info("[export:all] complete");
};
