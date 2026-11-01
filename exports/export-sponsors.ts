import type { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";
import { logger } from "@tsed/di";

import { fetchCollection, sortBy, writeCollectionFiles } from "./utils/export-collection.js";

export default async (directus: DIRECTUS_SERVICE) => {
  logger().info("[export:sponsors] fetch sponsors");
  const sponsors = sortBy(await fetchCollection(directus, "sponsors", { fields: ["*"] }), (item) => `${item.login}:${item.id}`);

  await writeCollectionFiles("sponsors", sponsors, { slugOf: (item) => item.login });
  logger().info("[export:sponsors] complete");
};
