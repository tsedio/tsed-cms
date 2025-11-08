import { defineOperationApi } from "@directus/extensions-sdk";
import { inject } from "@tsed/di";
import { wrapOperation } from "@tsed-cms/infra/bootstrap/directus.js";
import type { Maintainer, Package } from "@tsed-cms/infra/directus/interfaces/DirectusSchema.js";
import { LegacyApiClient, type WarehousePluginItem, type WarehousePluginMaintainer } from "@tsed-cms/infra/warehouse/LegacyApiClient.js";
import { MaintainersService } from "@tsed-cms/usecases/maintainers/MaintainersService.js";
import { PackagesService } from "@tsed-cms/usecases/packages/PackagesService.js";

// Options can be extended later if needed
export type Options = {
  text?: string;
};

function mapMaintainer(input: string | WarehousePluginMaintainer): Pick<Maintainer, "username" | "url" | "avatar" | "email"> {
  if (typeof input === "string") {
    return {
      username: input,
      url: null,
      avatar: null,
      email: null
    };
  }

  return {
    username: input.username || "",
    url: input.url ?? null,
    avatar: input.avatar ?? null,
    email: input.email ?? null
  };
}

function mapPackage(plugin: WarehousePluginItem): Partial<Package> & Pick<Package, "name" | "type"> {
  const type = (plugin.type ||
    (plugin.name.startsWith("@tsed/") ? "official" : plugin.name.startsWith("@tsedio/") ? "premium" : "3rd-party")) as Package["type"];

  return {
    name: plugin.name,
    type,
    description: plugin.description ?? null,
    tags: plugin.tags ?? null,
    homepage: plugin.homepage ?? null,
    downloads: plugin.downloads ?? null,
    version: plugin.version ?? null,
    repository: plugin.repository ?? null,
    npm: plugin.npm ?? null,
    stars: plugin.stars ?? null,
    bugs: plugin.bugs ?? null,
    icon: plugin.icon ?? null
  };
}

export default defineOperationApi<Options>({
  id: "tsed-flow-packages-importer",
  handler: wrapOperation(async (_opts, _context) => {
    const startedAt = Date.now();

    const legacyApiClient = inject(LegacyApiClient);
    const maintainersService = inject(MaintainersService);
    const packagesService = inject(PackagesService);

    let packagesProcessed = 0;
    let packagesUpserted = 0;
    let maintainersUpserted = 0;
    let junctionsLinked = 0;

    const errors: { pkg: string; error: string }[] = [];

    // Fetch plugins from warehouse
    const plugins = await legacyApiClient.getPlugins();

    for (const plugin of plugins) {
      try {
        const pkgData = mapPackage(plugin);

        // Upsert package by name
        const pkg = await packagesService.upsertOne(pkgData);
        packagesUpserted += 1;

        // Upsert maintainers
        const maintainers: Maintainer[] = [];
        const mList = plugin.maintainers || [];

        for (const m of mList) {
          const mapped = mapMaintainer(m);
          if (!mapped.username) continue;
          const updated = await maintainersService.upsertOne(mapped);
          maintainers.push(updated);
          maintainersUpserted += 1;
        }

        if (maintainers.length) {
          // Ensure junction links package <-> maintainers
          const created = await packagesService.ensureMaintainersLinks(
            pkg.id,
            maintainers.map((m) => m.id as string)
          );
          junctionsLinked += created;
        }

        packagesProcessed += 1;
      } catch (er: any) {
        errors.push({ pkg: plugin.name, error: er?.message || String(er) });
      }
    }

    return {
      processed: packagesProcessed,
      packagesUpserted,
      maintainersUpserted,
      junctionsLinked,
      durationMs: Date.now() - startedAt,
      errors
    };
  })
});
