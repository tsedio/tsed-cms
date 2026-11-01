import type { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";
import { logger } from "@tsed/di";

import { fetchCollection, sortBy, writeCollectionFiles } from "./utils/export-collection.js";

export default async (directus: DIRECTUS_SERVICE) => {
  logger().info("[export:maintainers] fetch maintainers");
  const maintainers = sortBy(await fetchCollection(directus, "maintainers", { fields: ["*"] }), (item) => `${item.username}:${item.id}`);

  await writeCollectionFiles("maintainers", maintainers, { slugOf: (item) => item.username });
  logger().info("[export:maintainers] complete");
};
