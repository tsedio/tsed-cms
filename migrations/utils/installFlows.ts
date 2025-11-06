import { useLogger } from "@directus/api/logger/index";
import type { Flow, Operation } from "@directus/types";
import { Knex } from "knex";

const FLOWS_TABLE = "directus_flows";
const OPERATIONS_TABLE = "directus_operations";

export async function installFlows(knex: Knex, flows: Flow[], operations: Operation[]): Promise<void> {
  const logger = useLogger();

  // Read data files

  logger.info(`Installing flows (${flows.length}) and operations (${operations.length}) from migrations/data JSON files...`);

  // Insert flows first (so FK references from operations will work)
  for (const flow of flows) {
    try {
      const exists = await knex(FLOWS_TABLE).where({ id: flow.id }).first();
      if (!exists) {
        logger.info(`Adding flow: ${flow.id}${flow.name ? ` (${flow.name})` : ""}`);
        const { date_created, user_created, ...rest } = flow as any;
        await knex(FLOWS_TABLE).insert(rest);
      } else {
        logger.info(`Flow already exists: ${flow.id}${flow.name ? ` (${flow.name})` : ""}`);
        // Do not update primary key or created-by fields; only update other mutable columns
        const { id, date_created, user_created, ...updatable } = flow as any;
        await knex(FLOWS_TABLE).where({ id: flow.id }).update(updatable);
      }
    } catch (er) {
      logger.error(`Error installing flow ${flow.id}`, er);
    }
  }

  // Then insert operations
  for (const op of operations) {
    try {
      const exists = await knex(OPERATIONS_TABLE).where({ id: op.id }).first();
      if (!exists) {
        logger.info(`Adding operation: ${op.id}${op.name ? ` (${op.name})` : op.type ? ` [${op.type}]` : ""}`);
        const { date_created, user_created, ...rest } = op as any;
        await knex(OPERATIONS_TABLE).insert(rest);
      } else {
        logger.info(`Operation already exists: ${op.id}${op.name ? ` (${op.name})` : ""}`);
        // Only update mutable fields; never attempt to change primary key
        const { id, date_created, user_created, ...updatable } = op as any;
        await knex(OPERATIONS_TABLE).where({ id: op.id }).update(updatable);
      }
    } catch (er) {
      logger.error(`Error installing operation ${op.id}`, er);
    }
  }

  logger.info("Flows and operations installation complete.");
}
