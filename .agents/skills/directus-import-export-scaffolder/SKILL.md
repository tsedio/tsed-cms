---
name: directus-import-export-scaffolder
description: Scaffold Directus import and export scripts for repo-managed data migrations. Use when adding or updating collection exports in `exports/`, collection imports in `imports/`, or `*-data.ts` bundle scripts, especially for one-file-per-document payloads under `imports/data/<collection-kebab>/`, relation tables, or environment-to-environment content sync.
---

# Directus Import Export Scaffolder

Keep scripts compatible with `packages/scripts/export-data.ts` and `packages/scripts/import-data.ts` (both discover
scripts by file name, so no new npm script is needed).

## Layout

```text
exports/export-<domain>.ts                 # default export (directus) => Promise<void>
exports/export-all.ts                      # add every new export here
exports/utils/export-collection.ts         # fetchCollection, fetchCollectionByIds, sortBy, writeCollectionFiles
imports/<n>-import-<collection>.ts         # default export (directus) => Promise<void>
imports/<n>-import-<domain>-data.ts        # bundle, uses runImportScripts(...)
imports/import-all.ts                      # add every new collection import here, in dependency order
imports/utils/load-items-from-directory.ts
imports/utils/import-collection.ts         # upsert by id, strips audit fields, `omit` option
imports/data/<collection-kebab>/<slug>--<id>.json
```

## Export rules

- Use the helpers from `exports/utils/export-collection.ts`; do not duplicate fetch/write logic.
- Sort items deterministically (`sortBy`) and give `writeCollectionFiles` a `slugOf` so file names are readable.
- Export relation (junction) tables separately, filtered on the parent ids with `fetchCollectionByIds`.
- Use `mode: "preserve"` when the export only covers part of a collection; keep the default `reset` when it owns it.
- Never write flat files like `imports/data/<collection>.json`.
- System collections (`directus_*`) cannot use `readItems`: use `fetchSystemCollection(directus, "<collection>", "/<endpoint>")`.
  Strip O2M aliases (`omitFields`) and replace environment specific ids with `replaceIds` placeholders.
- `exports/export-system-collections.ts` (Knex → `migrations/data`) feeds the deploy migration; keep it in sync with it.

## Import rules

- `importCollection("<collection>", loadItemsFromDirectory(import.meta.dirname, "data/<collection-kebab>"))`.
- `{ allowEmpty: true }` only for optional relation tables.
- Pass `{ omit: ["<o2m alias>"] }` when children are imported by another script.
- System collections: `importSystemCollection(label, items, { endpoint, match, omitOnCreate })` from
  `imports/utils/import-system-collection.ts`. Match auto-increment ids on a natural key, never on `id`.
- Number scripts so parents run before children (M2O targets first, junction tables last).
- No static `with { type: "json" }` imports of payloads.

## Validation

1. `yarn typecheck` and `yarn test:lint`.
2. New export appears in `yarn export:data:dev`, new import in `yarn import:data:dev`.
3. `export-all.ts` / `import-all.ts` updated.
