import type { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";

import { importSystemCollection } from "./utils/import-system-collection.js";
import { loadItemsFromDirectory } from "./utils/load-items-from-directory.js";

// Preset ids are auto-increment integers: global presets are matched on uuid, then on collection + bookmark.
export default async (_directus: DIRECTUS_SERVICE) => {
  const presets = loadItemsFromDirectory(import.meta.dirname, "data/directus-presets").filter(
    (preset) => preset.user == null && preset.role == null
  );

  await importSystemCollection("directus_presets", presets, {
    endpoint: "/presets",
    autoIncrementId: true,
    match: (item, existingItems) =>
      (item.uuid ? existingItems.find((existing) => existing.uuid === item.uuid) : undefined) ??
      existingItems.find(
        (existing) =>
          existing.user == null &&
          existing.role == null &&
          existing.collection === item.collection &&
          (existing.bookmark ?? null) === (item.bookmark ?? null)
      )
  });
};
