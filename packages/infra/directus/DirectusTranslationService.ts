import { readTranslations } from "@directus/sdk";
import { toMap } from "@tsed/core";
import { inject, injectable } from "@tsed/di";
import { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";
import type { DirectusTranslation } from "@tsed-cms/infra/directus/interfaces/DirectusSchema.js";

export type Translation<T> = DirectusTranslation & { directus_translation_id: string } & T;

export class DirectusTranslationsService {
  directus = inject(DIRECTUS_SERVICE);
  #cache: Map<string, Translation<{}>>;

  async getAll() {
    this.#cache ||= toMap<string>(await this.directus.request(readTranslations()), "language");

    return this.#cache;
  }

  async mapLanguages<T extends { translations: any[] }>(item: T): Promise<T> {
    const translations = await this.getAll();

    item.translations = item.translations.map((translation) => {
      if (translation.directus_translation_id) {
        return translation;
      }

      const language = translation.language || "en-US";

      const { id } = translations.get(language)!;

      return {
        ...translation,
        directus_translations_id: id
      };
    });

    return item;
  }
}

injectable(DirectusTranslationsService);
