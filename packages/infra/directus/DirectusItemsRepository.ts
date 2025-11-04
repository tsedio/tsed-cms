import type { Item, MutationOptions } from "@directus/types";
import { inject } from "@tsed/di";
import { DirectusContextService } from "@tsed-cms/infra/directus/DirectusContextService.js";

export abstract class DirectusItemsRepository<T extends Item = Item, Collection extends string = string> {
  protected contextService = inject(DirectusContextService);
  protected abstract collection: Collection;

  getCollection() {
    return this.contextService.getItemsService<T, Collection>(this.collection as Collection);
  }

  //
  // async readByQuery(query: Query, opts?: QueryOptions) {
  //   const collection = (await this.getCollection())!;
  //
  //   if (!collection) {
  //     return [];
  //   }
  //
  //   return collection.readByQuery(query, opts);
  // }
  //
  // async update(key: PrimaryKey, data: Partial<T>, opts?: MutationOptions) {
  //   const collection = (await this.getCollection())!;
  //   if (!collection) {
  //     return null;
  //   }
  //
  //   return collection.updateOne(key, data, opts);
  // }
  //
  async create(data: Partial<T>, opts?: MutationOptions) {
    const collection = await this.getCollection();
    const key = await collection.createOne(data, opts);

    return collection.readOne(key);
  }

  async listAll(): Promise<T[]> {
    const service = await this.getCollection();

    return (await service.readByQuery({ limit: -1 })) as unknown as T[];
  }
}
