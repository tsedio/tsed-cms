import { useLogger } from "@directus/api/logger/index";
import { Knex } from "knex";

const TABLE = "languages";
export type Translation = { code: string; name: string; direction: "ltr" | "rtl" };

export async function installLanguages(knex: Knex, translations: Translation[]): Promise<void> {
  const logger = useLogger();

  // For each language, check if it exists and insert it if it doesn't
  for (const translation of translations) {
    const exists = await knex(TABLE).where({ code: translation.code }).first();

    if (!exists) {
      logger.info(`Adding language: ${translation.code} (${translation.name})`);
      await knex(TABLE).insert(translation);
    } else {
      logger.info(`Language already exists: ${translation.code} (${translation.name})`);
    }
  }

  logger.info("Language installation complete.");
}
