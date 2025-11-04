import { useLogger } from "@directus/api/logger/index";
import type { Preset } from "@directus/types";
import { Knex } from "knex";

const TABLE = "directus_presets";

export async function installPresets(knex: Knex, presets: Preset[]): Promise<void> {
  const logger = useLogger();
  // For each language, check if it exists and insert it if it doesn't
  for (const preset of presets) {
    const exists = await knex(TABLE).where({ collection: preset.collection, role: null, user: null }).first();

    if (!exists) {
      logger.info(`Adding preset: ${preset.collection}`);
      await knex(TABLE).insert(preset);
    } else {
      logger.info(`Preset already exists: ${preset.collection}`);
    }
  }

  logger.info("Presets installation complete.");
}
