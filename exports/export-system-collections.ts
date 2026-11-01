import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { DATABASE } from "@tsed-cms/infra/database/DbService.js";
import type { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";
import { inject, logger } from "@tsed/di";
import type { Knex } from "knex";

import { filterProjectFlows, isProjectCollection, PROJECT_POLICIES, PROJECT_ROLES } from "./utils/project-scope.js";

// System collections are versioned in migrations/data and installed by the *-update-all.ts migration.
// They are read through Knex (not the REST API) to keep raw rows identical to what the migration inserts.
const SYSTEM_COLLECTIONS = [
  "directus_roles",
  "directus_policies",
  "directus_permissions",
  "directus_access",
  "directus_presets",
  "directus_flows",
  "directus_operations"
] as const;

type SystemCollection = (typeof SYSTEM_COLLECTIONS)[number];

const MIGRATIONS_DIRECTORY = path.join(import.meta.dirname, "../migrations");

export function getAdministratorRoleId(knex: Knex): Promise<string | null> {
  return knex("directus_roles")
    .select("id")
    .where({ name: "Administrator" })
    .first()
    .then((role) => (role ? role.id : null));
}

type ProjectScope = {
  roleIds: Set<string>;
  policyIds: Set<string>;
  flowIds: Set<string>;
};

// Only keeps the data of this project (see exports/utils/project-scope.ts): the database may be shared with other projects.
async function getProjectScope(knex: Knex): Promise<ProjectScope> {
  const [roles, policies, flows, operations] = await Promise.all([
    knex("directus_roles").select("id", "name"),
    knex("directus_policies").select("id", "name"),
    knex("directus_flows").select("id", "options"),
    knex("directus_operations").select("flow", "type", "options")
  ]);
  const publicPolicyIds = policies.filter((policy) => policy.name === "$t:public_label").map((policy) => policy.id);

  return {
    roleIds: new Set(roles.filter((role) => PROJECT_ROLES.includes(role.name)).map((role) => role.id)),
    policyIds: new Set([
      ...policies.filter((policy) => PROJECT_POLICIES.includes(policy.name)).map((policy) => policy.id),
      ...publicPolicyIds
    ]),
    flowIds: new Set(filterProjectFlows(flows, operations).map((flow) => flow.id))
  };
}

function filterCollection(collection: SystemCollection, items: any[], scope: ProjectScope) {
  switch (collection) {
    case "directus_access":
      return items.filter((item) => scope.roleIds.has(item.role) && scope.policyIds.has(item.policy));
    case "directus_roles":
      return items.filter((item) => scope.roleIds.has(item.id));
    case "directus_policies":
      return items.filter((item) => scope.policyIds.has(item.id) && item.name !== "$t:public_label");
    case "directus_permissions":
      return items.filter((item) => scope.policyIds.has(item.policy) && isProjectCollection(item.collection));
    case "directus_presets":
      return items.filter((item) => item.role === null && item.user === null && isProjectCollection(item.collection));
    case "directus_flows":
      return items.filter((item) => scope.flowIds.has(item.id));
    case "directus_operations":
      return items.filter((item) => scope.flowIds.has(item.flow));
  }
}

function replaceAdministratorRoleId(collection: SystemCollection, administratorRoleId: string, content: string) {
  if (collection === "directus_permissions") {
    return content
      .replaceAll(`"${administratorRoleId}"`, '"{{ID_ROLE_ADMINISTRATOR}}"')
      .replaceAll(`"_neq": "null"`, '"_neq": "{{ID_ROLE_ADMINISTRATOR}}"');
  }

  return content;
}

async function exportSystemCollection(knex: Knex, collection: SystemCollection, administratorRoleId: string, scope: ProjectScope) {
  const rows = await knex(collection).select("*");
  const items = filterCollection(collection, rows, scope);
  const outputPath = path.join(MIGRATIONS_DIRECTORY, `data/${collection}.json`);
  const content = replaceAdministratorRoleId(collection, administratorRoleId, JSON.stringify(items, null, 2));

  fs.writeFileSync(outputPath, content, "utf8");
  logger().info(`[export:system] exported ${items.length}/${rows.length} ${collection} to ${outputPath}`);
}

// Formats the files like the repository (lint-staged runs oxfmt), so an export without changes produces no diff.
function formatOutput() {
  const files = SYSTEM_COLLECTIONS.map((collection) => path.join(MIGRATIONS_DIRECTORY, `data/${collection}.json`));

  try {
    execFileSync(path.join(import.meta.dirname, "../node_modules/.bin/oxfmt"), files, { stdio: "ignore" });
  } catch (error) {
    logger().warn(`[export:system] unable to format the exported files: ${(error as Error).message}`);
  }
}

// Renames the *-update-all.ts migration to today's date so it runs again on the next deploy.
function renameUpdateAllMigrationFile() {
  const matches = fs
    .readdirSync(MIGRATIONS_DIRECTORY)
    .filter((fileName) => /^\d{8}[A-Z]-update-all\.ts$/.test(fileName))
    .sort();

  if (matches.length === 0) {
    logger().warn("[export:system] no migration file matching '*-update-all.ts' found to rename");
    return;
  }

  const sourceName = matches[0];
  const now = new Date();
  const targetName = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}A-update-all.ts`;

  if (sourceName === targetName) {
    logger().info(`[export:system] migration file already up-to-date: ${targetName}`);
    return;
  }

  const targetPath = path.join(MIGRATIONS_DIRECTORY, targetName);

  if (fs.existsSync(targetPath)) {
    logger().info(`[export:system] target migration already exists, skipping rename: ${targetName}`);
    return;
  }

  fs.renameSync(path.join(MIGRATIONS_DIRECTORY, sourceName), targetPath);
  logger().info(`[export:system] renamed migration: ${sourceName} -> ${targetName}`);
}

export default async (_directus?: DIRECTUS_SERVICE) => {
  const knex = inject(DATABASE);
  const administratorRoleId = await getAdministratorRoleId(knex);

  if (!administratorRoleId) {
    throw new Error("Administrator role not found.");
  }

  logger().info(`[export:system] administrator role id ${administratorRoleId}`);
  const scope = await getProjectScope(knex);

  for (const collection of SYSTEM_COLLECTIONS) {
    await exportSystemCollection(knex, collection, administratorRoleId, scope);
  }

  formatOutput();

  try {
    renameUpdateAllMigrationFile();
  } catch (error) {
    logger().error("[export:system] failed to rename migration file after export", error as Error);
  }

  logger().info("[export:system] complete");
};
