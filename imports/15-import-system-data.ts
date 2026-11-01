import type { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";

import { runImportScripts } from "./utils/run-import-scripts.js";

const SYSTEM_IMPORT_FILES = [
  "12-import-roles-permissions.ts",
  "13-import-flows.ts",
  "14-import-presets.ts",
  "16-import-dashboards.ts"
] as const;

export default (directus: DIRECTUS_SERVICE) => runImportScripts("system", import.meta.url, SYSTEM_IMPORT_FILES, directus);
