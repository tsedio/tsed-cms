import { inject } from "@tsed/di";
import { defineOperationApi } from "@tsed/directus-sdk";
import type { Maintainer } from "@tsed-cms/infra/directus/interfaces/DirectusSchema.js";
import { GitHubClient } from "@tsed-cms/infra/github/GitHubClient.js";
import { getAllPages } from "@tsed-cms/infra/github/utils/getAllPages.js";
import { MaintainersService } from "@tsed-cms/usecases/maintainers/MaintainersService.js";
import { RepositoriesService } from "@tsed-cms/usecases/repositories/RepositoriesService.js";

// Options can be extended later if needed (e.g., limit to owner/repo)
type Options = {
  text?: string;
};

function mapGitHubUserWithEmail(c: any) {
  return {
    username: c.login,
    url: c.html_url ?? null,
    avatar: c.avatar_url ?? null,
    email: c.email ?? null
  };
}

async function getUserEmail(username: string) {
  try {
    if (username) {
      const github = inject(GitHubClient);
      const user = await github.getUser(username);
      return user.email;
    }
  } catch {
    return null;
  }
}

export default defineOperationApi<Options>({
  id: "tsed-flow-repositories",
  handler: async (_opts, _context) => {
    const startedAt = Date.now();

    const github = inject(GitHubClient);
    const maintainersService = inject(MaintainersService);
    const repositoriesService = inject(RepositoriesService);

    // Read all repositories configured in Directus
    const repositories = await repositoriesService.listAll();

    let reposProcessed = 0;
    let maintainersUpserted = 0;
    let junctionsLinked = 0;

    const errors: { repo: string; error: string }[] = [];

    for (const repo of repositories) {
      if (!repo.owner || !repo.repo) continue;

      try {
        // Fetch repository info from GitHub
        const info = await github.getInfo(repo.owner, repo.repo);

        // Update repository metadata
        await repositoriesService.updateMetadata(repo.id, {
          stars: info.stargazers_count ?? 0,
          url: info.html_url ?? info.url ?? null
        });

        // Fetch contributors with pagination
        let contributors = await getAllPages((page, perPage) => github.getContributors(repo.owner, repo.repo, page, perPage), 100);
        // Keep only real GitHub users (exclude bots/organizations) and those with a valid login
        contributors = contributors.filter((c) => c?.login && c?.type === "User");

        // Upsert maintainers by username and collect their IDs
        const maintainers: Maintainer[] = [];

        for (const contributor of contributors) {
          if (!contributor.login) {
            continue;
          }

          const email = await getUserEmail(contributor.login);
          const maintainer = mapGitHubUserWithEmail({ ...contributor, email });
          const updated = await maintainersService.upsertOne(maintainer);
          maintainers.push(updated);
          maintainersUpserted += 1;
        }

        // Ensure repository <-> maintainer junction links
        const created = await repositoriesService.ensureMaintainersLinks(
          repo.id,
          maintainers.map((m) => m.id as string)
        );

        junctionsLinked += created;

        reposProcessed++;
      } catch (er: any) {
        errors.push({ repo: `${repo.owner}/${repo.repo}`, error: er?.message || String(er) });
      }
    }

    return {
      processed: reposProcessed,
      maintainersUpserted,
      junctionsLinked,
      durationMs: Date.now() - startedAt,
      errors
    };
  }
});
