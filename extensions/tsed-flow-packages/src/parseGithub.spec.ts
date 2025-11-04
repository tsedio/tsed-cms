import { describe, expect, it } from "vitest";

import { parseGitHubRepo } from "./parseGithub.js";

describe("parseGitHubRepo", () => {
  it("parses https url", () => {
    expect(parseGitHubRepo("https://github.com/tsedio/tsed")).toEqual({ owner: "tsedio", repo: "tsed" });
  });

  it("parses http url with .git", () => {
    expect(parseGitHubRepo("http://github.com/tsedio/tsed.git")).toEqual({ owner: "tsedio", repo: "tsed" });
  });

  it("parses git+https url", () => {
    expect(parseGitHubRepo("git+https://github.com/tsedio/tsed.git")).toEqual({ owner: "tsedio", repo: "tsed" });
  });

  it("parses ssh spec", () => {
    expect(parseGitHubRepo("git@github.com:tsedio/tsed.git")).toEqual({ owner: "tsedio", repo: "tsed" });
  });

  it("parses short github: spec", () => {
    expect(parseGitHubRepo("github:tsedio/tsed")).toEqual({ owner: "tsedio", repo: "tsed" });
  });

  it("returns null on non-github host", () => {
    expect(parseGitHubRepo("https://gitlab.com/tsedio/tsed")).toBeNull();
  });

  it("returns null on invalid input", () => {
    expect(parseGitHubRepo("")).toBeNull();
    expect(parseGitHubRepo(undefined as any)).toBeNull();
    expect(parseGitHubRepo(null as any)).toBeNull();
  });
});
