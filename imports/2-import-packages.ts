import type { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";

import { importCollection } from "./utils/import-collection.js";
import { loadItemsFromDirectory } from "./utils/load-items-from-directory.js";

// `maintainers` is an O2M alias: relations are imported by 3-import-packages-maintainers.ts.
export default async (_directus: DIRECTUS_SERVICE) => {
  await importCollection("packages", loadItemsFromDirectory(import.meta.dirname, "data/packages"), { omit: ["maintainers"] });
};
