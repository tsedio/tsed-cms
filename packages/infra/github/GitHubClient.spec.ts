import { DITest } from "@tsed/di";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GitHubClient } from "./GitHubClient.js";

describe("GitHubClient", () => {
  beforeEach(() => {
    DITest.create({});
  });
  afterEach(() => {
    DITest.reset();
  });

  describe("getSponsors()", () => {
    it("should return the list of sponsors for a username (paginated)", async () => {
      const service = await DITest.invoke(GitHubClient, []);

      const graphql = vi
        .fn()
        // first page
        .mockResolvedValueOnce({
          user: {
            sponsorshipsAsMaintainer: {
              pageInfo: { hasNextPage: true, endCursor: "CUR_1" },
              nodes: [
                {
                  isActive: true,
                  tier: { monthlyPriceInCents: 1000 },
                  sponsorEntity: { __typename: "User", login: "alice", name: "Alice", avatarUrl: "a.png", url: "https://github.com/alice" }
                },
                {
                  isActive: false,
                  tier: { monthlyPriceInCents: 5000 },
                  sponsorEntity: {
                    __typename: "Organization",
                    login: "org1",
                    name: "Org 1",
                    avatarUrl: "o1.png",
                    url: "https://github.com/orgs/org1"
                  }
                }
              ]
            }
          }
        })
        // second (last) page
        .mockResolvedValueOnce({
          user: {
            sponsorshipsAsMaintainer: {
              pageInfo: { hasNextPage: false, endCursor: null },
              nodes: [
                { sponsorEntity: { __typename: "User", login: "bob", name: "Bob", avatarUrl: "b.png", url: "https://github.com/bob" } }
              ]
            }
          }
        });

      (service as any).octokit = { graphql } as any;

      const res = await service.getSponsors("romakita");

      expect(res).toMatchInlineSnapshot(`
        [
          {
            "avatar": "a.png",
            "createdAt": null,
            "firstTransactionAt": null,
            "isCustomAmount": false,
            "isOneTime": false,
            "isOneTimePayment": false,
            "lastTransactionAt": null,
            "login": "alice",
            "monthlyPriceInDollars": null,
            "name": "Alice",
            "status": "published",
            "tier": null,
            "type": "user",
            "url": "https://github.com/alice",
            "visibility": "private",
          },
          {
            "avatar": "o1.png",
            "createdAt": null,
            "firstTransactionAt": null,
            "isCustomAmount": false,
            "isOneTime": false,
            "isOneTimePayment": false,
            "lastTransactionAt": null,
            "login": "org1",
            "monthlyPriceInDollars": null,
            "name": "Org 1",
            "status": "archived",
            "tier": null,
            "type": "organization",
            "url": "https://github.com/orgs/org1",
            "visibility": "private",
          },
          {
            "avatar": "b.png",
            "createdAt": null,
            "firstTransactionAt": null,
            "isCustomAmount": false,
            "isOneTime": false,
            "isOneTimePayment": false,
            "lastTransactionAt": null,
            "login": "bob",
            "monthlyPriceInDollars": null,
            "name": "Bob",
            "status": "archived",
            "tier": null,
            "type": "user",
            "url": "https://github.com/bob",
            "visibility": "private",
          },
        ]
      `);

      expect(graphql).toHaveBeenCalledTimes(2);
      expect(graphql).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("sponsorshipsAsMaintainer"),
        expect.objectContaining({ login: "romakita", after: null })
      );
      expect(graphql).toHaveBeenNthCalledWith(2, expect.any(String), expect.objectContaining({ login: "romakita", after: "CUR_1" }));
    });
  });
});
