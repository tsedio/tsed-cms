import { useLogger } from "@directus/api/logger/index";
import type { Policy } from "@directus/types";
import { Knex } from "knex";

const TABLE = "directus_policies";

export async function installPolicies(knex: Knex, policies: Policy[]): Promise<void> {
  const logger = useLogger();

  policies = policies.filter((policy) => {
    return policy.name !== "$t:public_label" && policy.name !== "Administrator";
  });

  // For each role, check if it exists and insert it if it doesn't
  for (const policy of policies) {
    const exists = await knex(TABLE).where({ name: policy.name }).first();

    if (!exists) {
      logger.info(`Adding policies: ${policy.name}`);
      await knex(TABLE).insert(policy);
    } else {
      logger.info(`Policies already exists: ${policy.name}`);
    }
  }

  logger.info("Policies installation complete.");
}
