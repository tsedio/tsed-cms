import { useLogger } from "@directus/api/logger/index";
import { Knex } from "knex";

import { getAdministratorRoleId } from "./getAdministratorRoleId.js";

const TABLE = "directus_access";

interface DirectusAccess {
  id: string;
  role: string;
  user: string | null;
  policy: string;
  sort: number;
}

export async function installAccesses(knex: Knex, accesses: DirectusAccess[]): Promise<void> {
  const logger = useLogger();
  const roleAdminId = await getAdministratorRoleId(knex);

  accesses = accesses.filter((access) => {
    return access.role && access.role !== roleAdminId;
  });

  // For each permission, check if it exists and insert it if it doesn't
  for (const access of accesses) {
    const exists = await knex(TABLE)
      .where({
        id: access.id,
        role: access.role,
        user: access.user,
        policy: access.policy
      })
      .first();

    if (!exists) {
      logger.info(`Adding access: ${access.id} - for role ${access.role} and policy ${access.policy}`);
      await knex(TABLE).insert(access);
    } else {
      logger.info(`Access already exists: ${access.id} - for role ${access.role} and policy ${access.policy}`);
    }
  }
  logger.info("Permissions installation complete.");
}
