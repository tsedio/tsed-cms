import { injectable } from "@tsed/di";
import { HttpClient } from "@tsed-cms/infra/http/HttpClient.js";

export interface WarehousePluginMaintainer {
  username?: string;
  url?: string | null;
  avatar?: string | null;
  email?: string | null;
}

export interface WarehousePluginItem {
  name: string;
  description?: string | null;
  tags?: string[] | null;
  homepage?: string | null;
  downloads?: number | null;
  version?: string | null;
  repository?: string | null;
  npm?: string | null;
  stars?: number | null;
  type?: "official" | "premium" | "3rd-party" | string | null;
  bugs?: string | null;
  icon?: string | null;
  maintainers?: Array<WarehousePluginMaintainer | string> | null;
}

/**
 * Minimal client for Ts.ED Warehouse REST API
 */
export class LegacyApiClient extends HttpClient {
  baseURL = "https://api.tsed.io/rest";
  callee = "LEGACY_API";

  /**
   * Fetch plugins list from warehouse.
   * The API may return either an array or an object containing a `plugins`/`packages` array.
   */
  async getPlugins(): Promise<WarehousePluginItem[]> {
    return this.get("/warehouse");
  }
}

injectable(LegacyApiClient);
