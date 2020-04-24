#!/usr/bin/env bash
set -euo pipefail

# Verify all contracts in CONTRACT_FILE match the configs in CONFIG_FILE
#
# Flags:
# -n: Name of the network to query
# -o: File output from deploy script containing contract information
# -c: File input to deploy script containing contract configs
#
# Example:
# `./scripts/bash/verify_release_gold_balances.sh -n development -o grantsOut.json -c releaseGoldExampleConfigs.json

NETWORK=""
CONTRACT_JSON=""
CONFIG_JSON=""

while getopts 'n:o:c:' flag; do
  case "${flag}" in
    n) NETWORK="$OPTARG" ;;
    o) CONTRACT_JSON="${OPTARG}" ;;
    c) CONFIG_JSON="${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;
[ -z "$CONTRACT_JSON" ] && echo "Need to set the CONTRACT_JSON file via the -o flag" && exit 1;
[ -z "$CONFIG_JSON" ] && echo "Need to set the CONFIG_JSON file via the -c flag" && exit 1;

if ! nc -z 127.0.0.1 8545 ; then
  echo "Port 8545 not open"
  exit 1
fi

yarn run build && \
yarn run truffle exec ./scripts/truffle/verify_release_gold_balances.js \
  --network $NETWORK --contract_json $CONTRACT_JSON --config_json $CONFIG_JSON --build_directory $PWD/build/$NETWORK \