#!/usr/bin/env bash
set -euo pipefail

# Allows users submit (and possibly execute) MultiSig transactions.
#
# Flags:
# -c: Function to run, e.g. stableToken.setMinter(0x1234)
# -n: Name of the network to govern

CMD=""
NETWORK=""

while getopts 'c:n:' flag; do
  case "${flag}" in
    c) CMD="${OPTARG}" ;;
    n) NETWORK="$OPTARG" ;;
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
yarn run truffle exec ./scripts/truffle/govern.js \
  --network $NETWORK --build_directory $PWD/build/$NETWORK --command "$CMD"
