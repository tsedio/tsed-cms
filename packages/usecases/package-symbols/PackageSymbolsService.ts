import { injectable } from "@tsed/di";
import { DirectusItemsRepository } from "@tsed-cms/infra/directus/DirectusItemsRepository.js";
import type { PackageSymbol } from "@tsed-cms/infra/directus/interfaces/DirectusSchema.d.js";

/**
 * Service d'accès à la collection `package_symbols` (Directus).
 * - Upsert par couple (name, package)
 */
export class PackageSymbolsService extends DirectusItemsRepository<PackageSymbol, string> {
  protected collection = "package_symbols" as const;

  async upsertOne(input: PackageSymbol) {
    const service = await this.getCollection();
    const existing = await service.readOne(input.id);

    if (existing) {
      const id = await service.updateOne(existing.id, input);

      return service.readOne(id);
    }

    const createdKey = await service.createOne(input);

    return await service.readOne(createdKey);
  }
}

injectable(PackageSymbolsService);
