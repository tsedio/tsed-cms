import { DITest } from "@tsed/di";
import { DirectusContextService } from "@tsed-cms/infra/directus/DirectusContextService.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RepositoriesService } from "./RepositoriesService.js";

function createItemsServiceMock(initial: any[] = []) {
  const state = {
    rows: [...initial],
    lastId: 0
  };

  return {
    readByQuery: vi.fn(async (query?: any) => {
      if (!query || query.limit === -1) return state.rows;
      if (query.filter?.repositories_id && query.filter?.maintainers_id) {
        const found = state.rows.filter(
          (r) => r.repositories_id === query.filter.repositories_id._eq && r.maintainers_id === query.filter.maintainers_id._eq
        );
        return found.slice(0, query.limit ?? 1);
      }
      return [];
    }),
    readOne: vi.fn(async (id: any) => {
      return state.rows.find((r) => r.id === id) ?? null;
    }),
    updateOne: vi.fn(async (id: any, data: any) => {
      const idx = state.rows.findIndex((r) => r.id === id);
      if (idx > -1) {
        state.rows[idx] = { ...state.rows[idx], ...data };
      }
      return id;
    }),
    createOne: vi.fn(async (data: any) => {
      const id = data.id ?? `id_${++state.lastId}`;
      const row = { ...data, id };
      state.rows.push(row);
      return id;
    }),
    _state: state
  };
}

async function createFixture(itemsMock: any, junctionMock?: any) {
  const directusContextService = {
    getItemsService: vi.fn(async (collection: string) => {
      if (collection === "repositories") return itemsMock;
      if (collection === "repositories_maintainers") return junctionMock ?? createItemsServiceMock();
      throw new Error("Unexpected collection: " + collection);
    })
  };

  const service = await DITest.invoke(RepositoriesService, [
    {
      token: DirectusContextService,
      use: directusContextService
    }
  ]);

  return {
    service,
    directusContextService
  };
}

describe("RepositoriesService", () => {
  beforeEach(() => DITest.create({ cache: false }));
  afterEach(() => DITest.reset());

  it("updateMetadata updates and returns the repository", async () => {
    const items = createItemsServiceMock([{ id: "r1", name: "repo", stars: 0, url: "a" }]);
    const { service } = await createFixture(items);

    const result = await service.updateMetadata("r1" as any, { stars: 10, url: "b" } as any);

    expect(items.updateOne).toHaveBeenCalledWith("r1", { stars: 10, url: "b" });
    expect(result).toEqual({ id: "r1", name: "repo", stars: 10, url: "b" });
  });

  it("ensureMaintainersLinks creates missing links and counts ensured ones", async () => {
    const items = createItemsServiceMock([{ id: "r1", name: "repo" }]);
    const junction = createItemsServiceMock([{ id: "j1", repositories_id: "r1", maintainers_id: "m2" }]);

    const { service } = await createFixture(items, junction);

    const count = await service.ensureMaintainersLinks("r1" as any, ["m1", "m2", "m3"] as any);

    expect(count).toBe(3);
    expect(junction.createOne).toHaveBeenCalledTimes(2);
    expect(junction.createOne).toHaveBeenNthCalledWith(1, { repositories_id: "r1", maintainers_id: "m1" });
    expect(junction.createOne).toHaveBeenNthCalledWith(2, { repositories_id: "r1", maintainers_id: "m3" });
  });
});
