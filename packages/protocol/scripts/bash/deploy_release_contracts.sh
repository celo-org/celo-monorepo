#!/usr/bin/env bash
set -euo pipefail

# Deploys all grants detailed in `GRANTS_FILE` from the corresponding entity.
#
# Flags:
# -n: Name of the network to upgrade
# -f: Address of the account deploying the grant
# -g: File containing grant information
# -s: (Optional) Amount of gold for beneficiary to start with for transactions
# -d: (Optional) File to read deployed grants from and to output deployed grants to
# -o: (Optional) File to output results to
# -r: (Optional) Reply "yes" to prompts about deploying grants (Be careful!)
#
# Example:
# `./scripts/bash/deploy_release_contracts.sh -n development -f 0x5409ED021D9299bf6814279A6A1411A7e866A631 -g scripts/truffle/releaseGoldExampleConfigs.json`

NETWORK=""
GRANTS_FILE=""
FROM=""
START_GOLD=""
DEPLOYED_GRANTS=""
OUTPUT_FILE=""
REALLY=""

while getopts 'n:f:g:s:d:o:r:' flag; do
  case "${flag}" in
    n) NETWORK="$OPTARG" ;;
    f) FROM="${OPTARG}" ;;
    g) GRANTS_FILE="${OPTARG}" ;;
    s) START_GOLD="${OPTARG}" ;;
    d) DEPLOYED_GRANTS="${OPTARG}" ;;
    o) OUTPUT_FILE="${OPTARG}" ;;
    r) REALLY="--yesreally" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;
[ -z "$FROM" ] && echo "Need to set the FROM address vai the -f flag" && exit 1;
[ -z "$GRANTS_FILE" ] && echo "Need to set the GRANTS_FILE via the -g flag" && exit 1;
[ -z "$START_GOLD" ] && echo "No starting gold provided via -s flag: defaulting to 1cGld" && START_GOLD=1;
[ -z "$DEPLOYED_GRANTS" ] && echo "No deployed grants file provided via -d flag: defaulting to `scripts/truffle/deployedGrants.json`" && DEPLOYED_GRANTS="scripts/truffle/deployedGrants.json"
[ -z "$OUTPUT_FILE" ] && echo "Need to set output file via the -o flag" && exit 1;

if ! nc -z 127.0.0.1 8545 ; then
  echo "Port 8545 not open"
  exit 1
fi

yarn run build && \
yarn run truffle exec ./scripts/truffle/deploy_release_contracts.js \
  --network $NETWORK --from $FROM --grants $GRANTS_FILE --start_gold $START_GOLD --deployed_grants $DEPLOYED_GRANTS --output_file $OUTPUT_FILE $REALLY --build_directory $PWD/build/$NETWORK \