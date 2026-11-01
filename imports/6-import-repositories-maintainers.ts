import type { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";

import { importCollection } from "./utils/import-collection.js";
import { loadItemsFromDirectory } from "./utils/load-items-from-directory.js";

export default async (_directus: DIRECTUS_SERVICE) => {
  await importCollection(
    "repositories_maintainers",
    loadItemsFromDirectory(import.meta.dirname, "data/repositories-maintainers", { allowEmpty: true })
  );
};
