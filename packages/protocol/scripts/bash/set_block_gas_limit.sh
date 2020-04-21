#!/usr/bin/env bash
set -euo pipefail

# Sets block gas limit and turns ownership of contract over to governance
#
# Flags:
# -n: Name of the network to migrate to

TRUFFLE_OVERRIDE=""
MIGRATION_OVERRIDE=""
NETWORK=""
# https://github.com/trufflesuite/truffle-migrate/blob/develop/index.js#L161
# Default to larger than the number of contracts we will ever have

while getopts 'n:rt:f:c:m:' flag; do
  case "${flag}" in
    n) NETWORK="$OPTARG" ;;
    c) TRUFFLE_OVERRIDE="$OPTARG" ;;
    m) MIGRATION_OVERRIDE="$OPTARG" ;;
    t) ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;

if ! nc -z 127.0.0.1 8545 ; then
  echo "Port 8545 not open"
  exit 1
fi

yarn run truffle exec ./scripts/truffle/set_block_gas_limit.js \
  --network $NETWORK --build_directory $PWD/build/$NETWORK --truffle_override "$TRUFFLE_OVERRIDE" \
  --migration_override "$MIGRATION_OVERRIDE"
