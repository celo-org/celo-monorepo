#!/usr/bin/env bash
set -euo pipefail

cd $(dirname $0)
yarn run --silent cli "$@"
