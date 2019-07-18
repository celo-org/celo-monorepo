#!/usr/bin/env bash
set -euo pipefail

# Runs manual revoke of the provided phone number
#
# Flags:
# -p: The phone number to verify in E164 format
# -n: Name of the network on which to verify

set -euo pipefail

NETWORK=""
PHONE=""

while getopts 'n:p:t:' flag; do
  case "${flag}" in
    n) NETWORK="$OPTARG" ;;
    p) PHONE="${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;
[ -z "$PHONE" ] && echo "Need to set the PHONE via the -p flag" && exit 1;

if ! nc -z 127.0.0.1 8545 ; then
  echo "Port 8545 not open"
  exit 1
fi

yarn run contract-types && yarn run compile-typescript && \
  yarn run truffle exec ./scripts/truffle/revoke.js \
  --network $NETWORK --phone $PHONE \
  --build_directory $PWD/build/$NETWORK
