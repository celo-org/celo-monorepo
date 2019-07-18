#!/usr/bin/env bash
set -euo pipefail

# Tests the state of the contracts on any network
#
# Flags:
# -n: Name of the network to test
# -c: Override for truffle config

NETWORK=""
TRUFFLE_OVERRIDE=""
MIGRATION_OVERRIDE=""

while getopts 'n:c:m:' flag; do
  case "${flag}" in
    n) NETWORK="$OPTARG" ;;
    c) TRUFFLE_OVERRIDE="$OPTARG" ;;
    m) MIGRATION_OVERRIDE="$OPTARG" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;

yarn run contract-types && \
yarn run compile-typescript && \
yarn run truffle exec ./scripts/truffle/network_check.js \
  --network $NETWORK --build_directory $PWD/build/$NETWORK \
  --truffle_override "$TRUFFLE_OVERRIDE" \
  --migration_override "$MIGRATION_OVERRIDE"
