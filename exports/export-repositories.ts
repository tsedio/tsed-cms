import type { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";
import { logger } from "@tsed/di";

import { fetchCollection, fetchCollectionByIds, sortBy, writeCollectionFiles } from "./utils/export-collection.js";

const REPOSITORIES_MAINTAINERS_FIELDS = ["id", "repositories_id", "maintainers_id"];

// Exports repositories and their maintainer relations. Maintainers themselves are exported by export-maintainers.ts.
export default async (directus: DIRECTUS_SERVICE) => {
  logger().info("[export:repositories] fetch repositories");
  const repositories = sortBy(
    await fetchCollection(directus, "repositories", { fields: ["*"] }),
    (item) => `${item.owner}/${item.repo}:${item.id}`
  );

  logger().info("[export:repositories] fetch repositories maintainers");
  const repositoriesMaintainers = sortBy(
    await fetchCollectionByIds(
      directus,
      "repositories_maintainers",
      "repositories_id",
      repositories.map((item) => item.id),
      { fields: REPOSITORIES_MAINTAINERS_FIELDS }
    ),
    (item) => `${item.repositories_id}:${item.maintainers_id}:${String(item.id).padStart(10, "0")}`
  );
  logger().info(`[export:repositories] dependencies repositories_maintainers=${repositoriesMaintainers.length}`);

  await writeCollectionFiles("repositories", repositories, { slugOf: (item) => `${item.owner}-${item.repo}` });
  await writeCollectionFiles("repositories_maintainers", repositoriesMaintainers);
  logger().info("[export:repositories] complete");
};
