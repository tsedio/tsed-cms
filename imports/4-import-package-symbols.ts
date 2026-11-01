import type { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";

import { importCollection } from "./utils/import-collection.js";
import { loadItemsFromDirectory } from "./utils/load-items-from-directory.js";

// Requires packages: `package` is a M2O to packages.
export default async (_directus: DIRECTUS_SERVICE) => {
  await importCollection("package_symbols", loadItemsFromDirectory(import.meta.dirname, "data/package-symbols"));
};
