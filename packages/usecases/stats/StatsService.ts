import { DirectusItemsRepository } from "@tsed-cms/infra/directus/DirectusItemsRepository.js";
import type { CliInstallStat, PackageSymbol } from "@tsed-cms/infra/directus/interfaces/DirectusSchema.d.js";
import { injectable } from "@tsed/di";

export class StatsService extends DirectusItemsRepository<CliInstallStat> {
  protected collection = "cli_install_stats" as const;
}

injectable(StatsService);
