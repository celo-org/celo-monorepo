#!/usr/bin/env bash
set -euo pipefail

# Transfers StableToken and Gold balances to an account
#
# Flags:
# -a: Address of the account who will receive the transfer
# -n: Name of the network to increment balances on

ACCOUNT=""
NETWORK=""
DOLLARS="0"
GOLD="0"

while getopts 'a:n:d:g:' flag; do
  case "${flag}" in
    a) ACCOUNT="$OPTARG" ;;
    n) NETWORK="$OPTARG" ;;
    d) DOLLARS="$OPTARG" ;;
    g) GOLD="$OPTARG" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;
[ -z "$ACCOUNT" ] && echo "Need to set the ACCOUNT via the -a flag" && exit 1;

if ! nc -z 127.0.0.1 8545 ; then
  echo "Port 8545 not open"
  exit 1
fi

yarn run contract-types && \
yarn run compile-typescript && \
yarn run truffle exec ./scripts/truffle/transfer.js \
  --network $NETWORK --stableValue $DOLLARS --goldValue $GOLD \
  --build_directory $PWD/build/$NETWORK --to $ACCOUNT
