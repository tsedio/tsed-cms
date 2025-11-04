import { DITest, inject } from "@tsed/di";

import { NpmClient } from "./NpmClient.js";

describe("NpmClient", () => {
  beforeEach(() =>
    DITest.create({
      cache: false
    })
  );
  afterEach(() => DITest.reset());
  describe("search()", () => {
    it("should return all package that match the given search pattern", async () => {
      const service = inject(NpmClient);

      vi.spyOn(service, "get").mockResolvedValue({
        objects: [
          {
            package: {
              name: "@tsed/common",
              links: {
                repository: "links.repository",
                homepage: "links.homepage",
                npm: "links.npm",
                bugs: "links.bugs"
              }
            }
          },
          {
            package: {
              name: "@hentai/root"
            }
          }
        ]
      });

      vi.spyOn(service, "downloads").mockResolvedValue(0);

      const result = await service.search("tsed");

      expect(result).toEqual([
        {
          bugs: "links.bugs",
          downloads: 0,
          homepage: "links.homepage",
          name: "@tsed/common",
          npm: "links.npm",
          repository: "links.repository"
        }
      ]);
      expect(service.get).toHaveBeenCalledWith("-/v1/search", {
        headers: { "Accept-Encoding": "gzip" },
        params: { from: 0, maintenance: 0.5, popularity: 0.98, quality: 0.65, size: 250, text: "tsed" }
      });
    });
  });
});
