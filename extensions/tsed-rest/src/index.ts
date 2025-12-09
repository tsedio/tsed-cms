import { defineEndpoint } from "@directus/extensions-sdk";
import { inject, logger } from "@tsed/di";
import { wrapEndpoint } from "@tsed-cms/infra/bootstrap/directus.js";
import { validate } from "@tsed-cms/infra/validators/validate.js";
import { LegacyRestService } from "@tsed-cms/usecases/legacy/LegacyRestService.js";
import { SlackService } from "@tsed-cms/usecases/slack/SlackService.js";
import { StatsService } from "@tsed-cms/usecases/stats/StatsService.js";

import { CliStatPayload } from "./schema/CliStatPayload.js";

function getCategory(name: string) {
  if (name.startsWith("tsed-cli-") || name.startsWith("@tsed/cli")) {
    return "cli";
  }

  if (name.startsWith("tsed-logger-") || name.startsWith("@tsed/logger")) {
    return "logger";
  }

  return "framework";
}

/**
 * Legacy REST endpoints re-exposed by Directus backed by Directus collections
 * - GET /rest/github/:owner/:repo → repositories
 * - GET /rest/github/:owner/:repo/contributors → maintainers linked to the repository
 * - GET /rest/warehouse → packages with maintainers
 */
export default defineEndpoint({
  id: "rest",
  handler: wrapEndpoint((router) => {
    router.get("/github/:owner/:repo", async (req, res) => {
      const legacy = inject(LegacyRestService);
      const { owner, repo } = req.params as { owner: string; repo: string };

      const data = await legacy.getRepository(owner, repo);

      if (!data) {
        return res.status(404).json({ message: "Repository not found" });
      }

      return res.status(200).json({
        id: data.id,
        html_url: data.url,
        stargazers_count: data.stars,
        watchers_count: 0,
        forks_count: 0,
        open_issues_count: 0
      });
    });

    router.get("/github/:owner/:repo/contributors", async (req, res) => {
      const legacy = inject(LegacyRestService);
      const { owner, repo } = req.params as { owner: string; repo: string };

      const data = await legacy.getRepository(owner, repo);

      if (!data || !data.maintainers) {
        return res.status(200).json([]);
      }

      const maintainers = (data.maintainers as unknown as any[]).map((maintainer: any) => {
        return {
          id: maintainer.maintainers_id.id,
          login: maintainer.maintainers_id.username,
          username: maintainer.maintainers_id.username,
          avatar_url: maintainer.maintainers_id.avatar,
          avatar: maintainer.maintainers_id.avatar,
          url: maintainer.maintainers_id.url,
          html_url: maintainer.maintainers_id.url
        };
      });

      return res.status(200).json(maintainers);
    });

    router.get("/warehouse", async (_req, res) => {
      const legacy = inject(LegacyRestService);

      const data = await legacy.listPackagesWithMaintainers();

      return res.status(200).json(
        data.map((item) => {
          return {
            id: item.id,
            name: item.name,
            icon: item.icon || "",
            description: item.description || "",
            tags: item.tags || [],
            homepage: item.homepage || "",
            downloads: item.downloads || 0,
            version: item.version || "",
            repository: item.repository || "",
            npm: item.repository || "",
            stars: item.stars || 0,
            type: item.type,
            bugs: item.bugs || "",
            category: getCategory(item.name),
            maintainers:
              item.maintainers?.map((maintainer: any) => {
                return {
                  username: maintainer.maintainers_id.username || "",
                  avatar: maintainer.maintainers_id.avatar || "",
                  url: maintainer.maintainers_id.url || ""
                };
              }) || []
          };
        })
      );
    });

    // deprecated
    router.get("/slack/tsedio/tsed", async (_, res) => {
      const slackService = inject(SlackService);

      const [url] = await Promise.all([slackService.get(), slackService.increment()]);

      return res.redirect(302, url);
    });

    router.get("/slack", async (_, res) => {
      const slackService = inject(SlackService);

      const [url] = await Promise.all([slackService.get(), slackService.increment()]);

      return res.redirect(302, url);
    });

    router.post("/cli/stats", async (req, res) => {
      const value = await validate(req.body, CliStatPayload);

      inject(StatsService)
        .create(value)
        .catch((err) => {
          logger().error({
            event: "ERROR_STATS",
            message: err.message
          });
        });

      return res.status(201).send();
    });
  })
});
