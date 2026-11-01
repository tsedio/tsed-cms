import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { customEndpoint, readItems } from "@directus/sdk";
import type { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";
import type { Schema } from "@tsed-cms/infra/directus/interfaces/DirectusSchema.js";
import { logger } from "@tsed/di";

export type ItemsCollection = {
  [Collection in keyof Schema]: Schema[Collection] extends unknown[] ? Collection : never;
}[keyof Schema];

export type CollectionItem<Collection extends ItemsCollection> = Schema[Collection][number];

export type ExportPayload<Collection extends ItemsCollection> = {
  collection: Collection;
  items: CollectionItem<Collection>[];
  exportedAt: string;
  options: {
    includeRelatedCollections: false;
    relatedCollectionDepth: 1;
  };
};

export type FetchOptions = {
  fields?: string[];
  filter?: Record<string, unknown>;
};

export type WriteCollectionOptions<Collection extends ItemsCollection> = {
  /** Builds the human readable part of the file name. The stable id is always appended. */
  slugOf?: (item: CollectionItem<Collection>) => string | null | undefined;
  /**
   * `reset` (default) removes every JSON file before writing. Use it when the export owns the whole collection.
   * `preserve` keeps existing files and only overwrites the exported documents.
   */
  mode?: "reset" | "preserve";
  /** Extra top-level payload fields, e.g. the operations of a flow. */
  extraOf?: (item: CollectionItem<Collection>) => Record<string, unknown>;
};

export const ADMINISTRATOR_ROLE_PLACEHOLDER = "{{ID_ROLE_ADMINISTRATOR}}";
export const PUBLIC_POLICY_PLACEHOLDER = "{{ID_POLICY_PUBLIC}}";

const IMPORTS_DATA_DIRECTORY = path.join(import.meta.dirname, "../../imports/data");

export function directoryFor(collection: ItemsCollection) {
  return path.join(IMPORTS_DATA_DIRECTORY, collection.replaceAll("_", "-"));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function formatError(error: unknown) {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}\n${error.stack ?? ""}`;
  }

  return JSON.stringify(error, null, 2);
}

export function chunkValues<T>(values: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }

  return chunks;
}

export function sortBy<T>(items: T[], keyOf: (item: T) => unknown) {
  return [...items].sort((a, b) => String(keyOf(a) ?? "").localeCompare(String(keyOf(b) ?? "")));
}

export function buildExportPayload<Collection extends ItemsCollection>(
  collection: Collection,
  items: CollectionItem<Collection>[]
): ExportPayload<Collection> {
  return {
    collection,
    items,
    exportedAt: new Date().toISOString(),
    options: {
      includeRelatedCollections: false,
      relatedCollectionDepth: 1
    }
  };
}

export async function fetchCollection<Collection extends ItemsCollection>(
  directus: DIRECTUS_SERVICE,
  collection: Collection,
  options: FetchOptions = {}
): Promise<CollectionItem<Collection>[]> {
  logger().info(`[fetch:${collection}] start`);

  try {
    const items = await directus.request(
      readItems(collection as never, {
        limit: -1,
        ...(options.fields ? { fields: options.fields as never[] } : {}),
        ...(options.filter ? { filter: options.filter as never } : {})
      })
    );

    logger().info(`[fetch:${collection}] ok count=${items.length}`);

    return items as unknown as CollectionItem<Collection>[];
  } catch (error) {
    logger().error(`[fetch:${collection}] fail ${formatError(error)}`);
    throw error;
  }
}

/**
 * Reads a Directus system collection through its REST endpoint (e.g. `/roles`, `/flows`).
 * `readItems` cannot be used for `directus_*` collections.
 */
export async function fetchSystemCollection<Collection extends ItemsCollection>(
  directus: DIRECTUS_SERVICE,
  collection: Collection,
  endpoint: string
): Promise<CollectionItem<Collection>[]> {
  logger().info(`[fetch:${collection}] start ${endpoint}`);

  try {
    const items = await directus.request(customEndpoint<unknown[]>({ path: endpoint, method: "GET", params: { limit: -1 } }));

    logger().info(`[fetch:${collection}] ok count=${items.length}`);

    return items as CollectionItem<Collection>[];
  } catch (error) {
    logger().error(`[fetch:${collection}] fail ${formatError(error)}`);
    throw error;
  }
}

export function omitFields<T extends object>(item: T, fields: string[]): T {
  const copy = { ...item } as Record<string, unknown>;
  fields.forEach((field) => delete copy[field]);
  return copy as T;
}

/**
 * Replaces environment specific ids by placeholders so the files can be imported anywhere.
 */
export function replaceIds<T>(item: T, replacements: Record<string, string | null | undefined>): T {
  let content = JSON.stringify(item);

  for (const [placeholder, id] of Object.entries(replacements)) {
    if (id) {
      content = content.replaceAll(`"${id}"`, `"${placeholder}"`);
    }
  }

  return JSON.parse(content);
}

export async function fetchCollectionByIds<Collection extends ItemsCollection>(
  directus: DIRECTUS_SERVICE,
  collection: Collection,
  field: string,
  ids: (string | number)[],
  options: { fields?: string[]; chunkSize?: number } = {}
): Promise<CollectionItem<Collection>[]> {
  if (ids.length === 0) {
    logger().info(`[fetch:${collection}] skip empty ids`);
    return [];
  }

  const chunks = chunkValues(ids, options.chunkSize ?? 40);
  const items: CollectionItem<Collection>[] = [];

  logger().info(`[fetch:${collection}] chunked field=${field} ids=${ids.length} chunks=${chunks.length}`);

  for (const [index, chunk] of chunks.entries()) {
    logger().info(`[fetch:${collection}] chunk ${index + 1}/${chunks.length} size=${chunk.length}`);
    items.push(
      ...(await fetchCollection(directus, collection, {
        fields: options.fields,
        filter: { [field]: { _in: chunk } }
      }))
    );
  }

  return items;
}

async function readJson(filePath: string) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return undefined;
  }
}

function withoutExportedAt(payload: Record<string, unknown> | undefined) {
  if (!payload) return undefined;
  const { exportedAt: _exportedAt, ...rest } = payload;
  return JSON.stringify(rest);
}

/**
 * Writes one JSON file per document under `imports/data/<collection-kebab>/<slug>--<id>.json`.
 * Files whose content did not change are left untouched (they keep their `exportedAt`), so an export without
 * changes produces no diff. In `reset` mode, files of documents that are no longer exported are removed.
 */
export async function writeCollectionFiles<Collection extends ItemsCollection>(
  collection: Collection,
  items: CollectionItem<Collection>[],
  options: WriteCollectionOptions<Collection> = {}
) {
  const directoryPath = directoryFor(collection);
  const prefix = collection.replaceAll("_", "-");
  const mode = options.mode ?? "reset";
  const writtenFiles = new Set<string>();
  let changed = 0;

  await mkdir(directoryPath, { recursive: true });
  logger().info(`[export:${collection}] write ${items.length} files (${mode} directory ${directoryPath})`);

  for (const [index, item] of items.entries()) {
    const id = String((item as { uuid?: string | null }).uuid ?? (item as { id: string | number }).id);
    const slug = slugify(String(options.slugOf?.(item) ?? "")) || prefix;
    const fileName = `${slug}--${id}.json`;
    const filePath = path.join(directoryPath, fileName);
    const payload = { ...buildExportPayload(collection, [item]), ...options.extraOf?.(item) };

    writtenFiles.add(fileName);

    if (withoutExportedAt(await readJson(filePath)) !== withoutExportedAt(payload)) {
      await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
      changed += 1;
    }

    const completed = index + 1;
    if (completed === 1 || completed === items.length || completed % 25 === 0) {
      logger().info(`[export:${collection}] progress ${completed}/${items.length}`);
    }
  }

  let removed = 0;
  if (mode === "reset") {
    const staleFiles = (await readdir(directoryPath)).filter((fileName) => fileName.endsWith(".json") && !writtenFiles.has(fileName));
    await Promise.all(staleFiles.map((fileName) => rm(path.join(directoryPath, fileName))));
    removed = staleFiles.length;
  }

  logger().info(`[export:${collection}] changed=${changed} unchanged=${items.length - changed} removed=${removed}`);
}
