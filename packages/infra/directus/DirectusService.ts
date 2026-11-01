import { authentication, createDirectus, graphql, rest } from "@directus/sdk";
import { constant, injectable, logger } from "@tsed/di";

import { type Schema } from "./interfaces/DirectusSchema.js";

export const DIRECTUS_SERVICE = injectable("DirectusService")
  .asyncFactory(async () => {
    const url = constant<string>("PUBLIC_URL")!;
    const email = constant<string>("ADMIN_EMAIL")!;
    const directus = createDirectus<Schema>(url).with(rest()).with(graphql()).with(authentication("json"));

    try {
      await directus.login({ email, password: constant<string>("ADMIN_PASSWORD")! });
    } catch (error) {
      throw new Error(`Unable to log in to Directus ${url} as ${email}: ${(error as Error).message}`, { cause: error });
    }

    return directus;
  })
  .hooks({
    async $onDestroy(directus: any) {
      // The instance is missing when the factory failed (e.g. invalid credentials): nothing to log out from.
      if (typeof directus?.logout !== "function") {
        return;
      }

      logger().info("Destroying Directus connection...");

      try {
        await directus.logout();
      } catch (error) {
        logger().warn(`Directus logout failed: ${(error as Error).message}`);
      }
    }
  })
  .token();

export type DIRECTUS_SERVICE = typeof DIRECTUS_SERVICE;
