// Migration script to ensure roles are installed in the Directus database
// This script will check if roles exist in the directus_roles table and add them if they don't
import { useLogger } from "@directus/api/logger/index";
import type { Role } from "@directus/types";
import { Knex } from "knex";

const TABLE = "directus_roles";

export async function installRoles(knex: Knex, roles: Role[]): Promise<void> {
  const logger = useLogger();

  roles = roles.filter((role) => {
    // Filter out roles that are not defined or have an empty name
    return role.name !== "Administrator";
  });

  // For each role, check if it exists and insert it if it doesn't
  for (const role of roles) {
    const exists = await knex(TABLE).where({ name: role.name }).first();

    if (!exists) {
      logger.info(`Adding role: ${role.name}`);
      await knex(TABLE).insert(role);
    } else {
      logger.info(`Role already exists: ${role.name}`);
    }
  }

  logger.info("Roles installation complete.");
}
