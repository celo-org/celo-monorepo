#!/usr/bin/env bash
set -euo pipefail

# Validate contracts in blockscout
#
# Flags:
# -b: Blockscout URL where contracts will be validated
# -c: Name of the contract to validate. If none it will validate all available contracts

NETWORK=""
BLOCKSCOUT_URL=""
CONTRACT=""
while getopts 'n:b:c:' flag; do
  case "${flag}" in
    n) NETWORK="${OPTARG}" ;;
    b) BLOCKSCOUT_URL="${OPTARG}" ;;
    c) CONTRACT="${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done
[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;
[ -z "$BLOCKSCOUT_URL" ] && echo "Need to set the BLOCKSCOUT_URL via the -b flag" && exit 1;

if ! nc -z 127.0.0.1 8545 ; then
  echo "Port 8545 not open"
  exit 1
fi

if ! curl -sSf "$BLOCKSCOUT_URL" >/dev/null; then
  echo "Blockscout server $BLOCKSCOUT_URL is not accessible"
  exit 1
fi

echo "Validating contracts in Blockscout $BLOCKSCOUT_URL"
if [ -z "$CONTRACT" ]; then
  yarn run truffle verify-blockscout all --network "$NETWORK"
else
  yarn run truffle verify-blockscout "$CONTRACT" --network "$NETWORK"
fi
