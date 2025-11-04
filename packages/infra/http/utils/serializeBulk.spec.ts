import { serializeBulk } from "./serializeBulk.js";

describe("serializeBulk", () => {
  it("should serialize bulk", () => {
    expect(serializeBulk(['{"id": "id"}', { test: "test" }])).toMatchInlineSnapshot(`
      "{"id": "id"}
      {"test":"test"}
      "
    `);
  });
});
