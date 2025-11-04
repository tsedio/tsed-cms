#!/bin/bash

SKIP_BOOTSTRAP=false
DEBUG_ENV=false
node cli.js bootstrap
node cli.js schema apply -y ./snapshots/snapshot-latest.yaml