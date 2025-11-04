import { createItem, readItems, updateItem } from "@directus/sdk";
import { inject, logger } from "@tsed/di";
import { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";
import type { Schema } from "@tsed-cms/infra/directus/interfaces/DirectusSchema.js";

export async function importCollection<Collection extends keyof Schema>(table: Collection, items: Schema[Collection]) {
  const directus = inject(DIRECTUS_SERVICE);

  for (const item of items as any[]) {
    try {
      const [existingItem] = await directus.request(
        readItems(table as any, {
          filter: {
            id: { _eq: item.id }
          },
          limit: 1
        })
      );

      delete item.user_created;
      delete item.user_updated;
      delete item.date_created;
      delete item.date_updated;

      if (!existingItem) {
        await directus.request(createItem(table, item as any));
        logger().info(`Item ${table} ${item.id} created`);
      } else {
        await directus.request(
          updateItem(table, item.id, {
            ...existingItem[0],
            ...item
          } as any)
        );
        logger().info(`Item ${table} ${item.id} updated`);
      }
    } catch (er) {
      console.log(er);
      logger().error(`Error importing item ${table} ${item.id}: ${(er as Error).message}`);
      process.exit(1);
    }
  }
}
