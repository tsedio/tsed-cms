import { Octokit } from "@octokit/rest";
import { RequestParameters } from "@octokit/types";
import { constant, injectable } from "@tsed/di";
import { getAllPagesGql } from "@tsed-cms/infra/github/utils/getAllPages.js";
import { HttpLogClient } from "@tsed-cms/infra/http/HttpLogClient.js";
import { coerce, rcompare } from "semver";

interface GithubSponsor {
  login: string;
  name: string;
  avatar: string;
  url: string;
  type: "user" | "organization";
  status: "draft" | "published" | "archived";
  createdAt: string | null;
  visibility: "public" | "private";
  isOneTimePayment: boolean | null;
  tierSelectedAt: string | null;
  tier: string;
  monthlyPriceInDollars: number | null;
  firstTransactionAt: string | null;
  lastTransactionAt: string | null;
  isCustomAmount: boolean | null;
  isOneTime: boolean | null;
}

/**
 * GitHub API client for accessing GitHub resources
 */
export class GitHubClient extends HttpLogClient {
  callee = "GITHUB";
  octokit: Octokit;

  protected token = constant<string>("GITHUB_TOKEN", "");

  $onInit() {
    this.octokit = new Octokit({
      auth: this.token
    });
    this.octokit.hook.after("request", async (response, options: RequestParameters) => {
      this.onSuccess({ ...response, ...options } as any);
    });

    this.octokit.hook.error("request", async (error: Error, options: RequestParameters) => {
      this.onError({ ...options, error } as any);
      throw error;
    });
  }

  async getInfo(owner: string, repo: string) {
    const { data } = await this.octokit.repos.get({ owner, repo });
    return data;
  }

  async getContributors(owner: string, repo: string, page: number, per_page: number) {
    const { data } = await this.octokit.repos.listContributors({ owner, repo, page, per_page });
    return data;
  }

  async getUser(username: string) {
    const { data } = await this.octokit.users.getByUsername({ username });
    return data;
  }

  /**
   * Returns the list of sponsors (public) for the given GitHub username.
   * Uses the GitHub GraphQL API (requires a token with read:org or sponsors perms depending on visibility).
   */
  async getSponsors(username: string): Promise<GithubSponsor[]> {
    const query = `
      query($login: String!, $after: String) {
        user(login: $login) {
          sponsorshipsAsMaintainer(first: 100, after: $after, includePrivate: true) {
            pageInfo { hasNextPage endCursor }
            nodes {
              id
              createdAt
              privacyLevel
              isOneTimePayment
              tierSelectedAt
              isActive
              sponsorEntity {
                __typename
                ... on User { login name avatarUrl url }
                ... on Organization { login name avatarUrl url }
              }
              tier {
                id
                name
                monthlyPriceInCents
                createdAt
                isCustomAmount
                isOneTime
                monthlyPriceInDollars
                updatedAt
              }
            }
          }
        }
      }
    `;

    return getAllPagesGql(async (after) => {
      const res: any = await (this.octokit as any).graphql(query, { login: username, after });
      const conn = res?.user?.sponsorshipsAsMaintainer;
      const nodes = conn?.nodes || [];

      const items = nodes
        .map((n: any) => {
          const s = n?.sponsorEntity;
          if (!s?.login) {
            return undefined;
          }

          return {
            login: s.login,
            name: s.name || "",
            avatar: s.avatarUrl,
            url: s.url,
            type: (s.__typename as "User" | "Organization").toLowerCase(),
            status: n?.isActive ? "published" : "archived",
            createdAt: n?.createdAt ?? null,
            visibility: n?.privacyLevel?.toLowerCase() ?? "private",
            tier: n.tier?.name ?? null,
            monthlyPriceInDollars: n.tier?.monthlyPriceInDollars ?? null,
            firstTransactionAt: n?.tierSelectedAt ?? null,
            lastTransactionAt: n.tier?.updatedAt ?? null,
            isCustomAmount: !!n.tier?.isCustomAmount,
            isOneTimePayment: !!n.isOneTimePayment,
            isOneTime: !!n.tier?.isOneTime
          };
        })
        .filter((n: GithubSponsor | undefined) => n !== undefined) as GithubSponsor[];

      return {
        items,
        pageInfo: conn?.pageInfo
      };
    });
  }

  /**
   * Returns the latest version string of an npm package stored in GitHub Packages for the given owner.
   * Tries organization first, then user namespace. Requires GITHUB_TOKEN with read:packages.
   * Uses semver to pick the highest version when available, falling back to created_at ordering.
   */
  async getNpmPackageLatestVersion(owner: string, packageName: string): Promise<string | null> {
    const pickLatest = (versions: any[]): string | null => {
      const rawVersions = (versions || []).map((v: any) => v?.name ?? v?.metadata?.package?.version).filter(Boolean) as string[];
      const semvers = rawVersions.map((s) => coerce(s)).filter(Boolean) as ReturnType<typeof coerce>[];

      if (semvers.length) {
        // Highest semver first
        const sorted = [...semvers].sort((a: any, b: any) => rcompare(a, b));
        return sorted[0]!.version;
      }

      // Fallback by created_at when no semver could be parsed
      const latest = [...(versions || [])].sort(
        (a: any, b: any) => new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime()
      )[0];
      return (latest as any)?.name || (latest as any)?.metadata?.package?.version || null;
    };

    const { data: versions } = await this.octokit.packages.listPackagesForOrganization({
      org: owner,
      package_type: "npm",
      package_name: packageName,
      per_page: 100
    } as any);

    return pickLatest(versions as any[]);
  }
}

injectable(GitHubClient);
