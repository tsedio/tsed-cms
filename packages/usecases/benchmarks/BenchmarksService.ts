import { DirectusContextService } from "@tsed-cms/infra/directus/DirectusContextService.js";
import type { BenchmarkResult, BenchmarkRun } from "@tsed-cms/infra/directus/interfaces/DirectusSchema.d.js";
import { inject, injectable } from "@tsed/di";

/**
 * Ts.ED version before the performance work, compared with each release.
 * Keep it in sync with REFERENCE_VERSION of the Benchmark workflow in tsedio/tsed.
 */
export const REFERENCE_VERSION = "8.44.1";

const VERSION = /^\d+\.\d+\.\d+$/;
const RUNS_PAGE_SIZE = 50;
const ROUTES = ["hello", "users", "orders-create", "orders-list"] as const;
const PLATFORMS = ["express", "koa", "fastify"] as const;

export type Gap = { value: number; low: number | null; high: number | null; significant: boolean } | null;
export type RouteMetrics = { rps: number | null; p99: number | null; cpuPerRequest: number | null };

export interface BenchmarkComparison {
  date: string;
  reference: string;
  latest: string;
  trigger: string | null;
  title: string | null;
  runUrl: string | null;
  config: { rounds: number | null; duration: number | null; connections: number | null };
  environment: { node: string | null; cpu: string | null; cores: number | null; pinned: boolean };
  platforms: {
    platform: string;
    hello: { raw: number | null; reference: number | null; latest: number | null };
    routes: { route: string; reference: RouteMetrics; latest: RouteMetrics; gap: { rps: Gap; cpu: Gap } }[];
    startup: { reference: number | null; latest: number | null; gap: Gap };
  }[];
}

/**
 * Overall req/s gap of each published version against the reference, per platform (tsed.dev evolution chart).
 */
export interface BenchmarkHistory {
  reference: string;
  /** Routes the score is the geometric mean of */
  routes: string[];
  versions: {
    version: string;
    /** Date of the run the point comes from, null for the reference */
    date: string | null;
    trigger: string | null;
    runUrl: string | null;
    platforms: {
      platform: string;
      /** Geometric mean of the req/s ratios of `routes`, in %; null when a route was not measured */
      score: number | null;
      routes: { route: string; gap: Gap }[];
    }[];
  }[];
}

const RUN_FIELDS = [
  "id",
  "date",
  "title",
  "trigger",
  "run_url",
  "baseline",
  "targets",
  "rounds",
  "duration",
  "connections",
  "node",
  "cpu",
  "cores",
  "pinned"
];

const RESULT_FIELDS = [
  "target",
  "platform",
  "route",
  "rps",
  "p99",
  "cpu_per_request",
  "startup_ms",
  "gap_rps",
  "gap_rps_low",
  "gap_rps_high",
  "gap_rps_significant",
  "gap_cpu",
  "gap_cpu_low",
  "gap_cpu_high",
  "gap_cpu_significant",
  "gap_startup",
  "gap_startup_low",
  "gap_startup_high",
  "gap_startup_significant"
];

/**
 * The published version compared with the reference, when the run compares exactly the reference and one release.
 */
export function comparedVersion(run: Pick<BenchmarkRun, "baseline" | "targets">, reference = REFERENCE_VERSION) {
  const targets = (run.targets || "").split(",");

  if (run.baseline !== reference || targets.length !== 2 || targets[0] !== reference || !VERSION.test(targets[1]!)) {
    return null;
  }

  return targets[1]!;
}

const gap = (row: BenchmarkResult | undefined, id: "rps" | "cpu" | "startup"): Gap => {
  const value = row?.[`gap_${id}`];

  if (value === null || value === undefined) {
    return null;
  }

  return {
    value,
    low: row![`gap_${id}_low`] ?? null,
    high: row![`gap_${id}_high`] ?? null,
    significant: Boolean(row![`gap_${id}_significant`])
  };
};

const metrics = (row: BenchmarkResult | undefined): RouteMetrics => ({
  rps: row?.rps ?? null,
  p99: row?.p99 ?? null,
  cpuPerRequest: row?.cpu_per_request ?? null
});

/**
 * Reduces a run and its rows to what the tsed.dev benchmarks page shows.
 */
export function toBenchmarkComparison(run: BenchmarkRun, rows: BenchmarkResult[], latest: string): BenchmarkComparison {
  const reference = run.baseline!;
  const find = (target: string, platform: string, route: string) =>
    rows.find((row) => row.target === target && row.platform === platform && row.route === route);

  return {
    date: run.date,
    reference,
    latest,
    trigger: run.trigger ?? null,
    title: run.title ?? null,
    runUrl: run.run_url ?? null,
    config: { rounds: run.rounds ?? null, duration: run.duration ?? null, connections: run.connections ?? null },
    environment: { node: run.node ?? null, cpu: run.cpu ?? null, cores: run.cores ?? null, pinned: Boolean(run.pinned) },
    platforms: PLATFORMS.filter((platform) => rows.some((row) => row.platform === platform && row.target === latest)).map((platform) => {
      const latestStartup = find(latest, platform, "startup");

      return {
        platform,
        hello: {
          raw: find("raw", platform, "hello")?.rps ?? null,
          reference: find(reference, platform, "hello")?.rps ?? null,
          latest: find(latest, platform, "hello")?.rps ?? null
        },
        routes: ROUTES.filter((route) => find(latest, platform, route)).map((route) => {
          const row = find(latest, platform, route);

          return {
            route,
            reference: metrics(find(reference, platform, route)),
            latest: metrics(row),
            gap: { rps: gap(row, "rps"), cpu: gap(row, "cpu") }
          };
        }),
        startup: {
          reference: find(reference, platform, "startup")?.startup_ms ?? null,
          latest: latestStartup?.startup_ms ?? null,
          gap: gap(latestStartup, "startup")
        }
      };
    })
  };
}

const compareVersions = (a: string, b: string) => {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);

  return left[0]! - right[0]! || left[1]! - right[1]! || left[2]! - right[2]!;
};

/**
 * Published versions measured against the reference, each with the newest run that measured it.
 * Targets that are not versions (local, local-base, raw…) are skipped.
 */
export function selectHistoryRuns(runs: Pick<BenchmarkRun, "id" | "date" | "baseline" | "targets">[], reference = REFERENCE_VERSION) {
  const selected = new Map<string, (typeof runs)[number]>();

  for (const run of runs) {
    if (run.baseline !== reference) {
      continue;
    }

    for (const target of (run.targets || "").split(",")) {
      const current = selected.get(target);

      if (target !== reference && VERSION.test(target) && (!current || run.date > current.date)) {
        selected.set(target, run);
      }
    }
  }

  return selected;
}

/**
 * Geometric mean of the req/s ratios, in %. Null when a gap is missing, so every score covers the same routes.
 */
export function geometricMeanGap(gaps: Gap[]) {
  if (!gaps.length || gaps.some((gap) => !gap)) {
    return null;
  }

  const sum = gaps.reduce((total, gap) => total + Math.log(1 + gap!.value / 100), 0);

  return Math.round((Math.exp(sum / gaps.length) - 1) * 10000) / 100;
}

/**
 * Reduces the runs and their rows to the req/s gap of each published version against the reference, per platform.
 */
export function toBenchmarkHistory(runs: BenchmarkRun[], rows: BenchmarkResult[], reference = REFERENCE_VERSION): BenchmarkHistory {
  const selected = selectHistoryRuns(runs, reference);
  const runId = (row: BenchmarkResult) => (typeof row.run === "string" ? row.run : row.run.id);
  const versions = [...selected.keys()].sort(compareVersions);

  return {
    reference,
    routes: [...ROUTES],
    versions: [
      {
        version: reference,
        date: null,
        trigger: null,
        runUrl: null,
        platforms: PLATFORMS.map((platform) => ({ platform, score: 0, routes: ROUTES.map((route) => ({ route, gap: null })) }))
      },
      ...versions.map((version) => {
        const run = selected.get(version)! as BenchmarkRun;
        const own = rows.filter((row) => row.target === version && runId(row) === run.id);

        return {
          version,
          date: run.date,
          trigger: run.trigger ?? null,
          runUrl: run.run_url ?? null,
          platforms: PLATFORMS.filter((platform) => own.some((row) => row.platform === platform)).map((platform) => {
            const routes = ROUTES.map((route) => ({
              route,
              gap: gap(
                own.find((row) => row.platform === platform && row.route === route),
                "rps"
              )
            }));

            return { platform, score: geometricMeanGap(routes.map((route) => route.gap)), routes };
          })
        };
      })
    ]
  };
}

/**
 * Public, read-only benchmark data for tsed.dev: the latest release compared with the reference version.
 */
export class BenchmarksService {
  protected directusContext = inject(DirectusContextService);

  /**
   * Latest successful run comparing the reference with a published version: a release run first, else a manual one.
   * Pull request runs (local-base, local-head) never match.
   */
  async getLatestComparison(reference = REFERENCE_VERSION): Promise<BenchmarkComparison | null> {
    const run = (await this.findLatestRun("release", reference)) ?? (await this.findLatestRun("workflow_dispatch", reference));

    if (!run) {
      return null;
    }

    const resultsService = await this.directusContext.getItemsService<BenchmarkResult, string>("benchmark_results");
    const rows = (await resultsService.readByQuery({
      filter: { run: { _eq: run.id } },
      limit: -1,
      fields: RESULT_FIELDS
    })) as BenchmarkResult[];

    return toBenchmarkComparison(run, rows, comparedVersion(run, reference)!);
  }

  /**
   * Req/s gap of each published version against the reference, from the newest successful release or manual run
   * that measured it. Null when no version was measured yet.
   */
  async getHistory(reference = REFERENCE_VERSION): Promise<BenchmarkHistory | null> {
    const runsService = await this.directusContext.getItemsService<BenchmarkRun, string>("benchmark_runs");
    const runs: BenchmarkRun[] = [];

    for (let page = 1; ; page++) {
      const items = (await runsService.readByQuery({
        filter: {
          _and: [{ status: { _eq: "success" } }, { baseline: { _eq: reference } }, { trigger: { _in: ["release", "workflow_dispatch"] } }]
        },
        sort: ["-date"],
        limit: RUNS_PAGE_SIZE,
        page,
        fields: ["id", "date", "trigger", "run_url", "baseline", "targets"]
      })) as BenchmarkRun[];

      runs.push(...items);

      if (items.length < RUNS_PAGE_SIZE) {
        break;
      }
    }

    const ids = [...new Set([...selectHistoryRuns(runs, reference).values()].map((run) => run.id))];

    if (!ids.length) {
      return null;
    }

    const resultsService = await this.directusContext.getItemsService<BenchmarkResult, string>("benchmark_results");
    const rows = (await resultsService.readByQuery({
      filter: { _and: [{ run: { _in: ids } }, { route: { _in: [...ROUTES] } }] },
      limit: -1,
      fields: ["run", "target", "platform", "route", "gap_rps", "gap_rps_low", "gap_rps_high", "gap_rps_significant"]
    })) as BenchmarkResult[];

    return toBenchmarkHistory(runs, rows, reference);
  }

  /**
   * Newest successful run of a trigger that compares the reference with one published version.
   * Runs of other target sets (e.g. `8.44.1,local`) are skipped page by page, so they never hide an older matching run.
   */
  protected async findLatestRun(trigger: "release" | "workflow_dispatch", reference: string) {
    const runsService = await this.directusContext.getItemsService<BenchmarkRun, string>("benchmark_runs");

    for (let page = 1; ; page++) {
      const runs = (await runsService.readByQuery({
        filter: { _and: [{ status: { _eq: "success" } }, { baseline: { _eq: reference } }, { trigger: { _eq: trigger } }] },
        sort: ["-date"],
        limit: RUNS_PAGE_SIZE,
        page,
        fields: RUN_FIELDS
      })) as BenchmarkRun[];

      const run = runs.find((item) => comparedVersion(item, reference));

      if (run || runs.length < RUNS_PAGE_SIZE) {
        return run ?? null;
      }
    }
  }
}

injectable(BenchmarksService);
