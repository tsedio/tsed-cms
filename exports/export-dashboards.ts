import type { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";
import { logger } from "@tsed/di";

import { fetchSystemCollection, omitFields, sortBy, writeCollectionFiles } from "./utils/export-collection.js";
import { filterProjectDashboards } from "./utils/project-scope.js";

// One file per Insights dashboard under imports/data/directus-dashboards/, with its panels embedded.
// Dashboards with panels on collections that are not part of this project are skipped.
export default async (directus: DIRECTUS_SERVICE) => {
  logger().info("[export:dashboards] fetch dashboards and panels");
  const allDashboards = await fetchSystemCollection(directus, "directus_dashboards", "/dashboards");
  const panels = sortBy(await fetchSystemCollection(directus, "directus_panels", "/panels"), (panel) => panel.id);
  const dashboards = sortBy(filterProjectDashboards(allDashboards, panels), (dashboard) => `${dashboard.name}:${dashboard.id}`).map(
    (dashboard) => omitFields(dashboard, ["panels"])
  );

  logger().info(`[export:dashboards] keep ${dashboards.length}/${allDashboards.length} project dashboards`);

  await writeCollectionFiles("directus_dashboards", dashboards, {
    slugOf: (dashboard) => dashboard.name,
    extraOf: (dashboard) => ({ panels: panels.filter((panel) => panel.dashboard === dashboard.id) })
  });
  logger().info("[export:dashboards] complete");
};
