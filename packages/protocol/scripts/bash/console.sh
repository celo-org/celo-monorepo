#!/usr/bin/env bash
set -euo pipefail

# Opens an interactive node+Truffle console connected to an Ethereum network.
#
# Flags:
# -n <network>: the network to connect to
# -f: Boolean flag to indicate if the Forno service should be used to connect to
# the network

NETWORK=""
FORNO=""

while getopts 'n:f' flag; do
  case "${flag}" in
    n) NETWORK="$OPTARG" ;;
    f) FORNO="--forno" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;

if ! nc -z 127.0.0.1 8545 && [ -z $FORNO ] ; then
  echo "Port 8545 not open"
  exit 1
fi

yarn run truffle console --network $NETWORK --contracts_build_directory $PWD/build/contracts $FORNO
