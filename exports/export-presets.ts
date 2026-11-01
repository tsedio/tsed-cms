import type { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";
import { logger } from "@tsed/di";

import { fetchSystemCollection, sortBy, writeCollectionFiles } from "./utils/export-collection.js";
import { isProjectCollection } from "./utils/project-scope.js";

// Only global presets (no user, no role) of the project collections: user and role specific presets depend on the
// environment.
export default async (directus: DIRECTUS_SERVICE) => {
  logger().info("[export:presets] fetch presets");
  const presets = sortBy(
    (await fetchSystemCollection(directus, "directus_presets", "/presets")).filter(
      (preset) => preset.user == null && preset.role == null && isProjectCollection(preset.collection)
    ),
    (preset) => `${preset.collection}:${preset.bookmark ?? ""}:${preset.uuid ?? preset.id}`
  );

  await writeCollectionFiles("directus_presets", presets, {
    slugOf: (preset) => [preset.collection, preset.bookmark].filter(Boolean).join("-")
  });
  logger().info("[export:presets] complete");
};
