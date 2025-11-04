import type { Item } from "@directus/types";
import { injectable } from "@tsed/di";
import { DirectusItemsRepository } from "@tsed-cms/infra/directus/DirectusItemsRepository.js";
import type { Package, PackagesMaintainer } from "@tsed-cms/infra/directus/interfaces/DirectusSchema.d.js";

/**
 * Packages domain service (Directus usecases layer).
 * - Provides typed access to the `packages` collection
 * - Upserts package by unique `name`
 * - Manages junction links to maintainers in `packages_maintainers`
 */
export class PackagesService extends DirectusItemsRepository<Package> {
  protected collection = "packages" as const;

  async getJunctionService() {
    return this.contextService.getItemsService<PackagesMaintainer>("packages_maintainers");
  }

  async findByName(name: string): Promise<Package | null> {
    const service = await this.getCollection();

    const [row] = (await service.readByQuery({
      filter: { name: { _eq: name } },
      limit: 1
    })) as unknown as Package[];

    return row || null;
  }

  async upsertOne(input: Partial<Package> & Pick<Package, "name" | "type">) {
    const service = await this.getCollection();

    const existing = await this.findByName(input.name);

    if (existing) {
      const id = await service.updateOne(existing.id as unknown as Item["id"], input as Partial<Package>);
      return service.readOne(id);
    }

    const createdKey = await service.createOne({
      ...input,
      status: input.status || "published"
    } as Partial<Package>);

    return await service.readOne(createdKey);
  }

  async listByType(type: Package["type"]): Promise<Package[]> {
    const service = await this.getCollection();

    return service.readByQuery({
      filter: { type: { _eq: type } },
      limit: -1
    });
  }

  async updateMetadata(id: Package["id"], data: Partial<Pick<Package, "description" | "stars">>) {
    const service = await this.getCollection();
    const updatedId = await service.updateOne(id as unknown as Item["id"], data as Partial<Package>);

    return service.readOne(updatedId);
  }

  /**
   * Ensure that each maintainer id is linked to package id in the junction table.
   * Creates missing rows. Returns the number of links created (or ensured).
   */
  async ensureMaintainersLinks(packageId: Package["id"], maintainerIds: Array<string>) {
    const junction = await this.getJunctionService();
    let created = 0;

    for (const mId of maintainerIds) {
      const [exists] = (await junction.readByQuery({
        filter: {
          packages_id: { _eq: packageId },
          maintainers_id: { _eq: mId }
        },
        limit: 1
      })) as unknown as PackagesMaintainer[];

      if (!exists) {
        await junction.createOne({
          packages_id: packageId as any,
          maintainers_id: mId as any
        } as Partial<PackagesMaintainer>);
        created++;
      } else {
        // even if it exists we count ensured link for parity
        created++;
      }
    }

    return created;
  }
}

injectable(PackagesService);
