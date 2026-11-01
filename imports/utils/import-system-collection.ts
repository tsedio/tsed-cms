import { customEndpoint } from "@directus/sdk";
import { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";
import { inject, logger } from "@tsed/di";

import { AUDIT_FIELDS, changedFields } from "./import-collection.js";

export type SystemItem = Record<string, any>;

export type ImportSystemCollectionOptions = {
  /** REST endpoint of the system collection, e.g. `/roles`. */
  endpoint: string;
  /** Finds the target item. Defaults to a match on `id`. */
  match?: (item: SystemItem, existingItems: SystemItem[]) => SystemItem | undefined;
  /** Fields removed before the upsert. */
  omit?: string[];
  /** Fields removed only when creating. */
  omitOnCreate?: string[];
  /**
   * For auto-increment ids (presets, permissions): creates items with `max(existing id) + 1` instead of the source id.
   * Directus resets the Postgres sequence when an explicit integer id is inserted, which fixes sequences left behind
   * by rows inserted with explicit ids (e.g. by the *-update-all.ts migration). Otherwise the generated id may collide.
   */
  autoIncrementId?: boolean;
};

function nextId(existingItems: SystemItem[]) {
  return existingItems.reduce((max, existing) => Math.max(max, Number(existing.id) || 0), 0) + 1;
}

export function requestSystem<T = any>(path: string, method: "GET" | "POST" | "PATCH" | "DELETE" = "GET", body?: unknown) {
  const directus = inject(DIRECTUS_SERVICE);

  return directus.request(
    customEndpoint<T>({
      path,
      method,
      ...(method === "GET" ? { params: { limit: -1 } } : {}),
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    })
  );
}

/**
 * Upserts items of a Directus system collection through its REST endpoint (readItems/createItem cannot be used for
 * `directus_*` collections). Only changed fields are patched.
 */
export async function importSystemCollection(label: string, items: SystemItem[], options: ImportSystemCollectionOptions) {
  const existingItems = await requestSystem<SystemItem[]>(options.endpoint);
  const match = options.match ?? ((item, existing) => existing.find((existingItem) => existingItem.id === item.id));
  const omittedFields = [...AUDIT_FIELDS, ...(options.omit ?? [])];
  let created = 0;
  let updated = 0;
  let unchanged = 0;

  logger().info(`[import:${label}] start ${items.length} items`);

  for (const rawItem of items) {
    const item = { ...rawItem };
    omittedFields.forEach((field) => delete item[field]);

    const existingItem = match(item, existingItems);

    try {
      if (!existingItem) {
        const payload = { ...item };
        (options.omitOnCreate ?? []).forEach((field) => delete payload[field]);

        if (options.autoIncrementId) {
          payload.id = nextId(existingItems);
        }

        const createdItem = await requestSystem<SystemItem>(options.endpoint, "POST", payload);
        existingItems.push(createdItem ?? payload);
        created += 1;
        logger().info(`Item ${label} ${payload.id ?? ""} created${payload.id !== item.id ? ` (source id ${item.id})` : ""}`);
        continue;
      }

      const changes = changedFields(existingItem, item);
      delete changes.id;

      if (Object.keys(changes).length === 0) {
        unchanged += 1;
        continue;
      }

      await requestSystem(`${options.endpoint}/${existingItem.id}`, "PATCH", changes);
      Object.assign(existingItem, changes);
      updated += 1;
      logger().info(`Item ${label} ${existingItem.id} updated (${Object.keys(changes).join(", ")})`);
    } catch (error) {
      logger().error(`Error importing ${label} ${item.id ?? ""}: ${(error as Error).message}`);
      throw error;
    }
  }

  logger().info(`[import:${label}] complete created=${created} updated=${updated} unchanged=${unchanged}`);
}
