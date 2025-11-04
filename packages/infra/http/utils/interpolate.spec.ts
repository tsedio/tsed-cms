import { interpolate } from "./interpolate.js";

describe("interpolate", () => {
  it("should interpolate", () => {
    expect(interpolate("Hello {name}", { name: "World" })).toEqual("Hello World");
    expect(
      interpolate("Hello {name} {lastname}", {
        name: "World",
        lastname: "foo"
      })
    ).toEqual("Hello World foo");
    expect(interpolate("Hello {name} {lastname}", { name: "World" })).toEqual("Hello World ");
  });
});
