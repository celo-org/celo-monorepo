#!/usr/bin/env bash
set -euo pipefail

# Prints Gold, StableToken, and GoldToken balances for an account
#
# Flags:
# -a: Address of the account whose balance should be printed
# -n: Name of the network to check balances on

ACCOUNT=""
NETWORK=""

while getopts 'a:n:' flag; do
  case "${flag}" in
    a) ACCOUNT="${OPTARG}" ;;
    n) NETWORK="$OPTARG" ;;
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
yarn run truffle exec ./scripts/truffle/get_balances.js \
  --network $NETWORK --build_directory $PWD/build/$NETWORK --account $ACCOUNT
