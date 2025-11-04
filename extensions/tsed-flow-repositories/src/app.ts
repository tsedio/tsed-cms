import { defineOperationApp } from "@directus/extensions-sdk";

export default defineOperationApp({
  id: "tsed-flow-repositories",
  name: "Ts.ED Repositories refresh",
  icon: "spa",
  description: "Refresh repositories metadata",
  overview: ({ text }) => [
    {
      label: "Text",
      text: text
    }
  ],
  options: []
});
