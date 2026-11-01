// Exports Directus system collections (roles, policies, permissions, flows...) to migrations/data.
// Kept for `yarn export:system:collections`. The logic lives in exports/export-system-collections.ts
// so it can also be selected from `yarn export:data:dev`.
import { cli } from "@tsed-cms/infra/bootstrap/cli.js";

import exportSystemCollections from "../../exports/export-system-collections.js";

await cli(() => exportSystemCollections());
