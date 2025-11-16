import { injectable } from "@tsed/di";
import { DirectusItemsRepository } from "@tsed-cms/infra/directus/DirectusItemsRepository.js";
import type { CliInstallStat, PackageSymbol } from "@tsed-cms/infra/directus/interfaces/DirectusSchema.d.js";

export class StatsService extends DirectusItemsRepository<CliInstallStat> {
  protected collection = "cli_install_stats" as const;
}

injectable(StatsService);
