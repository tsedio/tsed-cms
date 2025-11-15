import { type ApiJsonModuleSymbol, mapApiSymbolToDirectus } from "./mapApiSymbolToDirectus.js";

describe("mapApiSymbolToDirectus", () => {
  const baseOrigin = "https://tsed.dev";
  const markdownOrigin = "https://tsed.dev/ai/references";
  const pkgId = "pkg-1";

  it("mappe les champs de base correctement", () => {
    const input: ApiJsonModuleSymbol = {
      id: "sym-1",
      path: "/api/core/Controller",
      symbolName: "Controller",
      module: "@tsed/core",
      symbolType: "class",
      status: []
    };

    const out = mapApiSymbolToDirectus(pkgId, input, baseOrigin, markdownOrigin);

    expect(out).toMatchObject({
      id: "sym-1",
      status: "published",
      name: "Controller",
      type: "class",
      doc_url: "https://tsed.dev/api/core/Controller",
      markdown_url: "https://tsed.dev/ai/references/api/core/Controller.md",
      versions: [],
      package: pkgId,
      deprecated: false,
      tags: []
    });
  });

  it("gère le statut deprecated → deprecated=true et tags=['deprecated']", () => {
    const input: ApiJsonModuleSymbol = {
      id: "sym-2",
      path: "/api/schema/UseJsonMapper.html",
      symbolName: "UseJsonMapper",
      module: "@tsed/schema",
      symbolType: "decorator",
      status: ["deprecated"]
    };

    const out = mapApiSymbolToDirectus(pkgId, input, baseOrigin);

    expect(out.deprecated).toBe(true);
    expect(out.tags).toEqual(["deprecated"]);
  });

  it("status non défini → deprecated=false et tags=[]", () => {
    const input: ApiJsonModuleSymbol = {
      id: "sym-3",
      path: "/api/schema/JsonEntityStore.html",
      symbolName: "JsonEntityStore",
      module: "@tsed/schema",
      symbolType: "class"
    } as any;

    const out = mapApiSymbolToDirectus(pkgId, input, baseOrigin);

    expect(out.deprecated).toBe(false);
    expect(out.tags).toEqual([]);
  });
});
