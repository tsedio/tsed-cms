# tsed-flow-package-symbols

Directus operation that imports exported symbols of Ts.ED packages from the contractual JSON `https://tsed.dev/api.json` and writes them into the `package_symbols` collection.

## How it works

- The operation fetches `api.json` (or consumes a compatible payload provided by a previous step, see “Webhook/inline payload” below).
- It iterates `modules["<package-name>"].symbols` and maps each entry to a `package_symbols` record via `src/mappers/mapApiSymbolToDirectus.ts`.
- The corresponding package is ensured in the `packages` collection (created if missing) with `type: "official"`.
- Upsert is performed by the symbol `id` coming from `api.json`. If a record already exists, its `versions` field is merged (union) with the new version from `api.json`.
- Fields mapped per symbol:
  - `name ← symbolName`
  - `type ← symbolType`
  - `doc_url ← origin(api.json) + path`
  - `markdown_url ← markdown_base + path + ".md"`
  - `deprecated ← status includes "deprecated"`
  - `tags ← status without "deprecated"`
  - `versions ← []` then the global `api.json.version` is appended during import

## Build and run locally

1) Install deps at the repo root
```bash
corepack enable
yarn install --immutable
```

2) Build all extensions
```bash
yarn build
```

3) Start Directus (dev)
```bash
yarn start:dev
```

## Operation configuration (UI)

Directus → Flows → Add operation → “Ts.ED Package Symbols importer”.

Card options:
- `url` (string) — `api.json` URL. Default in the card: `https://tsed.dev/api.json`.
- `markdown_url` (string) — base URL where markdown files live. Default in the card: `https://tsed.dev/ai/references/api`.

Notes about defaults:
- The operation handler also has an internal fallback for `markdown_url` to `https://tsed.dev/ai/references` if the option isn’t provided by the flow. To get the expected final markdown path `…/api/<symbol>.md`, set the card option explicitly to `https://tsed.dev/ai/references/api` (as in the exported flows).

Save the flow. The operation will use these options at runtime.

## Trigger the flow via HTTP (Directus API)

Manual trigger (flow id `569895a0-7a65-4cb2-94aa-67f77a776a08` in the sample exports):

```bash
CMS_API_URL="http://localhost:8055"
CMS_API_TOKEN="<ADMIN_OR_ALLOWED_TOKEN>"
FLOW_ID="569895a0-7a65-4cb2-94aa-67f77a776a08"

curl -X POST \
  "$CMS_API_URL/flows/trigger/$FLOW_ID" \
  -H "Authorization: Bearer $CMS_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Webhook trigger and inline payload (optional)

This repo also includes a webhook flow (`9039bef8-fdc3-4f31-b5ab-7fee31273921`). If you POST a body containing a payload compatible with `src/schema/ApiPayloadSchema.ts`, the operation will validate and use this body instead of fetching from `url`.

Example (send the whole api.json as request body):

```bash
CMS_API_URL="http://localhost:8055"
CMS_API_TOKEN="<ADMIN_OR_ALLOWED_TOKEN>"
FLOW_ID="9039bef8-fdc3-4f31-b5ab-7fee31273921"

curl -X POST \
  "$CMS_API_URL/flows/trigger/$FLOW_ID" \
  -H "Authorization: Bearer $CMS_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @api.json
```

## Permissions required

This operation runs with the flow runner’s role/policy (`accountability: "all"` in the exported flows). Ensure the role used to trigger the flow has at least:

- `packages`: read, create, update (the operation may create missing packages)
- `package_symbols`: read, create, update (the operation reads by `id`, then creates/updates symbols)

If these permissions are missing, the flow will fail with `403 You don't have permission to access this.` during upsert.

## Testing

Run the unit tests for the mapper and the service:

```bash
yarn vitest run \
  extensions/tsed-flow-package-symbols/src/mappers/mapApiSymbolToDirectus.spec.ts \
  packages/usecases/package-symbols/PackageSymbolsService.spec.ts
```

Both tests should pass.

## Notes

- The `ApiPayloadSchema` strictly types the `api.json` format used by the operation.
- The mapper intentionally keeps logic minimal and assumes the contract is stable.
