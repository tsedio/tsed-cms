import { defineOperationApp } from "@directus/extensions-sdk";

export default defineOperationApp({
  id: "tsed-flow-packages-importer",
  name: "Ts.ED Packages import",
  icon: "extension",
  description: "Import plugins from Ts.ED Warehouse into packages collection",
  overview: () => [],
  options: []
});
