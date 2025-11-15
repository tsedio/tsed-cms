import { defineOperationApp } from "@directus/extensions-sdk";

export default defineOperationApp({
  id: "tsed-flow-package-symbols",
  name: "Ts.ED Package Symbols importer",
  icon: "code",
  description: "Retrieves exported symbols from Ts.ED packages from api.json and upserts them into package_symbols.",
  overview: ({ url }) => [
    {
      label: "API URL",
      text: url || "https://tsed.dev/api.json"
    }
  ],
  options: [
    {
      field: "url",
      name: "API URL",
      type: "string",
      meta: {
        width: "full",
        interface: "input",
        note: "URL of JSON symbols (default: https://tsed.dev/api.json)"
      },
      schema: {
        default_value: "https://tsed.dev/api.json"
      }
    },
    {
      field: "markdown_url",
      name: "Markdown base URL",
      type: "string",
      meta: {
        width: "full",
        interface: "input",
        note: "URL where the markdown contents of the symbols are stored (default: https://tsed.dev/ai/references/api)"
      },
      schema: {
        default_value: "https://tsed.dev/ai/references/api"
      }
    }
  ]
});
