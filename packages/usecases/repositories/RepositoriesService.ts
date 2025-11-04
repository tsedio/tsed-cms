import type { Item } from "@directus/types";
import { injectable } from "@tsed/di";
import { DirectusItemsRepository } from "@tsed-cms/infra/directus/DirectusItemsRepository.js";
import type { RepositoriesMaintainer, Repository } from "@tsed-cms/infra/directus/interfaces/DirectusSchema.d.js";

/**
 * Repositories domain service (Directus usecases layer).
 * - Provides typed access to the `repositories` collection
 * - Updates repository metadata
 * - Manages junction links to maintainers in `repositories_maintainers`
 */
export class RepositoriesService extends DirectusItemsRepository<Repository, string> {
  protected collection = "repositories" as const;

  async getJunctionService() {
    return this.contextService.getItemsService<RepositoriesMaintainer, string>("repositories_maintainers");
  }

  async updateMetadata(id: Repository["id"], data: Pick<Repository, "stars" | "url">) {
    const service = await this.getCollection();
    const key = await service.updateOne(id as unknown as Item["id"], data as Partial<Repository>);

    return service.readOne(key);
  }

  /**
   * Ensure that each maintainer id is linked to repo id in the junction table.
   * Creates missing rows. Returns the number of links created (or ensured).
   */
  async ensureMaintainersLinks(repoId: Repository["id"], maintainerIds: Array<MaintainerRef["id"]>) {
    const junction = await this.getJunctionService();
    let created = 0;

    for (const mId of maintainerIds) {
      const [exists] = (await junction.readByQuery({
        filter: {
          repositories_id: { _eq: repoId },
          maintainers_id: { _eq: mId }
        },
        limit: 1
      })) as unknown as RepositoriesMaintainer[];

      if (!exists) {
        await junction.createOne({
          repositories_id: repoId as any,
          maintainers_id: mId as any
        } as Partial<RepositoriesMaintainer>);
        created++;
      } else {
        // even if it exists we count ensured link for parity with previous counter behavior
        created++;
      }
    }

    return created;
  }
}

// Local helper type to express only the id we care for when linking
export type MaintainerRef = { id: string };

injectable(RepositoriesService);
