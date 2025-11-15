import type { ApiSymbol } from "../schema/ApiPayloadSchema.js";
import { mapApiSymbolToDirectus } from "./mapApiSymbolToDirectus.js";

describe("mapApiSymbolToDirectus", () => {
  const baseOrigin = "https://tsed.dev";
  const markdownOrigin = "https://tsed.dev/ai/references";

  it("mappe les champs de base correctement", () => {
    const input: ApiSymbol = {
      id: "sym-1",
      path: "/api/core/Controller",
      symbolName: "Controller",
      module: "@tsed/core",
      symbolType: "class",
      status: []
    } as any;

    const out = mapApiSymbolToDirectus(input, baseOrigin, markdownOrigin);

    expect(out).toMatchObject({
      id: "sym-1",
      status: "published",
      name: "Controller",
      type: "class",
      doc_url: "https://tsed.dev/api/core/Controller",
      markdown_url: "https://tsed.dev/ai/references/api/core/Controller.md",
      versions: [],
      deprecated: false,
      tags: []
    });
  });

  it("manages the deprecated status → deprecated=true and tags=[]", () => {
    const input: ApiSymbol = {
      id: "sym-2",
      path: "/api/schema/UseJsonMapper.html",
      symbolName: "UseJsonMapper",
      module: "@tsed/schema",
      symbolType: "decorator",
      status: ["deprecated"]
    } as any;

    const out = mapApiSymbolToDirectus(input, baseOrigin);

    expect(out.deprecated).toBe(true);
    expect(out.tags).toEqual([]);
  });

  it("status undefined → deprecated=false and tags=[]", () => {
    const input: ApiSymbol = {
      id: "sym-3",
      path: "/api/schema/JsonEntityStore.html",
      symbolName: "JsonEntityStore",
      module: "@tsed/schema",
      symbolType: "class"
    } as any;

    const out = mapApiSymbolToDirectus(input, baseOrigin);

    expect(out.deprecated).toBe(false);
    expect(out.tags).toEqual([]);
  });
});
