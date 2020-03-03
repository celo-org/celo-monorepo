#!/usr/bin/env bash
set -euo pipefail

# Deploys all grants detailed in `GRANTS_FILE` from the corresponding entity.
#
# Flags:
# -n: Name of the network to upgrade
# -f: File containing grant information
# -g: Amount of gold for beneficiary to start with for transactions
#
# Example:
# `./scripts/bash/deploy_release_contracts.sh -n development -f scripts/truffle/releaseGoldContracts.json -g 50`

NETWORK=""
GRANTS_FILE=""
START_GOLD=""

while getopts 'n:f:g:' flag; do
  case "${flag}" in
    n) NETWORK="$OPTARG" ;;
    f) GRANTS_FILE="${OPTARG}" ;;
    g) START_GOLD="${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;
[ -z "$GRANTS_FILE" ] && echo "Need to set the GRANTS_FILE via the -f flag" && exit;
[ -z "$START_GOLD" ] && echo "No starting gold provided via -g flag: defaulting to 10cGld" && START_GOLD=10;

if ! nc -z 127.0.0.1 8545 ; then
  echo "Port 8545 not open"
  exit 1
fi

yarn run build && \
yarn run truffle exec ./scripts/truffle/deploy_release_contracts.js \
  --network $NETWORK --grants $GRANTS_FILE --start_gold $START_GOLD --build_directory $PWD/build/$NETWORK \
