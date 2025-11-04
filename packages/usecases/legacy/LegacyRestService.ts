import { inject, injectable } from "@tsed/di";
import { DirectusContextService } from "@tsed-cms/infra/directus/DirectusContextService.js";
import type { Package, Repository } from "@tsed-cms/infra/directus/interfaces/DirectusSchema.d.js";

/**
 * Facade service to back the legacy REST endpoints with Directus collections.
 */
export class LegacyRestService {
  protected directusContext = inject(DirectusContextService);

  // GET /rest/github/:owner/:repo → repository info from Directus
  async getRepository(owner: string, repo: string): Promise<Repository | null> {
    const repos = await this.repositories();

    const [row] = await repos.readByQuery({
      filter: {
        owner: { _eq: owner },
        repo: { _eq: repo }
      },
      limit: 1,
      fields: [
        "id",
        "owner",
        "repo",
        "stars",
        "url",
        "maintainers.maintainers_id.id",
        "maintainers.maintainers_id.username",
        "maintainers.maintainers_id.avatar",
        "maintainers.maintainers_id.url"
      ]
    });

    return row || null;
  }

  // GET /rest/warehouse → packages with their maintainers
  async listPackagesWithMaintainers() {
    const pkgsService = await this.packages();
    return pkgsService.readByQuery({
      limit: -1,
      fields: [
        "id",
        "name",
        "icon",
        "description",
        "tags",
        "homepage",
        "downloads",
        "version",
        "repository",
        "npm",
        "stars",
        "type",
        "bugs",
        "maintainers.maintainers_id.id",
        "maintainers.maintainers_id.username",
        "maintainers.maintainers_id.avatar",
        "maintainers.maintainers_id.url"
      ]
    });
  }

  private async repositories() {
    return this.directusContext.getItemsService<Repository, string>("repositories");
  }

  private async packages() {
    return this.directusContext.getItemsService<Package, string>("packages");
  }
}

injectable(LegacyRestService);
