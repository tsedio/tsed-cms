ARG NODE_VERSION=22.21.1
ARG DIRECTUS_VERSION=11.13.1
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY

# Build stage for TypeScript compilation
FROM node:${NODE_VERSION} AS build

# Set build-time proxy configuration
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY

WORKDIR /app

# Enable yarn via Corepack
RUN corepack enable
RUN yarn set version 4.9.2

# Copy Yarn configuration and package.json
COPY .yarn ./.yarn
COPY package.json .yarnrc.yml yarn.lock nx.json .nxignore ./

COPY extensions ./extensions
COPY packages ./packages
COPY migrations ./migrations

# Install dependencies
RUN yarn install

# Copy TypeScript configuration and source files
COPY tsconfig.json tsconfig.node.json tsconfig.base.json tsconfig.spec.json tsdown.config.ts ./

# Build TypeScript files
RUN yarn run build

# Production stage
FROM directus/directus:${DIRECTUS_VERSION}

COPY config ./config
COPY resources ./resources
COPY snapshots ./snapshots
COPY imports ./imports

ENV UPDATE_CHECK=false

# Create directories for uploads and extensions
RUN mkdir -p /directus/uploads /directus/extensions

COPY ./docker/cli.js ./
COPY ./docker/migrate.sh ./

# Copy compiled extensions from build stage
COPY --from=build /app/extensions /directus/extensions
COPY --from=build /app/migrations/dist /directus/migrations/dist
COPY --from=build /app/node_modules/dotenv /directus/node_modules/dotenv
COPY --from=build /app/node_modules/dotenv-flow /directus/node_modules/dotenv-flow
COPY --from=build /app/node_modules/dotenv-expand /directus/node_modules/dotenv-expand

# Copy specific Directus extensions
#COPY --from=build /app/node_modules/@directus-labs/collaborative-editing /directus/extensions/collaborative-editing
#COPY --from=build /app/node_modules/@directus-labs/command-palette-module /directus/extensions/command-palette-module
#COPY --from=build /app/node_modules/@directus-labs/seo-plugin /directus/extensions/seo-plugin
#@directus-labs/pdf-viewer-interface
#COPY --from=build /app/node_modules/@directus-labs/super-header-interface /directus/extensions/super-header-interface
#COPY --from=build /app/node_modules/directus-module-export /directus/extensions/directus-module-export

# Expose the port
EXPOSE 8055

# Use the default entrypoint and command from the base image
CMD : \
	&& node cli.js bootstrap \
	&& node cli.js start \
	;