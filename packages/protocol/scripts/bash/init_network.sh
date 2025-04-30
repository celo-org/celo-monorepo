#!/usr/bin/env bash
set -euo pipefail

# Runs all truffle migrations in protocol/migrations/
#
# Flags:
# -n: Name of the network to migrate to

yarn run devchain:migrate -r "$@" && yarn run truffle:set-block-gas-limit "$@"
