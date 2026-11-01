import type { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";
import { logger } from "@tsed/di";

import { fetchCollection, sortBy, writeCollectionFiles } from "./utils/export-collection.js";

export default async (directus: DIRECTUS_SERVICE) => {
  logger().info("[export:package_symbols] fetch package symbols");
  const symbols = sortBy(
    await fetchCollection(directus, "package_symbols", { fields: ["*"] }),
    (item) => `${item.package}:${item.name}:${item.id}`
  );

  await writeCollectionFiles("package_symbols", symbols, { slugOf: (item) => item.name });
  logger().info("[export:package_symbols] complete");
};
