import type { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";
import { logger } from "@tsed/di";

import { fetchCollection, fetchCollectionByIds, sortBy, writeCollectionFiles } from "./utils/export-collection.js";

const PACKAGES_MAINTAINERS_FIELDS = ["id", "packages_id", "maintainers_id"];

// Exports packages and their maintainer relations. Maintainers themselves are exported by export-maintainers.ts.
export default async (directus: DIRECTUS_SERVICE) => {
  logger().info("[export:packages] fetch packages");
  const packages = sortBy(await fetchCollection(directus, "packages", { fields: ["*"] }), (item) => `${item.name}:${item.id}`);

  logger().info("[export:packages] fetch packages maintainers");
  const packagesMaintainers = sortBy(
    await fetchCollectionByIds(
      directus,
      "packages_maintainers",
      "packages_id",
      packages.map((item) => item.id),
      { fields: PACKAGES_MAINTAINERS_FIELDS }
    ),
    (item) => `${item.packages_id}:${item.maintainers_id}:${String(item.id).padStart(10, "0")}`
  );
  logger().info(`[export:packages] dependencies packages_maintainers=${packagesMaintainers.length}`);

  await writeCollectionFiles("packages", packages, { slugOf: (item) => item.name });
  await writeCollectionFiles("packages_maintainers", packagesMaintainers);
  logger().info("[export:packages] complete");
};
