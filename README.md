<p style="text-align: center" align="center">
 <a href="https://tsed.dev" target="_blank"><img src="https://tsed.dev/tsed-og.png" width="200" alt="Ts.ED logo"/></a>
</p>

<div align="center">
   <h1>CMS Ts.ED</h1>
   <hr />

[![PR Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/tsedio/tsed/blob/master/CONTRIBUTING.md)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![code style: oxfmt](https://img.shields.io/badge/code_style-oxfmt-ff69b4.svg?style=flat-square)](https://oxc.rs/docs/guide/usage/formatter)
[![github](https://img.shields.io/static/v1?label=Github%20sponsor&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86)](https://github.com/sponsors/romakita)
[![opencollective](https://img.shields.io/static/v1?label=OpenCollective%20sponsor&message=%E2%9D%A4&logo=OpenCollective&color=%23fe8e86)](https://opencollective.com/tsed)

</div>

<div align="center">
  <a href="https://tsed.dev/">Website</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://tsed.dev/getting-started/">Getting started</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://slack.tsed.dev">Slack</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://twitter.com/TsED_io">Twitter</a>
</div>

<hr />

A Directus CMS project deployed on [Render](https://render.com/) from its Dockerfile.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
  - [CI/CD (GitHub Actions)](#cicd-github-actions)
  - [Render Deployment](#render-deployment)
- [Project Structure](#project-structure)
- [TypeScript Migrations](#typescript-migrations)
- [Adding Collections with Proper Permissions](#adding-collections-with-proper-permissions)
- [Yarn Berry](#yarn-berry)
- [Contributing](#contributing)
  - [Git Hooks](#git-hooks)

## Overview

This project is a headless CMS built with [Directus](https://directus.io/), a modern, open-source data platform and API.
It provides a flexible and customizable backend for managing content and data.

## Prerequisites

- [Node.js](https://nodejs.org/) (v22 or higher)
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- [Git](https://git-scm.com/)

## Local Development

1. Clone the repository:

   ```bash
   git clone https://github.com/tsedio/tsed-cms.git
   cd digital-cms-api
   ```

2. Install dependencies using Yarn Berry:

   ```bash
   # Enable Yarn Berry (if not already enabled globally)
   corepack enable

   # Install dependencies
   yarn install
   ```

3. Start the development environment using Docker Compose:

   ```bash
   docker-compose up -d database
   yarn run bootstrap:dev
   yarn run snapshot:apply:dev
   yarn run migrate:dev
   yarn run start:dev
   ```

4. Access the Directus admin interface at [http://localhost:8055](http://localhost:8055)
   - Default admin credentials:
     - Email: admin@example.com
     - Password: admin

5. (Optional) Expose directus on https
   - brew install ngrok
   - ngrok config add-authtoken <AUTH-TOKEN>
   - ngrok http 8055

6. To stop the development environment:
   ```bash
   docker-compose down
   ```

## Environment Variables

The application uses [dotenv-flow](https://github.com/kerimdzhanov/dotenv-flow) to manage environment variables across
different environments. Environment files are located in the `config` directory:

- `.env` - Base environment variables (loaded in all environments)
- `.env.development` - Development-specific variables (loaded when NODE_ENV=development)
- `.env.production` - Production-specific variables (loaded when NODE_ENV=production)

This approach allows for environment-specific configuration while maintaining a common base configuration.

The following environment variables are required for the application to run:

### Database Configuration

- `DB_HOST`: PostgreSQL database host
- `DB_PORT`: PostgreSQL database port
- `DB_NAME`: PostgreSQL database name
- `DB_USER`: PostgreSQL database user
- `DB_PASSWORD`: PostgreSQL database password
- `DB_SSL`: Enable SSL for database connection (true/false)

### Admin User

- `ADMIN_EMAIL`: Email for the admin user
- `ADMIN_PASSWORD`: Password for the admin user

### Security

- `KEY`: Random string used for encryption
- `SECRET`: Random string used for JWT signing
- `PUBLIC_URL`: Public URL of the application

### CLI Configuration

- `SKIP_BOOTSTRAP`: When set to "true", skips the bootstrap process. This should be used once the instance is installed
  for the first time on the target environment.
- `UPDATE_CHECK`: When set to "false", disables the automatic update check for Directus. Useful in environments where
  you want to control updates manually.

## Deployment

### CI/CD (GitHub Actions)

The `CI` workflow runs `lint`, `test` and `build` on every push and pull request. On `main`, `alpha`, `beta` and
`rc`, the `release` job then creates a Git tag and a GitHub Release with `semantic-release` (`yarn release`).

On `main`, the `deploy` job then calls the `Deploy to Render` workflow (`.github/workflows/deploy-render.yml`), which
triggers the Render deploy hook on the current commit. To redeploy a release, run **Actions → Deploy to Render** (or
**CI**) with its tag as `version`.

### Render Deployment

The production service is a Render web service built from the repository `Dockerfile`. The container runs
`node cli.js bootstrap && node cli.js start` (see `docker/cli.js`).

Setup on Render and GitHub:

- Render → service → Settings → **Auto-Deploy: Off**: deploys are triggered by the CI only.
- Render → service → Settings → **Deploy Hook**: copy the URL into the `RENDER_DEPLOY_HOOK_URL` repository secret. The
  workflow appends `ref=<commit sha>` so Render builds exactly that commit.
- Environment variables are set on the Render service (examples): `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `KEY`, `SECRET`,
  `PUBLIC_URL`, `DB_*`, `STORAGE_*`. Optional: `SKIP_BOOTSTRAP=true` after the first successful bootstrap.
- To run scripts against production from your machine, put the production values in `config/.env.render-production`
  (git ignored) and use the `*:render:prod` scripts, e.g. `yarn export:data:render:prod`.

For CI runner details and local CI pipeline checks, see [TESTING.md](./TESTING.md).

## Project Structure

```
digital-cms-api/
├── .dockerignore         # Files to exclude from Docker builds
├── .gitignore            # Git ignore file
├── .husky/               # Git hooks configuration
├── .yarnrc.yml           # Yarn Berry configuration
├── .yarn/                # Yarn Berry files
├── Dockerfile            # Docker configuration for production
├── README.md             # Project documentation
├── commitlint.config.js  # Commitlint configuration
├── config/               # Configuration directory
│   ├── .env              # Base environment variables
│   ├── .env.development  # Development environment variables
│   └── .env.production   # Production environment variables
├── docker-compose.yml    # Docker Compose configuration for local development
├── extensions/           # Custom Directus extensions
│   ├── endpoints/        # Custom API endpoints
│   │   ├── health/       # Health check endpoint
│   │   └── version/      # Version information endpoint
│   ├── hooks/            # Custom event hooks
│   │   └── schema-sync/  # Schema synchronization hook
│   ├── interfaces/       # Custom input interfaces
│   ├── displays/         # Custom display interfaces
│   └── layouts/          # Custom layout interfaces
├── migrations/           # Database migration scripts
│   └── (migrations in TypeScript compiled to JS at build time)
├── vitest.config.ts      # Vitest test configuration
├── package.json          # Node.js dependencies and scripts
└── uploads/              # Uploaded files (local development)
```

## Exporting and Importing Data

Content can be moved between environments (e.g. Render production → local) with the export/import scripts.

### Layout

```text
exports/
  export-<domain>.ts            # one script per business domain (packages, repositories, sponsors...)
  export-all.ts                 # runs every export in order
  utils/export-collection.ts    # fetch + one-file-per-document writer
imports/
  <n>-import-<collection>.ts    # upsert one collection (by id)
  <n>-import-<domain>-data.ts   # bundle: runs collection imports in dependency order
  import-all.ts                 # runs every collection import in order
  data/<collection-kebab>/<slug>--<id>.json
```

Each data file holds a single document:

```json
{
  "collection": "packages",
  "items": [{ "id": "…", "name": "@tsed/core" }],
  "exportedAt": "2026-11-01T00:00:00.000Z",
  "options": { "includeRelatedCollections": false, "relatedCollectionDepth": 1 }
}
```

Relation tables (`packages_maintainers`, `repositories_maintainers`) are exported in their own directory and imported
after their parents. O2M aliases (e.g. `packages.maintainers`) are stripped before importing the parent. Their
auto-increment ids differ per environment, so links are matched on their foreign keys (`matchBy`) and created without
the source id.

### Exporting

```bash
yarn export:data:render:prod      # prompt: pick a script in exports/
yarn export:data:render:prod all  # run exports/export-all.ts without prompt
```

### Importing

```bash
yarn import:data:dev                          # prompt: all, data bundles, then collection imports
yarn import:data:dev 10-import-packages-data  # run one script without prompt
```

### Roles, permissions, flows, presets and dashboards

These system collections can also be synced between environments through the REST API:

| Export                        | Data (`imports/data/`)                                                           | Import                           |
| ----------------------------- | -------------------------------------------------------------------------------- | -------------------------------- |
| `export-roles-permissions.ts` | `directus-roles`, `directus-policies`, `directus-permissions`, `directus-access` | `12-import-roles-permissions.ts` |
| `export-flows.ts`             | `directus-flows` (one file per flow, operations embedded)                        | `13-import-flows.ts`             |
| `export-presets.ts`           | `directus-presets` (global presets only)                                         | `14-import-presets.ts`           |
| `export-dashboards.ts`        | `directus-dashboards` (one file per Insights dashboard, panels embedded)         | `16-import-dashboards.ts`        |

`15-import-system-data.ts` runs these imports. Notes:

- Only this project's data is exported (`exports/utils/project-scope.ts`), since a Directus database may hold data of
  other projects: permissions and presets of collections declared in `snapshots/snapshot-latest.yaml` (or `directus_*`),
  flows whose collections and operations belong to this repo, dashboards whose panels use project collections, and the roles/policies listed in `PROJECT_ROLES` /
  `PROJECT_POLICIES`. The same scope applies to `yarn export:system:collections`.
- The Administrator role and policy are not exported. The Administrator role and Public policy ids are written as
  `{{ID_ROLE_ADMINISTRATOR}}` / `{{ID_POLICY_PUBLIC}}` and resolved to the target ids on import.
- Permissions and presets have auto-increment ids, so they are matched on `policy + collection + action` and on
  `uuid` / `collection + bookmark`. Roles and policies are matched on id, then on name.
- Only role accesses are exported (user accesses depend on the environment users).
- Operations of an imported flow and panels of an imported dashboard that are not in the export are deleted. From the prompt, `13-import-flows` asks which
  flows to import.

### System collections (migration)

Roles, policies, permissions, accesses, presets, flows and operations are exported to `migrations/data` and installed by
the `*-update-all.ts` migration (renamed to today's date after each export):

```bash
yarn export:system:collections
```

It is also available as `system-collections` in `yarn export:data:dev`.

## TypeScript Migrations

This project supports writing database migrations in TypeScript, which provides better type safety and developer
experience compared to plain JavaScript.

### Creating TypeScript Migrations

To create a new TypeScript migration, use the following command:

```bash
yarn migrate:create [migration-name]
```

For example:

```bash
yarn rmigrate:create:ts create-products-table
```

This will:

1. Create a new TypeScript migration file in the `migrations` directory with a timestamp prefix
2. Compile the TypeScript file to JavaScript
3. Make the migration ready to run with the standard migration commands

### Writing TypeScript Migrations

TypeScript migrations use the same structure as JavaScript migrations but with type annotations:

```typescript
import { Knex } from "knex";

interface MyEntity {
  id: number;
  name: string;
  created_at: Date;
}

export default {
  async up(knex: Knex): Promise<void> {
    await knex.schema.createTable("my_entities", (table) => {
      table.increments("id").primary();
      table.string("name").notNullable();
      table.timestamp("created_at").defaultTo(knex.fn.now());
    });

    // With TypeScript, you can use typed inserts
    const entities: Partial<MyEntity>[] = [{ name: "Entity 1" }, { name: "Entity 2" }];

    await knex("my_entities").insert(entities);
  },

  async down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("my_entities");
  }
};
```

### Running Migrations

To run migrations (both JavaScript and TypeScript), use the standard migration commands:

```bash
# For development
yarn migrate:dev

# For production
yarn migrate
```

The system will automatically compile TypeScript migrations to JavaScript before running them.

### How It Works

The TypeScript migration system works by:

1. Storing migration files as `.ts` files in the `migrations` directory
2. Compiling them to `.js` files in the same directory using a specialized TypeScript configuration
3. Directus then runs the compiled `.js` files as normal migrations

This approach allows you to use TypeScript for better development experience while maintaining compatibility with
Directus's migration system.

## Adding Collections with Proper Permissions

This section describes the process for adding a new collection with the proper permissions using migration scripts.

### Steps to Add a New Collection

1. **Create the collection in the Directus interface**
   - Log in to the Directus admin interface
   - Navigate to Settings > Data Model
   - Click "Create Collection" and configure your new collection
   - Add the necessary fields to your collection

2. **Add permissions for the new collection to the Contributor policy**
   - Navigate to Settings > Access Policies
   - Select the "Contributor" policy
   - Find your newly created collection in the list
   - Configure the appropriate permissions (Create, Read, Update, Delete)

3. **Create a snapshot of the current schema**
   - Run the following command to create a snapshot:
     ```bash
     yarn snapshot:create
     ```
   - This will generate a snapshot file in the `snapshots` directory

4. **Export the permissions for the collections**
   - Run the following command to export the system collections:
     ```bash
     yarn export:system:collections
     ```
   - This will update the permissions files in the `migrations/data` directory

5. **Create a migration script**
   - Create a new migration script with a unique version number based on the existing script format (e.g.,
     `20250711A-update-collections.ts`)
   - Use the `20250710A-update-all.ts` script as a template
   - Ensure your script includes the necessary imports and functions to apply the permissions

### Example Migration Script

```typescript
import { Knex } from "knex";

import { installPermissions } from "./utils/installPermissions";

export async function up(knex: Knex): Promise<void> {
  // Install permissions for the new collection
  await installPermissions(knex);
}

export async function down(knex: Knex): Promise<void> {
  // No down migration needed as we don't want to remove permissions
  return;
}
```

After creating the migration script, run `yarn migrate:dev` to apply the changes to your development environment.

## Custom Extensions

Directus can be extended with custom functionality. This project includes sample extensions:

### Hello World Endpoint

A simple endpoint that returns a greeting message and timestamp.

- **URL**: `/hello-world`
- **Method**: GET
- **Response**:
  ```json
  {
    "message": "Hello World from CMS!",
    "timestamp": "2023-06-04T12:34:56.789Z"
  }
  ```

### Health Check Endpoint

An endpoint that provides basic health and status information about the application.

- **URL**: `/health`
- **Method**: GET
- **Response**:
  ```json
  {
    "status": "ok",
    "timestamp": "2023-06-04T12:34:56.789Z",
    "uptime": 3600,
    "memory": {
      "rss": 50000000,
      "heapTotal": 30000000,
      "heapUsed": 20000000,
      "external": 10000000,
      "arrayBuffers": 1000000
    },
    "version": "1.0.0"
  }
  ```

This endpoint is useful for:

- Monitoring the application's health
- Integration with health check services
- Debugging performance issues

### Version Endpoint

An endpoint that provides version information about the application.

- **URL**: `/version`
- **Method**: GET
- **Response**:
  ```json
  {
    "version": "1.0.0",
    "branch": "main"
  }
  ```

This endpoint returns:

- `version`: The version from package.json
- `branch`: The branch name from the release.info file (generated during deployment)

This endpoint is useful for:

- Identifying which version of the application is running
- Tracking deployments
- Debugging version-specific issues

### Creating Custom Extensions

To create a custom extension:

1. Create a new directory in the appropriate extensions subdirectory (endpoints, hooks, interfaces, displays, or
   layouts)
2. Create an `index.js` file with the extension code
3. Restart the Directus server to load the extension

For more information on creating extensions, see
the [Directus Extensions Documentation](https://docs.directus.io/extensions/introduction.html).

## Testing

The project includes a test suite using Vitest. To run the tests:

```bash
yarn test
```

To run tests in watch mode during development:

```bash
yarn test:watch
```

### Test Coverage

The test configuration is set up to collect coverage information. After running the tests, you can view the coverage
report in the `coverage` directory.

## Yarn Berry

This project uses [Yarn Berry](https://yarnpkg.com/features/pnp) (Yarn 3+) as its package manager. Yarn Berry offers
several advantages over npm and Yarn Classic:

- Faster installation times
- Better dependency resolution
- Improved caching
- Enhanced workspace support
- Better reproducibility

### Getting Started with Yarn Berry

1. Enable Corepack (if not already enabled):

   ```bash
   corepack enable
   ```

2. Install dependencies:

   ```bash
   yarn install
   ```

3. Add a new dependency:

   ```bash
   yarn add <package-name>
   ```

4. Add a new development dependency:

   ```bash
   yarn add -D <package-name>
   ```

5. Run a script from package.json:
   ```bash
   yarn <script-name>
   ```

### Yarn Berry Configuration

The project includes the following Yarn Berry configuration:

- `.yarnrc.yml`: Main configuration file for Yarn Berry
- `.yarn/releases`: Contains the Yarn Berry release binary
- `.yarn/plugins`: Contains Yarn plugins (if any)

For more information on Yarn Berry, see the [Yarn Documentation](https://yarnpkg.com/getting-started).

## Contributing

1. Create a new branch for your feature or bugfix
2. Make your changes
3. Write tests for your changes
4. Ensure all tests pass: `yarn test`
5. Ensure code quality with linting: `yarn test:lint`
6. Submit a merge request
7. Ensure the CI pipeline passes
8. Request a review from a team member

### Git Hooks

This project uses [Husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/okonet/lint-staged) to
enforce code quality checks before commits. When you commit changes, the following checks are automatically run:

- [oxlint](https://oxc.rs/docs/guide/usage/linter) will lint, and [oxfmt](https://oxc.rs/docs/guide/usage/formatter) will format, all staged JavaScript and TypeScript files
- oxfmt will format all staged JSON and YAML files
- Any fixable issues will be automatically corrected

Additionally, the project uses [commitlint](https://commitlint.js.org/) to enforce conventional commit message format.
This ensures that commit messages follow a standardized format, making it easier to generate changelogs and understand
the history of the project.

If any issues cannot be automatically fixed, the commit will be aborted, and you'll need to resolve the issues before
committing again.

To run the linting checks manually:

```bash
yarn lint-staged
```

To run oxlint and oxfmt on all files with automatic fixing:

```bash
yarn test:lint:fix
```

#### Commit Message Format

Commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Common types include:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: Code changes that neither fix a bug nor add a feature
- `test`: Adding or correcting tests
- `chore`: Changes to the build process or auxiliary tools
