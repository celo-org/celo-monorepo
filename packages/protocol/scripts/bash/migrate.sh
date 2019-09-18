#!/usr/bin/env bash
set -euo pipefail

# Runs unmigrated truffle migrations in protocol/migrations/
#
# Flags:
# -n: Name of the network to migrate to
# -r: Reset network state by running all migrations

TRUFFLE_OVERRIDE=""
MIGRATION_OVERRIDE=""
NETWORK=""
RESET=""
# https://github.com/trufflesuite/truffle-migrate/blob/develop/index.js#L161
# Default to larger than the number of contracts we will ever have
TO=100000

while getopts 'n:rt:c:m:' flag; do
  case "${flag}" in
    n) NETWORK="$OPTARG" ;;
    r) RESET="--reset" ;;
    t) TO="$OPTARG" ;;
    c) TRUFFLE_OVERRIDE="$OPTARG" ;;
    m) MIGRATION_OVERRIDE="$OPTARG" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;

if ! nc -z 127.0.0.1 8545 ; then
  echo "Port 8545 not open"
  exit 1
fi

yarn run build && \
echo "Migrating contracts up to migration number ${TO}" && \
yarn run truffle migrate --compile-all --network $NETWORK --build_directory $PWD/build/$NETWORK $RESET \
  --to ${TO} \
  --truffle_override "$TRUFFLE_OVERRIDE" \
  --migration_override "$MIGRATION_OVERRIDE"
