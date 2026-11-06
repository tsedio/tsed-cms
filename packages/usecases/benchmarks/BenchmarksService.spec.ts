import { DirectusContextService } from "@tsed-cms/infra/directus/DirectusContextService.js";
import { DITest } from "@tsed/di";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import historyFixture from "./__fixtures__/benchmark-history.json" with { type: "json" };
import fixture from "./__fixtures__/benchmark-run.json" with { type: "json" };
import { BenchmarksService, comparedVersion, geometricMeanGap, toBenchmarkComparison, toBenchmarkHistory } from "./BenchmarksService.js";

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

// Real CI runs: a manual run of 8.44.1 → 8.44.13 and the release run of 8.45.2, both against 8.44.1
const [manualRun, releaseRun] = historyFixture.runs as any[];
const historyRows = historyFixture.rows as any[];

const gapOf = (value: number) => ({ value, low: null, high: null, significant: true });

async function createHistoryService(runs: any[], results: any[] = historyRows) {
  // applies the status, baseline and trigger filters, the date sort and the pagination of the service query
  const runsService = {
    readByQuery: vi.fn(async (query: any) => {
      const [status, baseline, trigger] = query.filter._and;
      const sorted = runs
        .filter(
          (run) => run.status === status.status._eq && run.baseline === baseline.baseline._eq && trigger.trigger._in.includes(run.trigger)
        )
        .sort((a, b) => b.date.localeCompare(a.date));

      return sorted.slice((query.page - 1) * query.limit, query.page * query.limit);
    })
  };
  const resultsService = {
    readByQuery: vi.fn(async (query: any) => results.filter((row) => query.filter._and[0].run._in.includes(row.run)))
  };
  const directusContext = {
    getItemsService: vi.fn(async (collection: string) => (collection === "benchmark_runs" ? runsService : resultsService))
  };

  const service = await DITest.invoke(BenchmarksService, [{ token: DirectusContextService, use: directusContext }]);

  return { service, runsService, resultsService };
}

describe("BenchmarksService history", () => {
  beforeEach(() => DITest.create());
  afterEach(() => DITest.reset());

  describe("geometricMeanGap()", () => {
    it("should give the geometric mean of the req/s ratios in %", () => {
      // (1.032 × 1.164 × 1.270 × 1.871)^(1/4) − 1
      expect(geometricMeanGap([gapOf(3.2), gapOf(16.4), gapOf(27), gapOf(87.1)])).toBe(29.98);
      expect(geometricMeanGap([gapOf(-50), gapOf(100)])).toBe(0);
    });

    it("should answer null when a gap is missing", () => {
      expect(geometricMeanGap([gapOf(10), null])).toBeNull();
      expect(geometricMeanGap([])).toBeNull();
    });
  });

  describe("toBenchmarkHistory()", () => {
    it("should combine the manual run and the release run, reference first then in semver order", () => {
      const history = toBenchmarkHistory([releaseRun, manualRun], historyRows);

      expect(history.reference).toBe("8.44.1");
      expect(history.routes).toEqual(["hello", "users", "orders-create", "orders-list"]);
      expect(history.versions.map((item) => item.version)).toEqual([
        "8.44.1",
        "8.44.2",
        "8.44.3",
        "8.44.4",
        "8.44.5",
        "8.44.6",
        "8.44.7",
        "8.44.8",
        "8.44.9",
        "8.44.10",
        "8.44.11",
        "8.44.12",
        "8.44.13",
        "8.45.2"
      ]);
      expect(history.versions[1]).toMatchObject({ date: manualRun.date, trigger: "workflow_dispatch", runUrl: manualRun.run_url });
      expect(history.versions.at(-1)).toMatchObject({ date: releaseRun.date, trigger: "release", runUrl: releaseRun.run_url });
    });

    it("should give the reference a score of 0 on every platform", () => {
      const [reference] = toBenchmarkHistory([manualRun], historyRows).versions;

      expect(reference).toMatchObject({ version: "8.44.1", date: null });
      expect(reference!.platforms.map((item) => [item.platform, item.score])).toEqual([
        ["express", 0],
        ["koa", 0],
        ["fastify", 0]
      ]);
    });

    it("should score each platform with the geometric mean of its four route gaps", () => {
      const latest = toBenchmarkHistory([manualRun, releaseRun], historyRows).versions.at(-1)!;
      const express = latest.platforms.find((item) => item.platform === "express")!;
      const gaps = historyRows.filter((row) => row.run === releaseRun.id && row.platform === "express").map((row) => gapOf(row.gap_rps));

      expect(express.routes.map((item) => item.route)).toEqual(["hello", "users", "orders-create", "orders-list"]);
      expect(express.routes[3]!.gap).toMatchObject({ value: 84.69, significant: true });
      expect(express.score).toBe(geometricMeanGap(gaps));
      expect(express.score).toBeGreaterThan(20);
    });

    it("should take the newest run when several runs measured the same version", () => {
      const newer = { ...manualRun, id: "newer", date: "2026-11-10T00:00:00Z", targets: "8.44.1,8.44.13" };
      const rows = [
        ...historyRows,
        ...["hello", "users", "orders-create", "orders-list"].map((route) => ({
          run: "newer",
          target: "8.44.13",
          platform: "koa",
          route,
          gap_rps: 10,
          gap_rps_significant: true
        }))
      ];

      const version = toBenchmarkHistory([manualRun, newer, releaseRun], rows).versions.find((item) => item.version === "8.44.13")!;

      expect(version.date).toBe(newer.date);
      expect(version.platforms.map((item) => [item.platform, item.score])).toEqual([["koa", 10]]);
    });

    it("should give a null score but keep the other gaps when a route is missing", () => {
      const rows = historyRows.filter((row) => !(row.target === "8.44.5" && row.platform === "koa" && row.route === "orders-create"));

      const koa = toBenchmarkHistory([manualRun], rows)
        .versions.find((item) => item.version === "8.44.5")!
        .platforms.find((item) => item.platform === "koa")!;

      expect(koa.score).toBeNull();
      expect(koa.routes.find((item) => item.route === "orders-create")!.gap).toBeNull();
      expect(koa.routes.find((item) => item.route === "orders-list")!.gap).not.toBeNull();
    });

    it("should ignore targets that are not published versions and runs of another baseline", () => {
      const local = { ...manualRun, id: "local", date: "2026-11-20T00:00:00Z", targets: "8.44.1,local,local-head" };
      const other = { ...manualRun, id: "other", date: "2026-11-20T00:00:00Z", baseline: "8.40.0", targets: "8.40.0,8.46.0" };

      const versions = toBenchmarkHistory([manualRun, local, other], historyRows).versions.map((item) => item.version);

      expect(versions).not.toContain("local");
      expect(versions).not.toContain("local-head");
      expect(versions).not.toContain("8.46.0");
      expect(versions).toHaveLength(13);
    });
  });

  describe("getHistory()", () => {
    it("should query successful release and manual runs of the reference, and the rows of the selected runs", async () => {
      const { service, runsService, resultsService } = await createHistoryService([manualRun, releaseRun]);

      const history = await service.getHistory();

      expect(history?.versions).toHaveLength(14);
      expect(runsService.readByQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: {
            _and: [{ status: { _eq: "success" } }, { baseline: { _eq: "8.44.1" } }, { trigger: { _in: ["release", "workflow_dispatch"] } }]
          },
          sort: ["-date"],
          page: 1
        })
      );
      expect(resultsService.readByQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: {
            _and: [
              { run: { _in: expect.arrayContaining([manualRun.id, releaseRun.id]) } },
              { route: { _in: ["hello", "users", "orders-create", "orders-list"] } }
            ]
          },
          limit: -1
        })
      );
    });

    it("should ignore pull request and failed runs", async () => {
      const pullRequest = { ...releaseRun, id: "pr", trigger: "pull_request", targets: "8.44.1,8.46.0" };
      const failed = { ...releaseRun, id: "failed", status: "failed", targets: "8.44.1,8.46.0" };
      const { service } = await createHistoryService([manualRun, pullRequest, failed]);

      const versions = (await service.getHistory())!.versions.map((item) => item.version);

      expect(versions).not.toContain("8.46.0");
      expect(versions.at(-1)).toBe("8.44.13");
    });

    it("should read every page of runs", async () => {
      const locals = Array.from({ length: 60 }, (_, index) => ({
        ...manualRun,
        id: `local-${index}`,
        targets: "8.44.1,local",
        date: `2026-12-${String((index % 28) + 1).padStart(2, "0")}T00:00:00Z`
      }));
      const { service, runsService } = await createHistoryService([...locals, releaseRun]);

      expect((await service.getHistory())?.versions.map((item) => item.version)).toEqual(["8.44.1", "8.45.2"]);
      expect(runsService.readByQuery).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
    });

    it("should answer null when no version was measured", async () => {
      const { service, resultsService } = await createHistoryService([{ ...manualRun, targets: "8.44.1,local" }]);

      expect(await service.getHistory()).toBeNull();
      expect(resultsService.readByQuery).not.toHaveBeenCalled();
    });
  });
});
