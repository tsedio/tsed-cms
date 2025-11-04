import { defineOperationApp } from "@directus/extensions-sdk";

export default defineOperationApp({
  id: "tsed-flow-packages",
  name: "Ts.ED Packages from NPM",
  icon: "extension",
  description: "Search NPM for Ts.ED-related packages and upsert into Directus",
  overview: ({ text }) => [
    {
      label: "Search text",
      text: text || "tsed"
    }
  ],
  options: [
    {
      field: "text",
      name: "Search text",
      type: "string",
      meta: {
        width: "full",
        interface: "input",
        note: "NPM search query (default: tsed)"
      },
      schema: {
        default_value: "tsed"
      }
    }
  ]
});
