import type { Item } from "@directus/types";
import { injectable } from "@tsed/di";
import { DirectusItemsRepository } from "@tsed-cms/infra/directus/DirectusItemsRepository.js";
import type { Sponsor } from "@tsed-cms/infra/directus/interfaces/DirectusSchema.d.js";

/**
 * Sponsors domain service
 * - Provides typed access to the `sponsors` collection
 * - Upserts sponsor by unique `login`
 */
export class SponsorsService extends DirectusItemsRepository<Sponsor> {
  protected collection = "sponsors" as const;

  async findByLogin(login: string): Promise<Sponsor | null> {
    const service = await this.getCollection();

    const [row] = (await service.readByQuery({
      filter: { login: { _eq: login } },
      limit: 1
    })) as unknown as Sponsor[];

    return row || null;
  }

  async upsertOneByLogin(input: Partial<Sponsor> & Pick<Sponsor, "login">) {
    const service = await this.getCollection();

    const existing = await this.findByLogin(input.login);

    if (existing) {
      const id = await service.updateOne(existing.id as unknown as Item["id"], {
        ...existing,
        ...input
      });

      return service.readOne(id);
    }

    const createdKey = await service.createOne({
      ...input,
      status: (input as any).status || "published"
    } as Partial<Sponsor>);

    return await service.readOne(createdKey);
  }

  async listBySource(source: Sponsor["source"]): Promise<Sponsor[]> {
    const service = await this.getCollection();

    return service.readByQuery({
      filter: { source: { _eq: source } },
      limit: -1
    });
  }

  /**
   * Archive sponsors by source when their login is not included in the provided set.
   * Returns the number of archived rows.
   */
  async archiveMissingBySource(source: Sponsor["source"], activeLogins: Set<string>): Promise<number> {
    const service = await this.getCollection();
    const rows = await this.listBySource(source);

    let archived = 0;

    for (const row of rows) {
      if (!activeLogins.has(row.login) && row.status !== "archived") {
        const id = await service.updateOne(row.id, { status: "archived" } as Partial<Sponsor>);

        await service.readOne(id);

        archived++;
      }
    }

    return archived;
  }
}

injectable(SponsorsService);
