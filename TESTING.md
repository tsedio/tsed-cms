# Testing the GitLab CI/CD Configuration

This document provides instructions for testing the GitLab CI/CD configuration locally before pushing to the repository.

## Prerequisites

- [Node.js](https://nodejs.org/) (v22.16.0 or higher)
- [Yarn](https://yarnpkg.com/) (v4.9.2 or higher)
- [Docker](https://www.docker.com/)
- [GitLab Runner](https://docs.gitlab.com/runner/install/) (optional, for local CI testing)

## Testing Scripts Locally

Before pushing to GitLab, you can test the scripts locally to ensure they work as expected:

### 1. Install Dependencies

```bash
yarn install
```

### 2. Run Linting

```bash
yarn test:lint
```

### 3. Run Tests

```bash
yarn test
```

### 4. Run Tests with CI Reporter

```bash
yarn test:ci
```

### 5. Build the Project

```bash
yarn build
```

## Testing with GitLab Runner Locally

If you have GitLab Runner installed, you can test the CI/CD pipeline locally:

1. Install GitLab Runner: https://docs.gitlab.com/runner/install/

2. Run a specific job:

```bash
gitlab-runner exec docker lint
gitlab-runner exec docker test-server
gitlab-runner exec docker build
```

## Workflow Variables

The CI/CD pipeline supports different workflows controlled by variables:

- `WORKFLOW`: The workflow to execute
  - `build`: Run tests and build the application
  - `deploy`: Deploy the application to the specified environment
  - `rebase`: Rebase and deploy
  - `rebase-all`: Republish all content

- `ENV`: The deployment target environment
  - `staging`: Deploy to staging environment
  - `production`: Deploy to production environment

- `VERSION`: The version or branch name to deploy

## Example Pipeline Runs

### Build Workflow

```bash
# In GitLab CI/CD interface, run a pipeline with:
WORKFLOW=build
```

### Deploy Workflow

```bash
# In GitLab CI/CD interface, run a pipeline with:
WORKFLOW=deploy
ENV=staging
VERSION=main
```

## Troubleshooting

If you encounter issues with the CI/CD pipeline:

1. Check the job logs for specific error messages
2. Verify that all required environment variables are set
3. Ensure that the Docker image can be built locally
4. Check that the Heroku API key is correctly configured