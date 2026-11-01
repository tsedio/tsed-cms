import fs from "node:fs";
import path from "node:path";

// The local Directus database can hold data from other projects (shared instance). Exports keep only what belongs to
// this project: collections from snapshots/snapshot-latest.yaml, operations from this repo's extensions, and the
// roles/policies listed below.

/** Roles exported in addition to the schema based filters. The Administrator role is never exported. */
export const PROJECT_ROLES = ["API - readOnly"];
/** Policies exported in addition to the schema based filters. Administrator and Public are never exported. */
export const PROJECT_POLICIES = ["ReadOnly", "Benchmark publisher"];

const ROOT_DIRECTORY = path.join(import.meta.dirname, "../..");

const BUILT_IN_OPERATIONS = new Set([
  "condition",
  "exec",
  "item-create",
  "item-delete",
  "item-read",
  "item-update",
  "json-web-token",
  "log",
  "mail",
  "notification",
  "request",
  "sleep",
  "throw-error",
  "transform",
  "trigger"
]);

let projectCollections: Set<string> | undefined;

/** Collections declared in the `collections:` section of the schema snapshot. */
export function getProjectCollections() {
  if (!projectCollections) {
    const snapshot = fs.readFileSync(path.join(ROOT_DIRECTORY, "snapshots/snapshot-latest.yaml"), "utf8");
    const section = snapshot.split(/^collections:$/m)[1]?.split(/^\S/m)[0] ?? "";

    projectCollections = new Set([...section.matchAll(/^ {2}- collection: (\S+)$/gm)].map((match) => match[1]));
  }

  return projectCollections;
}

export function isProjectCollection(collection: string | null | undefined) {
  return !!collection && (collection.startsWith("directus_") || getProjectCollections().has(collection));
}

function getProjectOperations() {
  const extensions = fs.readdirSync(path.join(ROOT_DIRECTORY, "extensions"), { withFileTypes: true });
  return new Set([...BUILT_IN_OPERATIONS, ...extensions.filter((entry) => entry.isDirectory()).map((entry) => entry.name)]);
}

function referencedCollections(value: unknown, collections = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    value.forEach((item) => referencedCollections(item, collections));
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (key === "collection" || key === "collections") {
        [item].flat().forEach((name) => typeof name === "string" && collections.add(name));
      } else {
        referencedCollections(item, collections);
      }
    }
  }

  return collections;
}

type FlowLike = { id: string; options?: unknown };
type OperationLike = { flow?: unknown; type?: string | null; options?: unknown };

/**
 * Keeps flows whose collections belong to the schema and whose operations exist in this repo.
 * Flows only triggered by an excluded flow (trigger operation) are excluded too.
 */
export function filterProjectFlows<Flow extends FlowLike>(flows: Flow[], operations: OperationLike[]) {
  const projectOperations = getProjectOperations();
  const operationsOf = (flow: Flow) => operations.filter((operation) => operation.flow === flow.id);
  const excluded = new Set(
    flows
      .filter((flow) => {
        const flowOperations = operationsOf(flow);
        const collections = referencedCollections([flow.options, flowOperations.map((operation) => operation.options)]);

        return (
          [...collections].some((collection) => !isProjectCollection(collection)) ||
          flowOperations.some((operation) => !projectOperations.has(String(operation.type)))
        );
      })
      .map((flow) => flow.id)
  );

  // Propagate to flows started by an excluded flow.
  for (const operation of operations) {
    const target = (operation.options as { flow?: string } | null)?.flow;
    if (operation.type === "trigger" && target && excluded.has(String(operation.flow))) {
      excluded.add(target);
    }
  }

  return flows.filter((flow) => !excluded.has(flow.id));
}

type DashboardLike = { id: string };
type PanelLike = { dashboard?: unknown; options?: unknown };

/** Keeps dashboards whose panels only use project collections. */
export function filterProjectDashboards<Dashboard extends DashboardLike>(dashboards: Dashboard[], panels: PanelLike[]) {
  return dashboards.filter((dashboard) => {
    const options = panels.filter((panel) => panel.dashboard === dashboard.id).map((panel) => panel.options);
    return [...referencedCollections(options)].every((collection) => isProjectCollection(collection));
  });
}
