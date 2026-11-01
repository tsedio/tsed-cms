import "@tsed/logger-connect";
import "@tsed/directus-sdk/attach-logger";
import path from "path";

import { withOptions } from "@tsed/config";
import { DotEnvsConfigSource } from "@tsed/config/dotenv";
import { configuration, destroyInjector, injector, logger } from "@tsed/di";

configuration().set({
  extends: [
    withOptions(DotEnvsConfigSource, {
      name: "envs",
      path: path.join(import.meta.dirname, "../../../config")
    })
  ]
});

export async function cli(main: () => Promise<void>) {
  try {
    await injector().load();

    await main();

    await destroyInjector();
  } catch (error: any) {
    logger().error("Unhandled error: " + error.message + "\n" + error.stack);

    await destroyInjector();

    process.exit(1);
  }
}
