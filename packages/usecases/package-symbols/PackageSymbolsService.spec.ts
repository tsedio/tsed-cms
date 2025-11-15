import { DITest } from "@tsed/di";
import { DirectusContextService } from "@tsed-cms/infra/directus/DirectusContextService.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PackageSymbolsService } from "./PackageSymbolsService.js";

function createItemsServiceMock(initial: any[] = []) {
  const state = new Map<string, any>(initial.map((r) => [r.id, { ...r }]));

  return {
    readOne: vi.fn(async (id: string) => state.get(id) || null),
    updateOne: vi.fn(async (id: string, data: any) => {
      const next = { ...(state.get(id) || {}), ...data };
      state.set(id, next);
      return id;
    }),
    createOne: vi.fn(async (data: any) => {
      const id = data.id || `id_${state.size + 1}`;
      const next = { ...data, id };
      state.set(id, next);
      return id;
    })
  };
}

async function createFixture(itemsMock: any) {
  const directusContextService = {
    getItemsService: vi.fn(async (_collection: string) => itemsMock)
  } as unknown as Pick<DirectusContextService, "getItemsService">;

  const service = await DITest.invoke(PackageSymbolsService, [{ token: DirectusContextService, use: directusContextService }]);

  return { service, itemsMock };
}

describe("PackageSymbolsService.upsertOne", () => {
  beforeEach(() => DITest.create({ cache: false }));
  afterEach(() => DITest.reset());

  it("met à jour quand l'élément existe", async () => {
    const existing = {
      id: "sym-1",
      name: "Controller",
      type: "class",
      package: "@tsed/di",
      status: "published",
      doc_url: "https://tsed.dev/api/Controller",
      deprecated: false,
      tags: []
    };
    const items = createItemsServiceMock([existing]);
    const { service, itemsMock } = await createFixture(items);

    const updated = await service.upsertOne({
      ...existing,
      doc_url: "https://tsed.dev/api/new",
      deprecated: true,
      tags: ["deprecated"]
    } as any);

    expect(itemsMock.updateOne).toHaveBeenCalledTimes(1);
    expect(itemsMock.updateOne).toHaveBeenCalledWith(
      "sym-1",
      expect.objectContaining({
        doc_url: "https://tsed.dev/api/new",
        deprecated: true
      })
    );
    // Le service retourne l'input tel quel (pas de read final)
    expect(updated.doc_url).toBe("https://tsed.dev/api/new");
    expect(updated.deprecated).toBe(true);
  });

  it("crée quand l'élément n'existe pas", async () => {
    const items = createItemsServiceMock([]);
    const { service, itemsMock } = await createFixture(items);

    const created = await service.upsertOne({
      id: "sym-2",
      name: "UseJsonMapper",
      type: "decorator",
      package: "@tsed/schema",
      status: "published",
      doc_url: "https://tsed.dev/api/UseJsonMapper",
      deprecated: false,
      tags: []
    } as any);

    expect(itemsMock.createOne).toHaveBeenCalledTimes(1);
    expect(itemsMock.createOne).toHaveBeenCalledWith(expect.objectContaining({ id: "sym-2", name: "UseJsonMapper" }));
    // Le service retourne l'input tel quel
    expect(created.id).toBe("sym-2");
    expect(created.name).toBe("UseJsonMapper");
  });
});
