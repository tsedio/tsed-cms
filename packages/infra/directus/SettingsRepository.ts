import { injectable } from "@tsed/di";
import { DirectusItemsRepository } from "@tsed-cms/infra/directus/DirectusItemsRepository.js";
import type { Settings } from "@tsed-cms/infra/directus/interfaces/DirectusSchema.js";

export class SettingsRepository extends DirectusItemsRepository<Settings> {
  protected collection: string = "settings";

  async get<K extends keyof Settings>(key: K): Promise<Settings[K]> {
    const item = await this.getAll();

    return item[key];
  }

  async set<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
    const service = await this.getCollection();

    await service.updateByQuery({}, { [key]: value });
  }

  protected async getAll(): Promise<Settings> {
    const service = await this.getCollection();

    const item = await service.readSingleton({});

    return item as unknown as Settings;
  }
}

injectable(SettingsRepository);
