import type { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";
import { logger } from "@tsed/di";

import { fetchSystemCollection, omitFields, sortBy, writeCollectionFiles } from "./utils/export-collection.js";
import { filterProjectFlows } from "./utils/project-scope.js";

// One file per flow under imports/data/directus-flows/, with its operations embedded.
// Flows using collections or operations that are not part of this project are skipped.
export default async (directus: DIRECTUS_SERVICE) => {
  logger().info("[export:flows] fetch flows and operations");
  const allFlows = await fetchSystemCollection(directus, "directus_flows", "/flows");
  const operations = sortBy(await fetchSystemCollection(directus, "directus_operations", "/operations"), (operation) => operation.id);
  const flows = sortBy(filterProjectFlows(allFlows, operations), (flow) => `${flow.name}:${flow.id}`).map((flow) =>
    omitFields(flow, ["operations"])
  );

  logger().info(`[export:flows] keep ${flows.length}/${allFlows.length} project flows`);

  await writeCollectionFiles("directus_flows", flows, {
    slugOf: (flow) => flow.name,
    extraOf: (flow) => ({ operations: operations.filter((operation) => operation.flow === flow.id) })
  });
  logger().info("[export:flows] complete");
};
