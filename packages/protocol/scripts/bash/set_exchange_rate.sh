#!/usr/bin/env bash
set -euo pipefail

# Updates the Gold/Stable token exchange rate to the provided value, or, if a CSV of
# (timestamp, stableValue, goldValue) tuples is provided, updates the exchange rate to the value
# associated with the most recent timestamp less than or equal to the current time stamp.
#
# Flags:
# -f: Filepath to csv of (timestamp, stableValue, goldValue) tuples
# -n: name of the network defined in truffle-config.js to set the exchange rate on
# -s: StableToken component of exchange rate
# -g: GoldToken component of exchange rate
# -c: Override for truffle config

NETWORK=""
FILE=""
GOLD_VALUE=""
STABLE_VALUE=""
CONFIG_OVERRIDE=""

while getopts 'g:f:n:s:c:' flag; do
  case "${flag}" in
    n) NETWORK="$OPTARG" ;;
    f) FILE="$OPTARG" ;;
    s) STABLE_VALUE="$OPTARG" ;;
    g) GOLD_VALUE="$OPTARG" ;;
    c) CONFIG_OVERRIDE="$OPTARG" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;

yarn run download-artifacts -n $NETWORK && \
yarn run build && \
yarn run truffle exec ./scripts/truffle/set_exchange_rate.js \
  --network $NETWORK --stableValue $STABLE_VALUE --goldValue $GOLD_VALUE \
  --build_directory $PWD/build/$NETWORK --csv $FILE \
  --config_override "$CONFIG_OVERRIDE"
