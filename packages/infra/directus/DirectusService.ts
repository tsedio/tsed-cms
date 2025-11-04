import { authentication, createDirectus, graphql, rest } from "@directus/sdk";
import { constant, injectable, logger } from "@tsed/di";

import { type Schema } from "./interfaces/DirectusSchema.js";

export const DIRECTUS_SERVICE = injectable("DirectusService")
  .asyncFactory(async () => {
    const directus = createDirectus<Schema>(constant<string>("PUBLIC_URL")!).with(rest()).with(graphql()).with(authentication("json"));

    await directus.login({
      email: constant<string>("ADMIN_EMAIL")!,
      password: constant<string>("ADMIN_PASSWORD")!
    });

    return directus;
  })
  .hooks({
    $onDestroy(directus: any) {
      logger().info("Destroying Directus connection...");

      return directus.logout();
    }
  })
  .token();

export type DIRECTUS_SERVICE = typeof DIRECTUS_SERVICE;
