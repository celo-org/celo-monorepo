#!/usr/bin/env bash
set -euo pipefail

# Compiles Truffle contracts
#
# Flags:
# -n: Network to whose build directory artifacts should be saved

NETWORK=""

while getopts 'n:' flag; do
  case "${flag}" in
    n) NETWORK="$OPTARG" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

yarn run truffle compile --build_directory=$PWD/build/$NETWORK
sleep 1
yarn run ts-node ./scripts/typescript/check-bytecode.ts --build_directory=$PWD/build/$NETWORK
