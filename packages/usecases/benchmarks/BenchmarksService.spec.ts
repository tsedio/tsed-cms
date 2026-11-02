import { DirectusContextService } from "@tsed-cms/infra/directus/DirectusContextService.js";
import { DITest } from "@tsed/di";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import fixture from "./__fixtures__/benchmark-run.json" with { type: "json" };
import { BenchmarksService, comparedVersion, toBenchmarkComparison } from "./BenchmarksService.js";

// Real CI run: 8.44.1 (reference) vs 8.44.12 on Express, Koa and Fastify, with the raw apps
const baseRun = fixture.run as any;
const rows = fixture.rows as any[];

async function createService(runs: any[], results = rows) {
  // applies the trigger filter, the date sort and the pagination of the service query
  const runsService = {
    readByQuery: vi.fn(async (query: any) => {
      const trigger = query.filter._and.find((item: any) => item.trigger)?.trigger._eq;
      const sorted = runs.filter((run) => run.trigger === trigger).sort((a, b) => b.date.localeCompare(a.date));

      return sorted.slice((query.page - 1) * query.limit, query.page * query.limit);
    })
  };
  const resultsService = { readByQuery: vi.fn(async () => results) };
  const directusContext = {
    getItemsService: vi.fn(async (collection: string) => {
      if (collection === "benchmark_runs") return runsService;
      if (collection === "benchmark_results") return resultsService;
      throw new Error(`Unexpected collection: ${collection}`);
    })
  };

  const service = await DITest.invoke(BenchmarksService, [{ token: DirectusContextService, use: directusContext }]);

  return { service, runsService, resultsService };
}

describe("BenchmarksService", () => {
  beforeEach(() => DITest.create());
  afterEach(() => DITest.reset());

  describe("comparedVersion()", () => {
    it("should accept the reference against one published version", () => {
      expect(comparedVersion({ baseline: "8.44.1", targets: "8.44.1,8.44.12" })).toBe("8.44.12");
    });

    it("should reject pull request runs, other baselines and runs of several targets", () => {
      expect(comparedVersion({ baseline: "local-base", targets: "local-base,local-head" })).toBeNull();
      expect(comparedVersion({ baseline: "8.44.1", targets: "8.44.1,local" })).toBeNull();
      expect(comparedVersion({ baseline: "8.40.0", targets: "8.40.0,8.44.12" })).toBeNull();
      expect(comparedVersion({ baseline: "8.44.1", targets: "8.44.1,8.44.5,8.44.12" })).toBeNull();
    });
  });

  describe("toBenchmarkComparison()", () => {
    it("should give the hello req/s of raw, reference and latest per platform", () => {
      const comparison = toBenchmarkComparison(baseRun, rows, "8.44.12");

      expect(comparison).toMatchObject({
        reference: "8.44.1",
        latest: "8.44.12",
        date: baseRun.date,
        environment: { pinned: true, cores: 4 }
      });
      expect(comparison.platforms.map((p) => p.platform)).toEqual(["express", "koa", "fastify"]);

      const express = comparison.platforms[0]!;
      const find = (target: string) => rows.find((r) => r.target === target && r.platform === "express" && r.route === "hello").rps;

      expect(express.hello).toEqual({ raw: find("raw"), reference: find("8.44.1"), latest: find("8.44.12") });
    });

    it("should give the routes with the gap of the latest version and the startup", () => {
      const fastify = toBenchmarkComparison(baseRun, rows, "8.44.12").platforms[2]!;
      const row = rows.find((r) => r.target === "8.44.12" && r.platform === "fastify" && r.route === "orders-list");
      const ordersList = fastify.routes.find((r) => r.route === "orders-list")!;

      expect(fastify.routes.map((r) => r.route)).toEqual(["hello", "users", "orders-create", "orders-list"]);
      expect(ordersList.latest).toEqual({ rps: row.rps, p99: row.p99, cpuPerRequest: row.cpu_per_request });
      expect(ordersList.gap.rps).toEqual({
        value: row.gap_rps,
        low: row.gap_rps_low,
        high: row.gap_rps_high,
        significant: row.gap_rps_significant
      });
      expect(fastify.startup.latest).toBeGreaterThan(0);
      expect(fastify.startup.gap).not.toBeNull();
    });
  });

  describe("getLatestComparison()", () => {
    it("should answer the latest release run before a newer manual run", async () => {
      const release = { ...baseRun, id: "release", trigger: "release", date: "2026-11-01T00:00:00Z" };
      const manual = { ...baseRun, id: "manual", trigger: "workflow_dispatch", date: "2026-11-02T00:00:00Z" };
      const { service, resultsService } = await createService([manual, release]);

      const comparison = await service.getLatestComparison();

      expect(comparison?.trigger).toBe("release");
      expect(resultsService.readByQuery).toHaveBeenCalledWith(expect.objectContaining({ filter: { run: { _eq: "release" } } }));
    });

    it("should fall back on a manual run of the reference against a release", async () => {
      const { service } = await createService([{ ...baseRun, trigger: "workflow_dispatch" }]);

      expect((await service.getLatestComparison())?.latest).toBe("8.44.12");
    });

    it("should only query successful runs of the reference, newest first", async () => {
      const { service, runsService } = await createService([]);

      await service.getLatestComparison();

      expect(runsService.readByQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { _and: [{ status: { _eq: "success" } }, { baseline: { _eq: "8.44.1" } }, { trigger: { _eq: "release" } }] },
          sort: ["-date"],
          page: 1
        })
      );
    });

    it("should find a release run older than more than a page of manual runs", async () => {
      const manuals = Array.from({ length: 60 }, (_, index) => ({
        ...baseRun,
        id: `manual-${index}`,
        trigger: "workflow_dispatch",
        date: `2026-12-${String((index % 28) + 1).padStart(2, "0")}T00:00:00Z`
      }));
      const release = { ...baseRun, id: "release", trigger: "release", date: "2026-11-01T00:00:00Z" };
      const { service } = await createService([...manuals, release]);

      expect((await service.getLatestComparison())?.trigger).toBe("release");
    });

    it("should page past runs of other target sets to find an older matching run", async () => {
      const unsupported = Array.from({ length: 60 }, (_, index) => ({
        ...baseRun,
        id: `local-${index}`,
        trigger: "workflow_dispatch",
        targets: "8.44.1,local",
        date: `2026-12-${String((index % 28) + 1).padStart(2, "0")}T00:00:00Z`
      }));
      const matching = { ...baseRun, id: "matching", trigger: "workflow_dispatch", date: "2026-11-01T00:00:00Z" };
      const { service, runsService, resultsService } = await createService([...unsupported, matching]);

      expect((await service.getLatestComparison())?.latest).toBe("8.44.12");
      expect(resultsService.readByQuery).toHaveBeenCalledWith(expect.objectContaining({ filter: { run: { _eq: "matching" } } }));
      expect(runsService.readByQuery).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
    });

    it("should answer null without a matching run", async () => {
      const { service, resultsService } = await createService([
        { ...baseRun, trigger: "workflow_dispatch", baseline: "8.44.1", targets: "8.44.1,local" }
      ]);

      expect(await service.getLatestComparison()).toBeNull();
      expect(resultsService.readByQuery).not.toHaveBeenCalled();
    });
  });
});
