import { injectable } from "@tsed/di";
import type { HttpClientOptions } from "@tsed-cms/infra/http/HttpClientOptions.js";
import type { Method } from "axios";
import url from "url";

import { HttpClient } from "../http/HttpClient.js";

const REGEX_REGISTRY_ENFORCED_HTTPS = /^https?:\/\/([^\/]+\.)?(yarnpkg\.com|npmjs\.(org|com))(\/|$)/;
const REGEX_REGISTRY_PREFIX = /^(https?:)?\/\//i;
const REGEX_EXCLUDED_KEYWORDS = /hentai|porn/gi;

export function addSuffix(pattern: string, suffix: string): string {
  if (!pattern.endsWith(suffix)) {
    return pattern + suffix;
  }

  return pattern;
}

export const SCOPE_SEPARATOR = "%2f";

export interface NpmSearchResponse {
  objects: { package: any; score: any; searchScore: any }[];
}

export interface NpmRequestOptions extends HttpClientOptions {
  host?: string;
  unfiltered?: boolean;
  retry?: number;
}

export class NpmClient extends HttpClient {
  baseURL = "https://registry.npmjs.org";
  hostApi = "https://api.npmjs.org";

  async getOptions(method: Method, endpoint: string, options: NpmRequestOptions) {
    endpoint = this.getRequestUrl(options.host || this.baseURL, endpoint);
    options = await super.getOptions(method, endpoint, options);

    return {
      ...options,
      headers: {
        Accept: options.unfiltered ? "application/json" : "application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*",
        ...options.headers
      }
    };
  }

  getRequestUrl(registry: string, pathname: string): string {
    let resolved = pathname;

    if (!REGEX_REGISTRY_PREFIX.test(pathname)) {
      resolved = url.resolve(addSuffix(registry, "/"), pathname);
    }

    if (REGEX_REGISTRY_ENFORCED_HTTPS.test(resolved)) {
      resolved = resolved.replace(/^http:\/\//, "https://");
    }

    return resolved;
  }

  /**
   * Search a module on npm registry
   * @param text
   * @param options
   */
  async search(
    text: string,
    options: {
      size?: number;
      from?: number;
      quality?: number;
      popularity?: number;
      maintenance?: number;
      searchexclude?: string;
    } = {}
  ) {
    const response = await this.get<NpmSearchResponse>(`-/v1/search`, {
      headers: {
        "Accept-Encoding": "gzip"
      },
      params: {
        text,
        size: 250,
        from: 0,
        quality: 0.65,
        popularity: 0.98,
        maintenance: 0.5,
        ...options
      }
    });

    const { objects: result } = response;

    const promises = result
      .filter(({ package: obj }) => !obj.name.match(REGEX_EXCLUDED_KEYWORDS))
      .map(async ({ package: { links, ...props } }) => {
        const downloads = await this.downloads(props.name);

        return {
          ...props,
          repository: links.repository,
          homepage: links.homepage,
          npm: links.npm,
          bugs: links.bugs,
          downloads
        };
      });

    const packages = await Promise.all(promises);

    const filtered = packages
      .filter((pkg) => {
        return pkg.name.match(/tsed/) || pkg.description?.match(/Ts\.ED/gi);
      })
      .filter(Boolean);

    this.logger.info({
      event: "npm:search",
      message: "Filtered packages from result",
      list: packages
        .filter((pkg) => {
          return !(pkg.name.match(/tsed/) || pkg.description?.match(/Ts\.ED/gi));
        })
        .map((pkg) => pkg.name)
    });

    return filtered;
  }

  async downloads(pkg: string): Promise<number> {
    try {
      const { downloads } = await this.get<{ downloads: number }>(`/downloads/point/last-month/${pkg}`, {
        host: this.hostApi
      } as any);

      return downloads;
    } catch (er) {
      this.logger.warn({ message: "Unable to get downloads for the following packages", pkg, error: er });
      return 0;
    }
  }
}

injectable(NpmClient);
