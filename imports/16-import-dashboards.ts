import fs from "node:fs";
import path from "node:path";

import type { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";
import { logger } from "@tsed/di";

import { importSystemCollection, requestSystem, type SystemItem } from "./utils/import-system-collection.js";

type DashboardBundle = {
  items: SystemItem[];
  panels?: SystemItem[];
};

function loadDashboardBundles(): DashboardBundle[] {
  const directory = path.join(import.meta.dirname, "data/directus-dashboards");

  if (!fs.existsSync(directory)) {
    throw new Error(`Missing collection directory: ${directory}`);
  }

  return fs
    .readdirSync(directory)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b))
    .map((fileName) => JSON.parse(fs.readFileSync(path.join(directory, fileName), "utf8")) as DashboardBundle);
}

// Imports Insights dashboards and their panels. Panels of an imported dashboard that are not in the export are deleted.
export default async (_directus: DIRECTUS_SERVICE) => {
  const bundles = loadDashboardBundles();
  const dashboards = bundles.flatMap((bundle) => bundle.items);
  const dashboardIds = new Set(dashboards.map((dashboard) => dashboard.id));
  const panels = bundles.flatMap((bundle) => bundle.panels ?? []).filter((panel) => dashboardIds.has(panel.dashboard));
  const panelIds = new Set(panels.map((panel) => panel.id));

  await importSystemCollection("directus_dashboards", dashboards, { endpoint: "/dashboards", omit: ["panels"] });

  const stalePanels = (await requestSystem<SystemItem[]>("/panels")).filter(
    (panel) => dashboardIds.has(panel.dashboard) && !panelIds.has(panel.id)
  );

  for (const panel of stalePanels) {
    await requestSystem(`/panels/${panel.id}`, "DELETE");
    logger().info(`Item directus_panels ${panel.id} deleted (not in the export)`);
  }

  await importSystemCollection("directus_panels", panels, { endpoint: "/panels" });
};
