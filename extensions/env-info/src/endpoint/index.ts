import { readFileSync } from "node:fs";
import { join } from "node:path";

import { defineEndpoint } from "@directus/extensions-sdk";
import { configuration, inject } from "@tsed/di";
import { wrapEndpoint } from "@tsed-cms/infra/bootstrap/directus.js";

import { EnvInfoService } from "./EnvInfoService.js";

configuration().set("pkg", JSON.parse(readFileSync(join(import.meta.dirname, "..", "package.json"), "utf8")));
configuration().set("branch", readFileSync(join(process.cwd(), "resources/release.info"), "utf8").trim());
configuration().set("envs", process.env);

export default defineEndpoint({
  id: "env-info",
  handler: wrapEndpoint((router) => {
    const versionController = inject(EnvInfoService);

    /**
     * Get current version information
     */
    router.get("/version", (req, res) => {
      return res
        .status(200)
        .header("Cache-Control", "no-cache, no-store, must-revalidate")
        .send(versionController.get(req.accountability?.admin));
    });
  })
});
