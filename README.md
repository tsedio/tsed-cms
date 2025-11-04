# CMS Ts.ED

A Directus CMS project that can be deployed to Heroku via GitLab CI/CD.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
  - [GitLab CI/CD](#gitlab-cicd)
  - [Heroku Deployment](#heroku-deployment)
- [Project Structure](#project-structure)
- [Language Support](#language-support)
- [TypeScript Migrations](#typescript-migrations)
- [Adding Collections with Proper Permissions](#adding-collections-with-proper-permissions)
- [Yarn Berry](#yarn-berry)
- [Contributing](#contributing)
  - [Git Hooks](#git-hooks)

## Overview

This project is a headless CMS built with [Directus](https://directus.io/), a modern, open-source data platform and API. It provides a flexible and customizable backend for managing content and data.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- [Git](https://git-scm.com/)
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) (for deployment)

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
   yarn run migrate:dev  # This will install languages in the Directus database
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

The application uses [dotenv-flow](https://github.com/kerimdzhanov/dotenv-flow) to manage environment variables across different environments. Environment files are located in the `config` directory:

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
- `DIRECTUS_KEY`: Random string used for encryption
- `DIRECTUS_SECRET`: Random string used for JWT signing
- `PUBLIC_URL`: Public URL of the application

### CLI Configuration
- `SKIP_BOOTSTRAP`: When set to "true", skips the bootstrap process. This should be used once the instance is installed for the first time on the target environment.
- `UPDATE_CHECK`: When set to "false", disables the automatic update check for Directus. Useful in environments where you want to control updates manually.

## Deployment

### GitLab CI/CD

This project is configured to use GitLab CI/CD for automated testing, building, and deployment. The pipeline is defined in `.gitlab-ci.yml` and consists of the following stages:

1. **Test**: Runs linting and tests to ensure code quality
2. **Release**: Creates a release when building from the main branch
3. **Deploy**: Deploys the application to the specified environment
4. **Notification**: Sends notifications about the deployment status

The CI/CD pipeline supports different workflows:

- **build**: Run tests and build the application
- **deploy**: Deploy the application to the specified environment
- **rebase**: Rebase and deploy
- **rebase-all**: Republish all content

To use GitLab CI/CD, you need to set the following environment variables in your GitLab project settings:

- `HEROKU_API_KEY`: Your Heroku API key
- `HEROKU_APP_NAME`: The name of your Heroku application
- `TEAMS_WEBHOOK`: (Optional) Microsoft Teams webhook URL for notifications

For detailed instructions on testing the CI/CD configuration locally, see [TESTING.md](TESTING.md).

### Heroku Deployment

The application is configured for deployment to Heroku using container registry. There are multiple ways to deploy:

#### One-Click Deployment

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

Click the button above to deploy the application to Heroku with a single click. This will:
- Create a new Heroku app
- Add a PostgreSQL database
- Set up the required environment variables
- Deploy the application

#### Using Heroku Container Registry

To manually deploy using Heroku Container Registry:

1. Log in to Heroku Container Registry:
   ```bash
   heroku container:login
   ```

2. Create a Heroku app (if not already created):
   ```bash
   heroku create your-app-name
   ```

3. Add a PostgreSQL database:
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev --app your-app-name
   ```

4. Set the required environment variables:
   ```bash
   heroku config:set \
     ADMIN_EMAIL=admin@example.com \
     ADMIN_PASSWORD=secure_password \
     KEY=random_string \
     SECRET=another_random_string \
     PUBLIC_URL=https://your-app-name.herokuapp.com \
     --app your-app-name
   ```

5. Push the container to Heroku:
   ```bash
   heroku container:push web --app your-app-name
   ```

6. Release the container:
   ```bash
   heroku container:release web --app your-app-name
   ```

#### Using GitLab CI/CD

The application is also configured for automatic deployment to Heroku via GitLab CI/CD. See the [GitLab CI/CD](#gitlab-cicd) section for more information.

## Project Structure

```
digital-cms-api/
├── .dockerignore         # Files to exclude from Docker builds
├── .gitignore            # Git ignore file
├── .gitlab-ci.yml        # GitLab CI/CD configuration
├── .husky/               # Git hooks configuration
├── .yarnrc.yml           # Yarn Berry configuration
├── .yarn/                # Yarn Berry files
├── Dockerfile            # Docker configuration for production
├── Procfile              # Heroku process file
├── README.md             # Project documentation
├── app.json              # Heroku app configuration for one-click deployment
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
├── heroku.yml            # Heroku container deployment configuration
├── migrations/           # Database migration scripts
│   └── 20240101000000_install_languages.js  # Script to install languages
├── vitest.config.ts      # Vitest test configuration
├── package.json          # Node.js dependencies and scripts
└── uploads/              # Uploaded files (local development)
```

## Language Support

The CMS includes built-in support for multiple languages. During initialization (when running `yarn migrate:dev` or `yarn migrate`), the following languages are automatically installed in the Directus database:

- English (US) - `en-US`
- French (France) - `fr-FR`
- Spanish (Spain) - `es-ES`
- German (Germany) - `de-DE`
- Italian (Italy) - `it-IT`
- Portuguese (Brazil) - `pt-BR`
- Chinese (Simplified) - `zh-CN`
- Japanese (Japan) - `ja-JP`
- Arabic (Saudi Arabia) - `ar-SA`

### Customizing Languages

To customize the list of installed languages, you can modify the `migrations/20240101000000_install_languages.js` file. This file contains an array of language objects, each with the following properties:

- `code`: The language code (e.g., 'en-US')
- `name`: The display name of the language
- `direction`: The text direction ('ltr' for left-to-right, 'rtl' for right-to-left)

After modifying the file, run `yarn migrate:dev` to apply the changes.

### Verifying Language Installation

To verify that languages are properly installed in the Directus database, you can run:

```bash
yarn test:languages
```

This command will:
1. Connect to the database
2. Check if the directus_languages table exists
3. Retrieve all installed languages
4. Display them in a table format
5. Verify that the default language (en-US) is installed

This is useful for troubleshooting language-related issues or confirming that your customizations have been applied correctly.

## Roles and Permissions Management

The CMS includes support for exporting and importing Directus roles and permissions. This allows you to:

1. Back up your existing roles and permissions configuration
2. Transfer roles and permissions between environments
3. Version control your access control settings

### Exporting Roles and Permissions

To export all roles and permissions from the Directus database, run:

```bash
yarn export:roles-permissions
```

This command will:
1. Connect to the database
2. Check if the directus_roles and directus_permissions tables exist
3. Retrieve all roles and permissions
4. Save them to JSON files in the migrations/data directory:
   - `migrations/data/directus_roles.json`
   - `migrations/data/directus_permissions.json`
5. After that, go to migrations directory and change the `20***A-update-all.ts` by updating the date and version number. For example, if the current date is 20250711, the new file name should be `20250711A-update-all.ts`.

### Importing Roles and Permissions

During initialization (when running `yarn migrate:dev` or `yarn migrate`), the exported roles and permissions are automatically installed in the Directus database if they don't already exist.

This ensures that your roles and permissions configuration is consistent across environments and can be version controlled alongside your code.

## TypeScript Migrations

This project supports writing database migrations in TypeScript, which provides better type safety and developer experience compared to plain JavaScript.

### Creating TypeScript Migrations

To create a new TypeScript migration, use the following command:

```bash
yarn rmigrate:create:ts [migration-name]
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
import { Knex } from 'knex';

interface MyEntity {
  id: number;
  name: string;
  created_at: Date;
}

export default {
  async up(knex: Knex): Promise<void> {
    await knex.schema.createTable('my_entities', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });

    // With TypeScript, you can use typed inserts
    const entities: Partial<MyEntity>[] = [
      { name: 'Entity 1' },
      { name: 'Entity 2' }
    ];

    await knex('my_entities').insert(entities);
  },

  async down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('my_entities');
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

This approach allows you to use TypeScript for better development experience while maintaining compatibility with Directus's migration system.

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
   - Create a new migration script with a unique version number based on the existing script format (e.g., `20250711A-update-collections.ts`)
   - Use the `20250710A-update-all.ts` script as a template
   - Ensure your script includes the necessary imports and functions to apply the permissions

### Example Migration Script

```typescript
import { Knex } from 'knex';
import { installPermissions } from './utils/installPermissions';

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

### Schema Sync Hook

A hook that automatically creates a basic content model when the application starts. The schema includes:

#### Collections
- **Articles**: For blog posts and news articles
- **Categories**: For categorizing articles

#### Fields
- **Articles**:
  - id (primary key)
  - status (published, draft, archived)
  - title
  - slug
  - content (rich text)
  - featured_image
  - category (relation to Categories)
  - publish_date
  - sort (for ordering)

- **Categories**:
  - id (primary key)
  - name
  - slug
  - sort (for ordering)

#### Relationships
- Articles belong to Categories (many-to-one)

### Creating Custom Extensions

To create a custom extension:

1. Create a new directory in the appropriate extensions subdirectory (endpoints, hooks, interfaces, displays, or layouts)
2. Create an `index.js` file with the extension code
3. Restart the Directus server to load the extension

For more information on creating extensions, see the [Directus Extensions Documentation](https://docs.directus.io/extensions/introduction.html).

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

The test configuration is set up to collect coverage information. After running the tests, you can view the coverage report in the `coverage` directory.

## Yarn Berry

This project uses [Yarn Berry](https://yarnpkg.com/features/pnp) (Yarn 3+) as its package manager. Yarn Berry offers several advantages over npm and Yarn Classic:

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

This project uses [Husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/okonet/lint-staged) to enforce code quality checks before commits. When you commit changes, the following checks are automatically run:

- ESLint will run on all staged JavaScript and TypeScript files
- Prettier will format all staged YAML files
- Any fixable issues will be automatically corrected

Additionally, the project uses [commitlint](https://commitlint.js.org/) to enforce conventional commit message format. This ensures that commit messages follow a standardized format, making it easier to generate changelogs and understand the history of the project.

If any issues cannot be automatically fixed, the commit will be aborted, and you'll need to resolve the issues before committing again.

To run the linting checks manually:

```bash
yarn lint-staged
```

To run ESLint on all files with automatic fixing:

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
