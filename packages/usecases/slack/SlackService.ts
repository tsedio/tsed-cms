import { inject, injectable } from "@tsed/di";
import { SettingsRepository } from "@tsed-cms/infra/directus/SettingsRepository.js";

export class SlackService {
  protected settings = inject(SettingsRepository);

  get(): Promise<string> {
    return this.settings.get("slack") as Promise<string>;
  }

  async increment() {
    const count = (await this.settings.get("slack_tracking")) as number;

    await this.settings.set("slack_tracking", count + 1);
  }
}

injectable(SlackService);
