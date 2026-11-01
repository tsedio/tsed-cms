import type { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";

import { runImportScripts } from "./utils/run-import-scripts.js";

const PACKAGES_IMPORT_FILES = [
  "1-import-maintainers.ts",
  "2-import-packages.ts",
  "3-import-packages-maintainers.ts",
  "4-import-package-symbols.ts"
] as const;

export default (directus: DIRECTUS_SERVICE) => runImportScripts("packages", import.meta.url, PACKAGES_IMPORT_FILES, directus);
