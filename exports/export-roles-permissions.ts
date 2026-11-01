import type { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";
import { logger } from "@tsed/di";

import {
  ADMINISTRATOR_ROLE_PLACEHOLDER,
  fetchSystemCollection,
  omitFields,
  PUBLIC_POLICY_PLACEHOLDER,
  replaceIds,
  sortBy,
  writeCollectionFiles
} from "./utils/export-collection.js";
import { isProjectCollection, PROJECT_POLICIES, PROJECT_ROLES } from "./utils/project-scope.js";

const ADMINISTRATOR = "Administrator";
const PUBLIC_POLICY = "$t:public_label";

// Exports the project roles/policies (PROJECT_ROLES / PROJECT_POLICIES), their role accesses, and the permissions of
// those policies and of the Public policy on project collections. The ids of the Administrator role and Public policy
// are replaced by placeholders, since they differ per environment.
export default async (directus: DIRECTUS_SERVICE) => {
  logger().info("[export:roles-permissions] fetch roles, policies, permissions and accesses");
  const [roles, policies, permissions, accesses] = await Promise.all([
    fetchSystemCollection(directus, "directus_roles", "/roles"),
    fetchSystemCollection(directus, "directus_policies", "/policies"),
    fetchSystemCollection(directus, "directus_permissions", "/permissions"),
    fetchSystemCollection(directus, "directus_access", "/access")
  ]);

  const administratorRoleId = roles.find((role) => role.name === ADMINISTRATOR)?.id;
  const administratorPolicyId = policies.find((policy) => policy.name === ADMINISTRATOR)?.id;
  const publicPolicyId = policies.find((policy) => policy.name === PUBLIC_POLICY)?.id;
  const replacements = { [ADMINISTRATOR_ROLE_PLACEHOLDER]: administratorRoleId, [PUBLIC_POLICY_PLACEHOLDER]: publicPolicyId };

  const projectRoles = roles.filter((role) => role.id !== administratorRoleId && PROJECT_ROLES.includes(role.name));
  const projectPolicies = policies.filter(
    (policy) => policy.id !== administratorPolicyId && policy.id !== publicPolicyId && PROJECT_POLICIES.includes(policy.name)
  );
  const roleIds = new Set(projectRoles.map((role) => role.id));
  const policyIds = new Set([...projectPolicies.map((policy) => policy.id), publicPolicyId]);

  const exportedRoles = sortBy(
    projectRoles.map((role) => omitFields(role, ["users", "children", "policies"])),
    (role) => `${role.name}:${role.id}`
  );
  const exportedPolicies = sortBy(
    projectPolicies.map((policy) => omitFields(policy, ["users", "roles", "permissions"])),
    (policy) => `${policy.name}:${policy.id}`
  );
  const exportedPermissions = sortBy(
    permissions
      .filter((permission) => policyIds.has(permission.policy as string) && isProjectCollection(permission.collection))
      .map((permission) => replaceIds(permission, replacements)),
    (permission) => `${permission.policy}:${permission.collection}:${permission.action}`
  );
  // User accesses depend on the environment users, so only accesses between project roles and policies are kept.
  const exportedAccesses = sortBy(
    accesses
      .filter((access) => access.user == null && roleIds.has(access.role as string) && policyIds.has(access.policy as string))
      .map((access) => replaceIds(access, replacements)),
    (access) => `${access.role}:${access.policy}:${access.id}`
  );

  logger().info(
    `[export:roles-permissions] keep roles=${exportedRoles.length}/${roles.length} policies=${exportedPolicies.length}/${policies.length} permissions=${exportedPermissions.length}/${permissions.length} accesses=${exportedAccesses.length}/${accesses.length}`
  );

  await writeCollectionFiles("directus_roles", exportedRoles, { slugOf: (role) => role.name });
  await writeCollectionFiles("directus_policies", exportedPolicies, { slugOf: (policy) => policy.name });
  await writeCollectionFiles("directus_permissions", exportedPermissions, {
    slugOf: (permission) => `${permission.collection}-${permission.action}`
  });
  await writeCollectionFiles("directus_access", exportedAccesses);
  logger().info("[export:roles-permissions] complete");
};
