import { defineOperationApi } from "@directus/extensions-sdk";
import { inject } from "@tsed/di";
import { wrapOperation } from "@tsed-cms/infra/bootstrap/directus.js";
import type { Package } from "@tsed-cms/infra/directus/interfaces/DirectusSchema.js";
import { HttpClient } from "@tsed-cms/infra/http/HttpClient.js";
import { validate } from "@tsed-cms/infra/validators/validate.js";
import { PackageSymbolsService } from "@tsed-cms/usecases/package-symbols/PackageSymbolsService.js";
import { PackagesService } from "@tsed-cms/usecases/packages/PackagesService.js";

import { mapApiSymbolToDirectus } from "./mappers/mapApiSymbolToDirectus.js";
import { type ApiPayload, ApiPayloadSchema } from "./schema/ApiPayloadSchema.js";

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
  handler: wrapOperation(async (opts, context) => {
    const startedAt = Date.now();
    const url = (opts?.url?.trim() || "https://tsed.dev/api.json").toString();
    const markdownUrl = (opts?.markdown_url?.trim() || "https://tsed.dev/ai/references").toString();
    const http = inject(HttpClient);
    const symbolsService = inject(PackageSymbolsService);

    // Origin pour construire les URL de doc
    const origin = new URL(url).origin;
    let data: ApiPayload;

    if ((context?.data?.["$last"] as any)?.body) {
      try {
        data = await validate((context?.data?.["$last"] as any)?.body, ApiPayloadSchema);
      } catch (er: any) {
        return {
          url,
          processed: 0,
          upserted: 0,
          durationMs: Date.now() - startedAt,
          errors: [
            {
              error: er?.message || String(er)
            }
          ]
        };
      }
    } else {
      data = await http.get<ApiPayload>(url);
    }

    let processed = 0;
    let upserted = 0;
    const errors: { name: string; pkg: string; error: string }[] = [];

    for (const [pkgName, mod] of Object.entries(data.modules)) {
      for (const s of mod.symbols) {
        try {
          const pkg = await ensurePackage(pkgName);
          const mapped = mapApiSymbolToDirectus(s, origin, markdownUrl);

          mapped.versions.push(data.version);

          await symbolsService.upsertOne({ ...mapped, package: pkg.id });

          upserted += 1;
          processed += 1;
        } catch (er: any) {
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
