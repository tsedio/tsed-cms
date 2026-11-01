import type { DIRECTUS_SERVICE } from "@tsed-cms/infra/directus/DirectusService.js";
import { logger } from "@tsed/di";

import { fetchCollection, sortBy, writeCollectionFiles } from "./utils/export-collection.js";

// Sponsors who chose a private visibility must never be written to the (public) repository.
export function isPublicSponsor(sponsor: { visibility?: string | null }) {
  return sponsor.visibility !== "private";
}

export default async (directus: DIRECTUS_SERVICE) => {
  logger().info("[export:sponsors] fetch sponsors");
  const allSponsors = await fetchCollection(directus, "sponsors", { fields: ["*"] });
  const sponsors = sortBy(allSponsors.filter(isPublicSponsor), (item) => `${item.login}:${item.id}`);

  logger().info(`[export:sponsors] keep ${sponsors.length}/${allSponsors.length} public sponsors`);

  // Reset mode also removes the files of sponsors that became private.
  await writeCollectionFiles("sponsors", sponsors, { slugOf: (item) => item.login });
  logger().info("[export:sponsors] complete");
};
