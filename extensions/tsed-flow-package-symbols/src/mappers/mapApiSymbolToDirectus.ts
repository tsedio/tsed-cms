import type { PackageSymbol } from "@tsed-cms/infra/directus/interfaces/DirectusSchema.js";

import type { ApiSymbol } from "../schema/ApiPayloadSchema.js";

/**
 * Build a valid PackageSymbol payload (without the `package` relation)
 * from a single ApiJsonModuleSymbol item.
 *
 * Responsibility: mapping fields and normalizing optional metadata only.
 * Caller is responsible for resolving/ensuring the `package` id.
 */
export function mapApiSymbolToDirectus(symbol: ApiSymbol, baseOrigin: string, markdownUrl?: string) {
  const deprecated = symbol.status ? symbol.status.includes("deprecated") : false;
  const tags = (symbol.status || []).filter((t) => t !== "deprecated");

  return {
    id: symbol.id,
    status: "published",
    name: symbol.symbolName,
    type: symbol.symbolType as PackageSymbol["type"],
    doc_url: `${baseOrigin}${symbol.path}`,
    markdown_url: `${markdownUrl}${symbol.path}.md`,
    additional_doc_url: "",
    versions: [] as string[],
    deprecated,
    tags
  } satisfies Omit<PackageSymbol, "package" | "user_created" | "date_created" | "user_updated" | "date_updated">;
}
