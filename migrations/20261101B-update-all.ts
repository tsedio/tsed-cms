// Migration script to ensure permissions are installed in the Directus database
// This script will check if permissions exist in the directus_permissions table and add them if they don't
import type { Preset } from "@directus/types";
import { Knex } from "knex";

import accesses from "./data/directus_access.json" with { type: "json" };
import flows from "./data/directus_flows.json" with { type: "json" };
import operations from "./data/directus_operations.json" with { type: "json" };
import permissions from "./data/directus_permissions.json" with { type: "json" };
import policies from "./data/directus_policies.json" with { type: "json" };
import presets from "./data/directus_presets.json" with { type: "json" };
import roles from "./data/directus_roles.json" with { type: "json" };
import { installAccesses } from "./utils/installAccesses.js";
import { installFlows } from "./utils/installFlows.js";
import { installPermissions } from "./utils/installPermissions.js";
import { installPolicies } from "./utils/installPolicies.js";
import { installPresets } from "./utils/installPresets.js";
import { installRoles } from "./utils/installRoles.js";

export async function up(knex: Knex): Promise<void> {
  await installPresets(knex, presets as any[]);
  await installRoles(knex, roles as any[]);
  await installPolicies(knex, policies);
  await installPermissions(knex, permissions as any[]);
  await installAccesses(knex, accesses as any[]);
  await installPresets(knex, presets as Preset[]);
  await installFlows(knex, flows as any, operations as any);
}

export async function down(knex: Knex): Promise<void> {}
