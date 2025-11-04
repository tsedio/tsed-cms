import type { Item } from "@directus/types";
import { injectable } from "@tsed/di";
import { DirectusItemsRepository } from "@tsed-cms/infra/directus/DirectusItemsRepository.js";
import type { Maintainer } from "@tsed-cms/infra/directus/interfaces/DirectusSchema.d.js";

export class MaintainersService extends DirectusItemsRepository<Maintainer, string> {
  protected collection = "maintainers" as const;

  async findByUsername(username: string): Promise<Maintainer | null> {
    const service = await this.getCollection();

    const [row] = await service.readByQuery({
      filter: { username: { _eq: username } },
      limit: 1
    });

    return row || null;
  }

  async upsertOne(input: Partial<Maintainer> & Pick<Maintainer, "username">) {
    const service = await this.getCollection();
    const existing = await this.findByUsername(input.username);

    if (existing) {
      const id = await service.updateOne(
        existing.id as unknown as Item["id"],
        {
          username: input.username,
          url: input.url ?? existing.url ?? null,
          avatar: input.avatar ?? existing.avatar ?? null,
          email: input.email ?? existing.email ?? null
        } as Partial<Maintainer>
      );

      return service.readOne(id);
    }

    const createdKey = await service.createOne({
      username: input.username,
      url: input.url ?? null,
      avatar: input.avatar ?? null,
      email: input.email ?? null,
      status: "published"
    } as Partial<Maintainer>);

    return await service.readOne(createdKey);
  }

  // async upsertMany(maintainers: Partial<Maintainer>[]) {
  //   const ids: Maintainer[] = [];
  //
  //   for (const c of maintainers) {
  //     ids.push(await this.upsertOne(c as any));
  //   }
  //
  //   return ids;
  // }
}

injectable(MaintainersService);
