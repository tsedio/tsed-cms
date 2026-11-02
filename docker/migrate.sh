#!/bin/sh
# Brings the database up to date before the server starts: Directus and project migrations, then the schema snapshot.
# Any failure stops the container, so a deploy never runs on a partial schema.
set -eu

# Always run the migrations here, even when SKIP_BOOTSTRAP=true is set on the service.
export SKIP_BOOTSTRAP=false
export DEBUG_ENV=false

node cli.js bootstrap
node cli.js schema apply -y ./snapshots/snapshot-latest.yaml
