#!/usr/bin/env bash
set -euo pipefail

# Upgrades all proxyable contracts whose compiled bytecode differs from the
# bytecode of the contract pointed to by the corresponding proxy.
#
# Flags:
# -n: Name of the network to upgrade

NETWORK=""

while getopts 'n:' flag; do
  case "${flag}" in
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
yarn run truffle-compile -n $NETWORK && \
yarn run truffle exec ./scripts/truffle/upgrade.js \
  --network $NETWORK --build_directory $PWD/build/$NETWORK \
