import { defineOperationApi } from "@directus/extensions-sdk";
import { inject } from "@tsed/di";
import { wrapOperation } from "@tsed-cms/infra/bootstrap/directus.js";
import type { Package } from "@tsed-cms/infra/directus/interfaces/DirectusSchema.js";
import { HttpClient } from "@tsed-cms/infra/http/HttpClient.js";
import { PackageSymbolsService } from "@tsed-cms/usecases/package-symbols/PackageSymbolsService.js";
import { PackagesService } from "@tsed-cms/usecases/packages/PackagesService.js";

import { type ApiJsonModule, type ApiJsonResponse, mapApiSymbolToDirectus } from "./mappers/mapApiSymbolToDirectus.js";

export type Options = {
  url?: string;
  markdown_url?: string;
};

async function ensurePackage(pkgName: string): Promise<Package> {
  const packagesService = inject(PackagesService);

  const existing = await packagesService.findByName(pkgName);

  if (existing) {
    return existing;
  }

  // Tous les modules listés dans api.json sont traités comme "official"
  return packagesService.upsertOne({ name: pkgName, type: "official" });
}

export default defineOperationApi<Options>({
  id: "tsed-flow-package-symbols",
  handler: wrapOperation(async (opts) => {
    const startedAt = Date.now();
    const url = (opts?.url?.trim() || "https://tsed.dev/api.json").toString();
    const markdownUrl = (opts?.markdown_url?.trim() || "https://tsed.dev/ai/references").toString();

    const http = inject(HttpClient);
    const symbolsService = inject(PackageSymbolsService);

    let processed = 0;
    let upserted = 0;
    const errors: { name: string; pkg: string; error: string }[] = [];

    // Fetch the JSON (typed)
    const data = await http.get<ApiJsonResponse>(url);

    // Origin pour construire les URL de doc
    const origin = new URL(url).origin;

    for (const [pkgName, mod] of Object.entries<ApiJsonModule>(data.modules)) {
      for (const s of mod.symbols) {
        try {
          const pkg = await ensurePackage(pkgName);
          const mapped = mapApiSymbolToDirectus(s, origin, markdownUrl);

          mapped.versions.push(data.version);

          await symbolsService.upsertOne({ ...mapped, package: pkg.id });

          upserted += 1;
          processed += 1;
        } catch (er: any) {
          console.log(er);
          errors.push({
            name: s.symbolName,
            pkg: pkgName,
            error: er?.message || String(er)
          });
        }
      }
    }

    return {
      url,
      processed,
      upserted,
      durationMs: Date.now() - startedAt,
      errors
    };
  })
});
