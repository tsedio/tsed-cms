import fs from "node:fs";
import path from "node:path";

import type { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";
import { logger } from "@tsed/di";
// @ts-ignore
import inquirer from "inquirer";

import { importSystemCollection, requestSystem, type SystemItem } from "./utils/import-system-collection.js";

type FlowBundle = {
  items: SystemItem[];
  operations?: SystemItem[];
};

type ImportFlowsOptions = {
  /** Lets the user pick the flows to import (set by `yarn import:data:*` when run from the prompt). */
  interactive?: boolean;
};

function loadFlowBundles(): FlowBundle[] {
  const directory = path.join(import.meta.dirname, "data/directus-flows");

  if (!fs.existsSync(directory)) {
    throw new Error(`Missing collection directory: ${directory}`);
  }

  return fs
    .readdirSync(directory)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b))
    .map((fileName) => JSON.parse(fs.readFileSync(path.join(directory, fileName), "utf8")) as FlowBundle);
}

async function selectFlows(flows: SystemItem[]) {
  const { selectedIds } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "selectedIds",
      message: "Select flow(s) to import:",
      choices: flows.map((flow) => ({ name: `${flow.name} (${flow.id})`, value: flow.id, checked: true })),
      pageSize: 20,
      validate: (input: string[]) => (input.length > 0 ? true : "Select at least one flow.")
    }
  ]);

  return flows.filter((flow) => selectedIds.includes(flow.id));
}

// Operations reference each other (resolve/reject, unique) and the flow references its first operation,
// so the import runs in passes: flows, operations without links, links, then the flow entry operation.
export default async (_directus: DIRECTUS_SERVICE, options: ImportFlowsOptions = {}) => {
  const bundles = loadFlowBundles();
  let flows = bundles.flatMap((bundle) => bundle.items);

  if (options.interactive) {
    flows = await selectFlows(flows);
  }

  const flowIds = new Set(flows.map((flow) => flow.id));
  const operations = bundles.flatMap((bundle) => bundle.operations ?? []).filter((operation) => flowIds.has(operation.flow));
  const operationIds = new Set(operations.map((operation) => operation.id));

  await importSystemCollection("directus_flows", flows, { endpoint: "/flows", omit: ["operation", "operations"] });

  const existingOperations = (await requestSystem<SystemItem[]>("/operations")).filter((operation) => flowIds.has(operation.flow));
  const staleOperations = existingOperations.filter((operation) => !operationIds.has(operation.id));
  const wantedLinks = new Map(operations.map((operation) => [operation.id, operation]));

  // Detach links that will change (and stale operations) to avoid unique constraint conflicts on resolve/reject.
  for (const operation of existingOperations) {
    const wanted = wantedLinks.get(operation.id);
    const detach = !wanted || wanted.resolve !== operation.resolve || wanted.reject !== operation.reject;

    if (detach && (operation.resolve || operation.reject)) {
      await requestSystem(`/operations/${operation.id}`, "PATCH", { resolve: null, reject: null });
    }
  }

  const existingFlows = await requestSystem<SystemItem[]>("/flows");
  for (const operation of staleOperations) {
    const owner = existingFlows.find((flow) => flow.operation === operation.id);
    if (owner) {
      await requestSystem(`/flows/${owner.id}`, "PATCH", { operation: null });
    }

    await requestSystem(`/operations/${operation.id}`, "DELETE");
    logger().info(`Item directus_operations ${operation.id} deleted (not in the export)`);
  }

  await importSystemCollection("directus_operations", operations, { endpoint: "/operations", omit: ["resolve", "reject"] });
  await importSystemCollection(
    "directus_operations",
    operations.map(({ id, resolve, reject }) => ({ id, resolve, reject })),
    { endpoint: "/operations" }
  );
  await importSystemCollection(
    "directus_flows",
    flows.map(({ id, operation }) => ({ id, operation })),
    { endpoint: "/flows" }
  );
};
