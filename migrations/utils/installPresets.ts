import { useLogger } from "@directus/api/logger/index";
import type { Preset } from "@directus/types";
import { Knex } from "knex";
import { v4 } from "uuid";

const TABLE = "directus_presets";

export async function installPresets(knex: Knex, presets: Preset[]): Promise<void> {
  const logger = useLogger();

  try {
    const hasUuid = await knex.schema.hasColumn("directus_presets", "uuid");

    if (!hasUuid) {
      await knex.schema.alterTable("directus_presets", (table) => {
        table.uuid("uuid").nullable();
      });
      const row: Record<string, any> = {
        collection: "directus_presets",
        field: "uuid",
        special: "uuid",
        interface: "input",
        readonly: true,
        required: false,
        hidden: true,
        sort: 1,
        width: "full"
      };
      await knex("directus_fields").insert(row);
    }
  } catch (error) {
    logger.error(`Error altering directus_presets or directus_fields table:`, error);
  }

  // For each preset, check if it exists and insert it if it doesn't
  for (const preset of presets) {
    // Ids are auto-increment and differ per environment: inserting them would collide and leave the sequence behind.
    delete (preset as any).id;

    const [exists, uuidExists] = await Promise.all([
      knex(TABLE).where({ collection: preset.collection, role: null, user: null }).first(),
      knex(TABLE)
        .where({ collection: preset.collection, uuid: (preset as any).uuid })
        .first()
        .catch(() => false)
    ]);

    if (!exists && !uuidExists) {
      logger.info(`Adding preset: ${preset.collection}`);
      try {
        (preset as any).uuid = v4();

        await knex(TABLE).insert(preset);
      } catch (er) {
        try {
          delete (preset as any).uuid;
          await knex(TABLE).insert(preset);
        } catch (er) {}
      }
    } else {
      logger.info(`Update preset: ${preset.collection}`);
      try {
        if (uuidExists) {
          await knex(TABLE)
            .update(preset as any)
            .where({ uuid: uuidExists.uuid });
        } else {
          (preset as any).uuid = v4();

          await knex(TABLE)
            .update(preset as any)
            .where({ id: exists.id });
        }
      } catch (error) {
        logger.error(`Error updating preset: ${preset.id}`);
      }
    }
  }

  // Previous runs inserted explicit ids without moving the sequence, so Directus could generate an id already in use.
  if (knex.client.config.client === "pg") {
    await knex.raw(`SELECT setval(pg_get_serial_sequence(?, 'id'), GREATEST((SELECT COALESCE(MAX(id), 0) FROM ??), 1))`, [TABLE, TABLE]);
  }

  logger.info("Presets installation complete.");
}
