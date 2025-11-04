import { useLogger } from "@directus/api/logger/index";
import type { Permission } from "@directus/types";
import { Knex } from "knex";

import { getAdministratorRoleId } from "./getAdministratorRoleId.js";

const TABLE = "directus_permissions";

export async function installPermissions(knex: Knex, permissions: Permission[]): Promise<void> {
  const logger = useLogger();
  const roleAdminId = await getAdministratorRoleId(knex);

  // For each permission, check if it exists and insert it if it doesn't
  for (const permission of permissions) {
    // @ts-ignore
    delete permission.id;

    if (permission.validation) {
      permission.validation = JSON.parse(JSON.stringify(permission.validation).replace("{{ID_ROLE_ADMINISTRATOR}}", roleAdminId!));
    }

    const exists = await knex(TABLE)
      .where({
        policy: permission.policy,
        collection: permission.collection,
        action: permission.action
      })
      .first();

    try {
      if (!exists) {
        logger.info(`Adding permission: ${permission.collection} - ${permission.action} for policy ${permission.policy}`);
        await knex(TABLE).insert(permission);
      } else {
        logger.info(`Permission already exists: ${permission.collection} - ${permission.action} for policy ${permission.policy}`);
      }
    } catch (er) {
      logger.error(`Error installing permission: ${permission.collection} - ${permission.action} for policy ${permission.policy}`, er);
    }
  }
  logger.info("Permissions installation complete.");
}
