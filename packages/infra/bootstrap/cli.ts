import "@tsed/logger-connect";

import { useLogger } from "@directus/api/logger/index";
import { withOptions } from "@tsed/config";
import { DotEnvsConfigSource } from "@tsed/config/dotenv";
import { attachLogger, configuration, destroyInjector, injector, logger } from "@tsed/di";
import { $log } from "@tsed/logger";
import path from "path";

const cmsLogger = useLogger();

function print(o: any) {
  if (o?.data?.length && typeof o?.data[0] === "string") {
    return o?.data[0];
  }

  return JSON.stringify(o, null, 2);
}

$log.appenders.clear();
$log.appenders.set("stdout", {
  type: "connect",
  options: {
    logger: {
      info: (o: any) => (cmsLogger.info as any)(print(o)),
      warn: (o: any) => (cmsLogger.warn as any)(print(o)),
      debug: (o: any) => (cmsLogger.debug as any)(print(o)),
      trace: (o: any) => (cmsLogger.trace as any)(print(o)),
      error: (o: any) => (cmsLogger.error as any)(print(o))
    }
  }
});

attachLogger($log);

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
