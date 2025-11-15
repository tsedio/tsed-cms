import { defineOperationApp } from "@directus/extensions-sdk";

export default defineOperationApp({
  id: "tsed-flow-package-symbols",
  name: "Ts.ED Package Symbols importer",
  icon: "code",
  description: "Récupère les symboles exportés des packages Ts.ED depuis api.json et les upsert dans package_symbols.",
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
        note: "URL du JSON des symboles (default: https://tsed.dev/api.json)"
      },
      schema: {
        default_value: "https://tsed.dev/api.json"
      }
    }
  ]
});
