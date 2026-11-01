import type { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";

import { runImportScripts } from "./utils/run-import-scripts.js";

// Collection scripts are listed instead of bundles so shared parents (maintainers) are imported once.
const ALL_IMPORT_FILES = [
  "1-import-maintainers.ts",
  "2-import-packages.ts",
  "3-import-packages-maintainers.ts",
  "4-import-package-symbols.ts",
  "5-import-repositories.ts",
  "6-import-repositories-maintainers.ts",
  "7-import-sponsors.ts",
  "12-import-roles-permissions.ts",
  "13-import-flows.ts",
  "14-import-presets.ts"
] as const;

export default (directus: DIRECTUS_SERVICE) => runImportScripts("all", import.meta.url, ALL_IMPORT_FILES, directus);
