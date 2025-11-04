import { DITest } from "@tsed/di";
import { DirectusContextService } from "@tsed-cms/infra/directus/DirectusContextService.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MaintainersService } from "./MaintainersService.js";

function createItemsServiceMock(initial: any[] = []) {
  const state = {
    rows: [...initial],
    lastId: 0
  };

  return {
    readByQuery: vi.fn(async (query?: any) => {
      if (!query || query.limit === -1) return state.rows;
      if (query.filter?.username?._eq !== undefined) {
        const found = state.rows.filter((r) => r.username === query.filter.username._eq);
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

async function createFixture(itemsMock: any) {
  const directusContextService = {
    getItemsService: vi.fn(async (collection: string) => {
      if (collection === "maintainers") return itemsMock;
      throw new Error("Unexpected collection: " + collection);
    })
  };

  const service = await DITest.invoke(MaintainersService, [
    {
      token: DirectusContextService,
      use: directusContextService
    }
  ]);

  return { service, directusContextService };
}

describe("MaintainersService", () => {
  beforeEach(() => DITest.create({ cache: false }));
  afterEach(() => DITest.reset());

  it("findByUsername returns the maintainer when found", async () => {
    const items = createItemsServiceMock([{ id: "m1", username: "romakita", url: "a" }]);

    const { service } = await createFixture(items);

    const res = await service.findByUsername("romakita");

    expect(res).toEqual({ id: "m1", username: "romakita", url: "a" });
    expect(items.readByQuery).toHaveBeenCalledWith({ filter: { username: { _eq: "romakita" } }, limit: 1 });
  });

  it("findByUsername returns null when not found", async () => {
    const items = createItemsServiceMock([]);

    const { service } = await createFixture(items);

    const res = await service.findByUsername("nobody");

    expect(res).toBeNull();
  });

  it("upsertOne updates existing maintainer preserving existing values when undefined", async () => {
    const items = createItemsServiceMock([{ id: "m1", username: "user", url: "u", email: "e@e", avatar: "a" }]);

    const { service } = await createFixture(items);

    const result = await service.upsertOne({ username: "user", url: undefined, email: undefined });

    expect(items.updateOne).toHaveBeenCalledWith("m1", {
      username: "user",
      url: "u",
      avatar: "a",
      email: "e@e"
    });
    expect(result).toEqual({ id: "m1", username: "user", url: "u", email: "e@e", avatar: "a" });
  });

  it("upsertOne creates a new maintainer with defaults and published status", async () => {
    const items = createItemsServiceMock([]);

    const { service } = await createFixture(items);

    const created = await service.upsertOne({ username: "newuser" });

    expect(items.createOne).toHaveBeenCalledWith({
      username: "newuser",
      url: null,
      avatar: null,
      email: null,
      status: "published"
    });
    expect(created).toEqual({ id: "id_1", username: "newuser", url: null, avatar: null, email: null, status: "published" });
  });
});
