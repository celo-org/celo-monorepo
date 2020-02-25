#!/usr/bin/env bash
set -euo pipefail

# Deploys all grants detailed in `GRANTS_FILE` from the corresponding entity.
#
# Flags:
# -n: Name of the network to upgrade
# -f: File containing grant information

NETWORK=""
GRANTS_FILE=""

while getopts 'n:f:' flag; do
  case "${flag}" in
    n) NETWORK="$OPTARG" ;;
    f) GRANTS_FILE="${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;
[ -z "$GRANTS_FILE" ] && echo "Need to set the GRANTS_FILE via the -f flag" && exit;

if ! nc -z 127.0.0.1 8545 ; then
  echo "Port 8545 not open"
  exit 1
fi

yarn run build && \
yarn run truffle exec ./scripts/truffle/deploy_release_contracts.js \
  --network $NETWORK --grants $GRANTS_FILE --build_directory $PWD/build/$NETWORK \
