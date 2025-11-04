import { defineOperationApp } from "@directus/extensions-sdk";

export default defineOperationApp({
  id: "tsed-flow-sponsors",
  name: "Ts.ED Sponsors (GitHub & OpenCollective)",
  icon: "favorite",
  description: "Collect sponsors from GitHub and OpenCollective and upsert into the sponsors collection",
  overview: ({ githubUser, openCollectiveSlug }) => [
    { label: "GitHub user/organization", text: githubUser || "romakita" },
    { label: "OpenCollective slug", text: openCollectiveSlug || "tsed" }
  ],
  options: [
    {
      field: "githubUser",
      name: "GitHub user or organization",
      type: "string",
      meta: {
        width: "full",
        interface: "input",
        note: "GitHub username or organization to read public sponsors from"
      },
      schema: { default_value: "romakita" }
    },
    {
      field: "openCollectiveSlug",
      name: "OpenCollective slug",
      type: "string",
      meta: {
        width: "full",
        interface: "input",
        note: "OpenCollective slug (e.g., tsed)"
      },
      schema: { default_value: "tsed" }
    }
  ]
});
