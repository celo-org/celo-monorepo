#!/usr/bin/env bash
set -euo pipefail

# Runs all truffle migrations in protocol/migrations/
#
# Flags:
# -n: Name of the network to migrate to

yarn run migrate -r "$@" && yarn run set_block_gas_limit "$@"
