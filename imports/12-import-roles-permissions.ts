import type { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";
import { logger } from "@tsed/di";

import { importSystemCollection, requestSystem, type SystemItem } from "./utils/import-system-collection.js";
import { loadItemsFromDirectory } from "./utils/load-items-from-directory.js";

const ADMINISTRATOR_ROLE_PLACEHOLDER = "{{ID_ROLE_ADMINISTRATOR}}";
const PUBLIC_POLICY_PLACEHOLDER = "{{ID_POLICY_PUBLIC}}";

/** Replaces `"<key>"` by `"<value>"` everywhere in the items. */
function remapIds<T>(items: T[], ids: Map<string, string>): T[] {
  if (ids.size === 0) return items;

  let content = JSON.stringify(items);
  ids.forEach((target, source) => {
    content = content.replaceAll(`"${source}"`, `"${target}"`);
  });

  return JSON.parse(content);
}

// Matches by id, then by name. When the name matches another id, later references are remapped to the target id.
function matchByIdOrName(ids: Map<string, string>) {
  return (item: SystemItem, existingItems: SystemItem[]) => {
    const existingItem =
      existingItems.find((existing) => existing.id === item.id) ?? existingItems.find((existing) => existing.name === item.name);

    if (existingItem && existingItem.id !== item.id) {
      logger().warn(`[import:roles-permissions] "${item.name}" exists with another id: ${item.id} -> ${existingItem.id}`);
      ids.set(item.id, existingItem.id);
    }

    return existingItem;
  };
}

export default async (_directus: DIRECTUS_SERVICE) => {
  const [targetRoles, targetPolicies] = await Promise.all([
    requestSystem<SystemItem[]>("/roles"),
    requestSystem<SystemItem[]>("/policies")
  ]);
  const ids = new Map<string, string>();
  const administratorRoleId = targetRoles.find((role) => role.name === "Administrator")?.id;
  const publicPolicyId = targetPolicies.find((policy) => policy.name === "$t:public_label")?.id;

  if (administratorRoleId) ids.set(ADMINISTRATOR_ROLE_PLACEHOLDER, administratorRoleId);
  if (publicPolicyId) ids.set(PUBLIC_POLICY_PLACEHOLDER, publicPolicyId);

  const roles = loadItemsFromDirectory(import.meta.dirname, "data/directus-roles");
  await importSystemCollection("directus_roles", roles, { endpoint: "/roles", omit: ["parent"], match: matchByIdOrName(ids) });
  // Parents are set once every role exists.
  await importSystemCollection(
    "directus_roles",
    remapIds(roles, ids).map(({ id, parent }) => ({ id, parent })),
    { endpoint: "/roles" }
  );

  await importSystemCollection("directus_policies", loadItemsFromDirectory(import.meta.dirname, "data/directus-policies"), {
    endpoint: "/policies",
    match: matchByIdOrName(ids)
  });

  // Permission ids are auto-increment integers: they are matched on policy + collection + action instead.
  await importSystemCollection(
    "directus_permissions",
    remapIds(loadItemsFromDirectory(import.meta.dirname, "data/directus-permissions", { allowEmpty: true }), ids),
    {
      endpoint: "/permissions",
      autoIncrementId: true,
      match: (item, existingItems) =>
        existingItems.find(
          (existing) => existing.policy === item.policy && existing.collection === item.collection && existing.action === item.action
        )
    }
  );

  await importSystemCollection(
    "directus_access",
    remapIds(loadItemsFromDirectory(import.meta.dirname, "data/directus-access", { allowEmpty: true }), ids),
    {
      endpoint: "/access",
      match: (item, existingItems) =>
        existingItems.find((existing) => existing.id === item.id) ??
        existingItems.find((existing) => existing.role === item.role && existing.user == null && existing.policy === item.policy)
    }
  );
};
