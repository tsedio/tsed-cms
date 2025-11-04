# Project-Specific Development Guidelines (for Junie and advanced contributors)

This document captures practical, repo-specific knowledge to accelerate safe and effective development. For agent behavior and collaboration policies, AGENTS.md is the single source of truth. This file must remain consistent with AGENTS.md.

Quick facts
- Runtime: Node.js ≥ 22.16 (repo requires ≥ 22.0). Yarn Berry 4.9.2 (via Corepack). Workspace monorepo (Nx-managed) with `extensions/*` and `packages/*`.
- Core app: Directus 11.12, bootstrapped and extended via custom Directus extensions.
- Tests: Vitest 3.x, Node environment, workspace-wide patterns: `extensions/**/*.(test|spec).ts` and `packages/**/*.(test|spec).ts`.
- CI/CD: GitLab; see TESTING.md for local CI pipeline checks.

Build, configuration, and local runs
1) Install and toolchain
- Enable Corepack and pin Yarn to the repo version:
  - `corepack enable`
  - `yarn -v` should report `4.9.2`.
- Install deps using zero-change lockfile install:
  - `yarn install --immutable`

2) Environment management
- The project uses `dotenv-flow` with the `config/` directory. Typical script patterns wrap Directus or custom scripts with `yarn env`, `yarn env:dev`, or `yarn env:heroku` to load the right `.env.*` files from `config/`.
- Common scripts (package.json):
  - `env`, `env:dev`, `env:heroku`: Prepare env variables for subsequent commands.
  - `bootstrap`, `bootstrap:dev`: Initialize Directus with required configuration and built artifacts (dev builds migrations first).
  - `migrate`, `migrate:dev`: Compile migrations (`tsdown`) then apply with Directus.
  - `start:dev`: `migrate:dev` then concurrently run `watch:dev` (Nx dev builds) and start Directus with dev env.
  - `start:prod:all`: Bootstrap, migrate, then start in prod mode.
- Type generation:
  - `yarn build:cms:types` or `yarn generate` uses `directus-sdk-typegen`. Requires `CMS_API_URL` and `CMS_API_TOKEN` in env (usually via `config/.env.*`). Output: `packages/infra/directus/interfaces/DirectusSchema.d.ts` followed by a post-process script.

3) Build
- `yarn build` performs:
  - `yarn typecheck` (tsc noEmit)
  - `nx run-many --target=build --all`
  - `yarn build:migrations` (tsdown)
- For incremental local development:
  - `yarn build:dev:affected` builds only affected projects (used by `watch:dev`).

4) Running locally with Docker (optional)
- `docker-compose.yml` provides:
  - Service `digital-cms-api` (exposes 8055) and Postgres 17. The app image is built from `Dockerfile`; it copies compiled extensions and migrations into the Directus image.
  - Uploads mounted at `./uploads -> /directus/uploads`.
- Minimal flow:
  - `docker compose up --build` (or set `DOCKER_IMAGE_NAME`/`VERSION` as needed).
  - Directus is started via `docker/cli.js` in the image, running bootstrap and then start.

5) Running locally without Docker
- Ensure Postgres running and env variables are correctly defined under `config/`.
- Typical flow:
  - `yarn start:dev` to auto-build and run Directus with migration application (dev env).
  - Or run pieces manually: `yarn migrate:dev` then `yarn env:dev -- directus start`.

Testing guidelines (Vitest)
1) How tests are discovered
- `vitest.config.ts`:
  - `environment: "node"`
  - `include: ["extensions/**/*.(test|spec).ts", "packages/**/*.(test|spec).ts"]`
  - Coverage: `v8` with `text, lcov`, include `extensions/**/*.ts` (node_modules excluded).

2) Running tests
- `yarn test` — run once.
- `yarn test:watch` — watch mode.
- `yarn test:ci` — CI-friendly runner with JUnit report at `./reports/vitest/test-results.xml`.

3) Adding new tests
- Place tests alongside sources or within dedicated `__tests__` folders that match the include globs. Use `.spec.ts` or `.test.ts` extensions.
- Prefer lightweight, deterministic unit tests. For code depending on DI (`@tsed/di`) or Directus internals:
  - Use `DITest` from `@tsed/di` for service instantiation and to inject mocks (see `packages/usecases/releases/ReleasesService.spec.ts` for an in-repo example of `DITest.create`, `DITest.reset`, and mock injection via tokens).
  - Use `vi.fn()` for mocks/spies.
- Snapshot tips:
  - Inline snapshots are used in places (see ReleasesService tests). Keep them focused and update snapshots intentionally.

4) Demo test — verified locally
- To validate the setup, a temporary test was created and executed:
  - File (now removed): `packages/usecases/SmokeDemo.spec.ts`
  - Command executed: `yarn vitest run packages/usecases/SmokeDemo.spec.ts`
  - Outcome:
    - Test Files: 1 passed (1)
    - Tests: 1 passed (1)
- You can mirror this by creating a similar `.spec.ts` under `packages/*` or `extensions/*` and running it directly or via `yarn test`.

Additional development information
1) Code style and linting
- ESLint 9 with `@typescript-eslint` and Prettier integration. Simple import sort is enabled.
- Enforced via `yarn test:lint` and pre-commit with `lint-staged`:
  - `*.{js,ts,mjs,cjs,jsx,tsx}` -> `eslint --fix`
  - `*.{yml,yaml}` -> `prettier --write`

2) Monorepo and Nx
- Nx orchestrates builds for packages and extensions. Use `nx affected` to limit builds to changed projects.
- `nodemon` + `watch:dev` target rebuild changed projects during `start:dev`.

3) Migrations and schema snapshots
- Migrations are TypeScript compiled by `tsdown` into `migrations/dist`.
- Commands:
  - `yarn migrate` / `yarn migrate:dev` to build and apply migrations.
  - `yarn snapshot:create` to snapshot schema to `snapshots/snapshot-latest.yaml`.
  - `yarn snapshot:apply(:dev)` and `:diff` to manage drift.

4) Directus extensions
- Custom endpoints are defined under `extensions/*`. Example: `extensions/env-info/src/endpoint/index.ts` uses `wrapEndpoint` and `@tsed/di` `inject` to access services. Build output is copied into the runtime Directus container.

5) Release management
- Semantic-release with custom plugins (`cmflow`) is configured. Use `yarn release` (or `release:dry:run`) and follow the conventional commits rules (`@commitlint`).

6) Troubleshooting
- If Directus fails to start, verify env via `config/.env.*`, database connectivity, and run `yarn migrate:dev` to ensure schema is applied.
- Ensure Node and Yarn versions match the repo requirements to avoid install/build issues.
- For CI pipeline simulation and variables, see `TESTING.md`.

Agent interoperability
- This file is for project-specific instructions. For operational rules, escalation paths, and how agents should behave, see `AGENTS.md` (single source of truth). If guidance here appears to conflict with `AGENTS.md`, prefer `AGENTS.md` and then propose an update to this file to realign.


Dependency Injection (@tsed/di Functional API only)
- We exclusively use the Ts.ED DI Functional API across the repo. Do NOT use decorators or class annotations like `@Injectable`, `@Service`, or decorator-based `@Inject`. Always use the functional helpers: `injectable()`, `inject()`, and `DITest` for testing.
- Reference: https://tsed.dev/docs/providers.html

Service declaration (example from `packages/infra/http/HttpClient.ts`)
```ts
import { injectable } from "@tsed/di";

export class HttpClient {
  // ...implementation...
}

// Register the class with the Functional API (no decorators)
injectable(HttpClient);
```

Endpoint with injected service (example based on `extensions/env-info/src/endpoint/index.ts`)

```ts
import { wrapEndpoint } from "@tsed-cms/infra/bootstrap/directus.js";
import { GithubClient } from "@tsed-cms/infra/github/GithubClient.js";
import { defineEndpoint } from "@directus/extensions-sdk";
import { inject } from "@tsed/di";

export default defineEndpoint({
  id: "extension-id",
  handler: wrapEndpoint((router) => {
    router.post("/endpoint", async (req, res) => {
      // Resolve the service from the Ts.ED DI container
      const githubClient = inject(GithubClient);

      const repo = await githubClient.getRepo();
      
      return res.status(200).json(repo);
    });
  })
});
```

Testing and mocking with `DITest`:

```ts
import { DITest } from "@tsed/di";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { MyService } from "@tsed-cms/usecases/my/MyService.js";
import { DepClient } from "@tsed-cms/infra/dep/DepClient.js";

describe("MyService", () => {
  beforeEach(() => DITest.create({}));
  afterEach(() => DITest.reset());

  it("should work with mocked dependency", async () => {
    const depMock = {
      foo: vi.fn().mockResolvedValue("ok")
    } as unknown as Pick<DepClient, "foo">;

    // Instantiate service with token-based overrides
    const myService = await DITest.invoke(MyService, [
      {
        token: DepClient,
        use: depMock
      }
    ]);

    // ... assertions using myService ...
    expect(depMock.foo).toHaveBeenCalled();
  });
});
```

Practical tips
- Register each injectable class once with `injectable(Class)` in its module file to ensure the container knows about it.
- Prefer using the class itself as the token (e.g., `inject(Class)`), which keeps types and imports straightforward.
- Avoid decorator-based APIs to maintain consistency and to work seamlessly in ESM and non-Reflect metadata contexts.
- In endpoints, scripts, and other runtime code, call `inject(Token)` as late as possible (inside handlers) to avoid issues during module evaluation and to make testing easier.
- Applies repo-wide: both `packages/*` and `extensions/*` follow this Functional API pattern.

# Project-Specific Development Guidelines (for Junie and advanced contributors)

This document captures practical, repo-specific knowledge to accelerate safe and effective development. For agent behavior and collaboration policies, AGENTS.md is the single source of truth. This file must remain consistent with AGENTS.md.

Quick facts
- Runtime: Node.js ≥ 22.16 (repo requires ≥ 22.0). Yarn Berry 4.9.2 (via Corepack). Workspace monorepo (Nx-managed) with `extensions/*` and `packages/*`.
- Core app: Directus 11.12, bootstrapped and extended via custom Directus extensions.
- Tests: Vitest 3.x, Node environment, workspace-wide patterns: `extensions/**/*.(test|spec).ts` and `packages/**/*.(test|spec).ts`.
- CI/CD: GitLab; see TESTING.md for local CI pipeline checks.

Build, configuration, and local runs
1) Install and toolchain
- Enable Corepack and pin Yarn to the repo version:
  - `corepack enable`
  - `yarn -v` should report `4.9.2`.
- Install deps using zero-change lockfile install:
  - `yarn install --immutable`

2) Environment management
- The project uses `dotenv-flow` with the `config/` directory. Typical script patterns wrap Directus or custom scripts with `yarn env`, `yarn env:dev`, or `yarn env:heroku` to load the right `.env.*` files from `config/`.
- Common scripts (package.json):
  - `env`, `env:dev`, `env:heroku`: Prepare env variables for subsequent commands.
  - `bootstrap`, `bootstrap:dev`: Initialize Directus with required configuration and built artifacts (dev builds migrations first).
  - `migrate`, `migrate:dev`: Compile migrations (`tsdown`) then apply with Directus.
  - `start:dev`: `migrate:dev` then concurrently run `watch:dev` (Nx dev builds) and start Directus with dev env.
  - `start:prod:all`: Bootstrap, migrate, then start in prod mode.
- Type generation:
  - `yarn build:cms:types` or `yarn generate` uses `directus-sdk-typegen`. Requires `CMS_API_URL` and `CMS_API_TOKEN` in env (usually via `config/.env.*`). Output: `packages/infra/directus/interfaces/DirectusSchema.d.ts` followed by a post-process script.

3) Build
- `yarn build` performs:
  - `yarn typecheck` (tsc noEmit)
  - `nx run-many --target=build --all`
  - `yarn build:migrations` (tsdown)
- For incremental local development:
  - `yarn build:dev:affected` builds only affected projects (used by `watch:dev`).

4) Running locally with Docker (optional)
- `docker-compose.yml` provides:
  - Service `digital-cms-api` (exposes 8055) and Postgres 17. The app image is built from `Dockerfile`; it copies compiled extensions and migrations into the Directus image.
  - Uploads mounted at `./uploads -> /directus/uploads`.
- Minimal flow:
  - `docker compose up --build` (or set `DOCKER_IMAGE_NAME`/`VERSION` as needed).
  - Directus is started via `docker/cli.js` in the image, running bootstrap and then start.

5) Running locally without Docker
- Ensure Postgres running and env variables are correctly defined under `config/`.
- Typical flow:
  - `yarn start:dev` to auto-build and run Directus with migration application (dev env).
  - Or run pieces manually: `yarn migrate:dev` then `yarn env:dev -- directus start`.

Testing guidelines (Vitest)
1) How tests are discovered
- `vitest.config.ts`:
  - `environment: "node"`
  - `include: ["extensions/**/*.(test|spec).ts", "packages/**/*.(test|spec).ts"]`
  - Coverage: `v8` with `text, lcov`, include `extensions/**/*.ts` (node_modules excluded).

2) Running tests
- `yarn test` — run once.
- `yarn test:watch` — watch mode.
- `yarn test:ci` — CI-friendly runner with JUnit report at `./reports/vitest/test-results.xml`.

3) Adding new tests
- Place tests alongside sources or within dedicated `__tests__` folders that match the include globs. Use `.spec.ts` or `.test.ts` extensions.
- Prefer lightweight, deterministic unit tests. For code depending on DI (`@tsed/di`) or Directus internals:
  - Use `DITest` from `@tsed/di` for service instantiation and to inject mocks (see `packages/usecases/releases/ReleasesService.spec.ts` for an in-repo example of `DITest.create`, `DITest.reset`, and mock injection via tokens).
  - Use `vi.fn()` for mocks/spies.
- Snapshot tips:
  - Inline snapshots are used in places (see ReleasesService tests). Keep them focused and update snapshots intentionally.

4) Demo test — verified locally
- To validate the setup, a temporary test was created and executed:
  - File (now removed): `packages/usecases/SmokeDemo.spec.ts`
  - Command executed: `yarn vitest run packages/usecases/SmokeDemo.spec.ts`
  - Outcome:
    - Test Files: 1 passed (1)
    - Tests: 1 passed (1)
- You can mirror this by creating a similar `.spec.ts` under `packages/*` or `extensions/*` and running it directly or via `yarn test`.

Additional development information
1) Code style and linting
- ESLint 9 with `@typescript-eslint` and Prettier integration. Simple import sort is enabled.
- Enforced via `yarn test:lint` and pre-commit with `lint-staged`:
  - `*.{js,ts,mjs,cjs,jsx,tsx}` -> `eslint --fix`
  - `*.{yml,yaml}` -> `prettier --write`

2) Monorepo and Nx
- Nx orchestrates builds for packages and extensions. Use `nx affected` to limit builds to changed projects.
- `nodemon` + `watch:dev` target rebuild changed projects during `start:dev`.

3) Migrations and schema snapshots
- Migrations are TypeScript compiled by `tsdown` into `migrations/dist`.
- Commands:
  - `yarn migrate` / `yarn migrate:dev` to build and apply migrations.
  - `yarn snapshot:create` to snapshot schema to `snapshots/snapshot-latest.yaml`.
  - `yarn snapshot:apply(:dev)` and `:diff` to manage drift.

4) Directus extensions
- Custom endpoints are defined under `extensions/*`. Example: `extensions/env-info/src/endpoint/index.ts` uses `wrapEndpoint` and `@tsed/di` `inject` to access services. Build output is copied into the runtime Directus container.

5) Release management
- Semantic-release with custom plugins (`cmflow`) is configured. Use `yarn release` (or `release:dry:run`) and follow the conventional commits rules (`@commitlint`).

6) Troubleshooting
- If Directus fails to start, verify env via `config/.env.*`, database connectivity, and run `yarn migrate:dev` to ensure schema is applied.
- Ensure Node and Yarn versions match the repo requirements to avoid install/build issues.
- For CI pipeline simulation and variables, see `TESTING.md`.

Agent interoperability
- This file is for project-specific instructions. For operational rules, escalation paths, and how agents should behave, see `AGENTS.md` (single source of truth). If guidance here appears to conflict with `AGENTS.md`, prefer `AGENTS.md` and then propose an update to this file to realign.


Dependency Injection (@tsed/di Functional API only)
- We exclusively use the Ts.ED DI Functional API across the repo. Do NOT use decorators or class annotations like `@Injectable`, `@Service`, or decorator-based `@Inject`. Always use the functional helpers: `injectable()`, `inject()`, and `DITest` for testing.
- Reference: https://tsed.dev/docs/providers.html

Service declaration (example from `packages/infra/http/HttpClient.ts`)
```ts
import { injectable } from "@tsed/di";

export class HttpClient {
  // ...implementation...
}

// Register the class with the Functional API (no decorators)
injectable(HttpClient);
```

Endpoint with injected service (example based on `extensions/env-info/src/endpoint/index.ts`)

```ts
import { wrapEndpoint } from "@tsed-cms/infra/bootstrap/directus.js";
import { GithubClient } from "@tsed-cms/infra/github/GithubClient.js";
import { defineEndpoint } from "@directus/extensions-sdk";
import { inject } from "@tsed/di";

export default defineEndpoint({
  id: "extension-id",
  handler: wrapEndpoint((router) => {
    router.post("/endpoint", async (req, res) => {
      // Resolve the service from the Ts.ED DI container
      const githubClient = inject(GithubClient);

      const repo = await githubClient.getRepo();
      
      return res.status(200).json(repo);
    });
  })
});
```

Testing and mocking with `DITest`:

```ts
import { DITest } from "@tsed/di";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { MyService } from "@tsed-cms/usecases/my/MyService.js";
import { DepClient } from "@tsed-cms/infra/dep/DepClient.js";

describe("MyService", () => {
  beforeEach(() => DITest.create({}));
  afterEach(() => DITest.reset());

  it("should work with mocked dependency", async () => {
    const depMock = {
      foo: vi.fn().mockResolvedValue("ok")
    } as unknown as Pick<DepClient, "foo">;

    // Instantiate service with token-based overrides
    const myService = await DITest.invoke(MyService, [
      {
        token: DepClient,
        use: depMock
      }
    ]);

    // ... assertions using myService ...
    expect(depMock.foo).toHaveBeenCalled();
  });
});
```

Practical tips
- Register each injectable class once with `injectable(Class)` in its module file to ensure the container knows about it.
- Prefer using the class itself as the token (e.g., `inject(Class)`), which keeps types and imports straightforward.
- Avoid decorator-based APIs to maintain consistency and to work seamlessly in ESM and non-Reflect metadata contexts.
- In endpoints, scripts, and other runtime code, call `inject(Token)` as late as possible (inside handlers) to avoid issues during module evaluation and to make testing easier.
- Applies repo-wide: both `packages/*` and `extensions/*` follow this Functional API pattern.

Types and models
- In `@tsed-cms/usecases`, use DirectusSchema types wherever possible. Import models from `packages/infra/directus/interfaces/DirectusSchema.d.ts` (ESM path `.d.js` in imports) instead of ad-hoc DTOs. This ensures strong typing aligned with the CMS schema and reduces drift between code and Directus. When adding or refactoring services, prefer `Maintainer`, `Repository`, etc., from the generated schema over custom interfaces.


## Preferred DI testing pattern (MANDATORY)

When writing unit tests for services that depend on `@tsed/di` or Directus internals, always prefer instantiating the unit under test via `DITest.invoke` with per-test token overrides for mocked dependencies.

- Do: `DITest.create()` → `DITest.invoke(Service, [{ token: Dep, use: mock }])`
- Do: Mock `DirectusContextService.getItemsService` per test via a small `createFixture()` helper
- Avoid: `DITest.injector.addProvider(...)`, `registerProvider(...)`, or global container mutations that leak between tests

Example — using a per-test fixture with `DITest.invoke`:

```ts
import { DITest } from "@tsed/di";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { DirectusContextService } from "@tsed-cms/infra/directus/DirectusContextService.js";
import { PackagesService } from "@tsed-cms/usecases/packages/PackagesService.js";

function createItemsServiceMock(initial: any[] = []) {
  const state = { rows: [...initial], lastId: 0 };
  return {
    readByQuery: vi.fn(async (query?: any) => {
      if (query?.filter?.name?._eq !== undefined) {
        const found = state.rows.filter((r) => r.name === query.filter.name._eq);
        return found.slice(0, query.limit ?? 1);
      }
      if (!query || query.limit === -1) return state.rows;
      return [];
    }),
    readOne: vi.fn(async (id: any) => state.rows.find((r) => r.id === id) ?? null),
    updateOne: vi.fn(async (id: any, data: any) => {
      const idx = state.rows.findIndex((r) => r.id === id);
      if (idx > -1) state.rows[idx] = { ...state.rows[idx], ...data };
      return id;
    }),
    createOne: vi.fn(async (data: any) => {
      const id = data.id ?? `id_${++state.lastId}`;
      state.rows.push({ ...data, id });
      return id;
    })
  };
}

async function createFixture(itemsMock: any) {
  const directusContextService = {
    getItemsService: vi.fn(async (collection: string) => {
      if (collection === "packages") return itemsMock;
      throw new Error("Unexpected collection: " + collection);
    })
  };

  const service = await DITest.invoke(PackagesService, [
    { token: DirectusContextService, use: directusContextService }
  ]);

  return { service, directusContextService };
}

describe("PackagesService", () => {
  beforeEach(() => DITest.create({ cache: false }));
  afterEach(() => DITest.reset());

  it("findByName returns the package when found", async () => {
    const items = createItemsServiceMock([{ id: "p1", name: "pkg" }]);
    const { service } = await createFixture(items);
    const res = await service.findByName("pkg");
    expect(res?.id).toBe("p1");
  });
});
```

Anti-patterns to avoid:
- `DITest.injector.addProvider(...)` and `registerProvider(...)` — these mutate the container globally and make tests brittle.
- Resolving dependencies at module top-level in tests. Prefer late resolution within test blocks and fixtures to keep isolation.

Rationale:
- `DITest.invoke` mirrors how Ts.ED resolves dependencies at runtime while keeping tests hermetic.
- Per-test overrides make mocks explicit, readable, and prevent state leakage between cases.
