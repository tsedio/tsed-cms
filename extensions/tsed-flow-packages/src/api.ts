import { defineOperationApi } from "@directus/extensions-sdk";
import { inject } from "@tsed/di";
import { wrapOperation } from "@tsed-cms/infra/bootstrap/directus.js";
import type { Package } from "@tsed-cms/infra/directus/interfaces/DirectusSchema.js";
import { GitHubClient } from "@tsed-cms/infra/github/GitHubClient.js";
import { NpmClient } from "@tsed-cms/infra/npm/NpmClient.js";
import { PackagesService } from "@tsed-cms/usecases/packages/PackagesService.js";

import { parseGitHubRepo } from "./parseGithub.js";

export type Options = {
  text?: string;
};

function mapNpmPackage(pkg: any): Partial<Package> & Pick<Package, "name" | "type"> {
  return {
    name: pkg.name,
    type: "3rd-party",
    description: pkg.description ?? null,
    homepage: pkg.homepage ?? null,
    downloads: pkg.downloads ?? null,
    version: pkg.version ?? null,
    repository: pkg.repository ?? null,
    npm: pkg.npm ?? null,
    bugs: (typeof pkg.bugs === "string" ? pkg.bugs : pkg.bugs?.url) ?? null
  } as Partial<Package> & Pick<Package, "name" | "type">;
}

async function getStars(owner: string, repo: string) {
  const github = inject(GitHubClient);

  try {
    const info = await github.getInfo(owner, repo);

    return info.stargazers_count ?? 0;
  } catch (er) {
    // Log via console to avoid failing the whole operation; set stars to 0 when known repo but request failed
    return 0;
  }
}

// Resolve owner and package name from a scoped npm package name like @owner/name
function ownerAndPackageFromName(name: string | null | undefined): { owner: string; packageName: string } | null {
  if (!name) return null;
  const m = String(name).match(/^@([^/]+)\/([^/]+)$/);
  if (!m) return null;
  const owner = m[1];
  const packageName = `@${m[1]}/${m[2]}`;
  return { owner, packageName };
}

export default defineOperationApi<Options>({
  id: "tsed-flow-packages",
  handler: wrapOperation(async (opts, _context) => {
    const startedAt = Date.now();

    const npm = inject(NpmClient);
    const github = inject(GitHubClient);
    const packagesService = inject(PackagesService);

    const text = (opts?.text?.trim() || "tsed").toString();

    let processed = 0;
    let packagesUpserted = 0;

    // Premium handling metrics
    let premiumProcessed = 0;
    let premiumUpdated = 0;
    let premiumVersionUpdated = 0;

    const errors: { pkg: string; error: string }[] = [];

    // Search on NPM
    const results = await npm.search(text);

    for (const pkg of results) {
      try {
        const input = mapNpmPackage(pkg);

        // Enrich with GitHub stars when repository points to GitHub
        let stars: number | null = null;
        const repoUrl: string | undefined = input.repository || pkg.repository;
        const parsed = repoUrl ? parseGitHubRepo(repoUrl) : null;

        if (parsed) {
          stars = await getStars(parsed.owner, parsed.repo);
        }

        await packagesService.upsertOne({ ...input, stars });
        packagesUpserted += 1;
        processed += 1;
      } catch (er: any) {
        errors.push({ pkg: pkg?.name, error: er?.message || String(er) });
      }
    }

    // Update premium packages (not on NPM) from GitHub
    const premiums = await packagesService.listByType("premium");
    for (const p of premiums) {
      try {
        premiumProcessed += 1;
        const repoUrl = p.repository || undefined;
        const parsed = repoUrl ? parseGitHubRepo(repoUrl) : null;

        if (!parsed) {
          continue;
        }

        try {
          const info = await github.getInfo(parsed.owner, parsed.repo);
          const description = info.description ?? p.description ?? null;
          const stars = await getStars(parsed.owner, parsed.repo);

          // Fetch latest version from GitHub Packages (npm) using the package name itself (e.g., @scope/name)
          const resolved = ownerAndPackageFromName(p.name as unknown as string);
          let version: string | null = p.version ?? null;

          if (resolved) {
            try {
              const latest = await github.getNpmPackageLatestVersion(resolved.owner, resolved.packageName);

              if (latest) {
                version = latest;
              }
            } catch (verErr: any) {
              errors.push({ pkg: p.name, error: verErr?.message || String(verErr) });
            }
          }

          await packagesService.updateMetadata(p.id, { description, stars, version });

          premiumUpdated += 1;
        } catch (er) {
          // if GitHub failed, keep existing data and log error
          errors.push({ pkg: p.name, error: (er as any)?.message || String(er) });
        }
      } catch (er: any) {
        errors.push({ pkg: p?.name, error: er?.message || String(er) });
      }
    }

    return {
      processed,
      packagesUpserted,
      premiumProcessed,
      premiumUpdated,
      premiumVersionUpdated,
      durationMs: Date.now() - startedAt,
      errors
    };
  })
});
