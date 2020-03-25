#!/usr/bin/env bash
set -euo pipefail

# Deploys all grants detailed in `GRANTS_FILE` from the corresponding entity.
#
# Flags:
# -n: Name of the network to upgrade
# -f: Address of the account deploying the grant
# -g: File containing grant information
# -s: Amount of gold for beneficiary to start with for transactions
# -o: (Optional) File to output results to
# -really: (Optional) Reply "yes" to prompts about deploying grants (Be careful!)
#
# Example:
# `./scripts/bash/deploy_release_contracts.sh -n development -f scripts/truffle/releaseGoldContracts.json -g 50`

NETWORK=""
GRANTS_FILE=""
FROM=""
START_GOLD=""
OUTPUT_FILE=""
REALLY=""

while getopts 'n:f:g:s:o:r:' flag; do
  case "${flag}" in
    n) NETWORK="$OPTARG" ;;
    f) FROM="${OPTARG}" ;;
    g) GRANTS_FILE="${OPTARG}" ;;
    s) START_GOLD="${OPTARG}" ;;
    o) OUTPUT_FILE="${OPTARG}" ;;
    r) REALLY="--yesreally" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;
[ -z "$FROM" ] && echo "No from address specified via the -f flag: defaulting to truffle default"; 
[ -z "$GRANTS_FILE" ] && echo "Need to set the GRANTS_FILE via the -g flag" && exit;
[ -z "$START_GOLD" ] && echo "No starting gold provided via -s flag: defaulting to 1cGld" && START_GOLD=1;
[ -z "$OUTPUT_FILE" ] && echo "No output file provided, will print output to console."

if ! nc -z 127.0.0.1 8545 ; then
  echo "Port 8545 not open"
  exit 1
fi

yarn run build && \
yarn run truffle exec ./scripts/truffle/deploy_release_contracts.js \
  --network $NETWORK --from $FROM --grants $GRANTS_FILE --start_gold $START_GOLD --output_file $OUTPUT_FILE $REALLY --build_directory $PWD/build/$NETWORK \
