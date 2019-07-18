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
VALIDATOR_PUBLIC_KEYS=""

while getopts 'n:rt:c:k:m:' flag; do
  case "${flag}" in
    n) NETWORK="$OPTARG" ;;
    r) RESET="--reset" ;;
    t) TO="$OPTARG" ;;
    k) VALIDATOR_PUBLIC_KEYS="$OPTARG" ;;
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

yarn run contract-types && \
yarn run compile-typescript && \
echo "Migrating contracts up to migration number ${TO}" && \
yarn run truffle migrate --compile-all --network $NETWORK --build_directory $PWD/build/$NETWORK $RESET \
  --to ${TO} \
  --keys $VALIDATOR_PUBLIC_KEYS \
  --truffle_override "$TRUFFLE_OVERRIDE" \
  --migration_override "$MIGRATION_OVERRIDE"
