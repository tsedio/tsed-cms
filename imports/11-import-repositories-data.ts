import type { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";

import { runImportScripts } from "./utils/run-import-scripts.js";

const REPOSITORIES_IMPORT_FILES = ["1-import-maintainers.ts", "5-import-repositories.ts", "6-import-repositories-maintainers.ts"] as const;

export default (directus: DIRECTUS_SERVICE) => runImportScripts("repositories", import.meta.url, REPOSITORIES_IMPORT_FILES, directus);
