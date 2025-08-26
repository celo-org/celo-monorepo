#!/usr/bin/env bash
set -euo pipefail

# Checks that the contract version numbers in a provided branch are as expected given
# a released branch.
#
# Flags:
# -b: Branch to build contracts from.
# -k: Private key to sign transactions from.
# -i: Path to the data needed to initialize contracts.
# -l: Path to the canonical library mapping.
# -n: The network to deploy to.
# -p: Path that the governance proposal should be written to.
# -r: Path to the contract compatibility report.

BRANCH=""
PRIVATE_KEY=""
INITIALIZE_DATA=""
LIBRARIES=""
NETWORK=""
PROPOSAL=""
REPORT=""

while getopts 'b:k:i:l:n:p:r:' flag; do
  case "${flag}" in
    b) BRANCH="${OPTARG}" ;;
    k) PRIVATE_KEY="${OPTARG}" ;;
    i) INITIALIZE_DATA="${OPTARG}" ;;
    l) LIBRARIES="${OPTARG}" ;;
    n) NETWORK="${OPTARG}" ;;
    p) PROPOSAL="${OPTARG}" ;;
    r) REPORT="${OPTARG}" ;;
    *)
      echo "Unexpected option ${flag}" >&2
      exit 1
      ;;
  esac
done

[ -z "$BRANCH" ] && echo "Need to set the build branch via the -b flag" && exit 1;
[ -z "$PRIVATE_KEY" ] && echo "Need to set the private key for signing via the -k flag" && exit 1;
[ -z "$INITIALIZE_DATA" ] && echo "Need to set the initialization data via the -i flag" && exit 1;
[ -z "$LIBRARIES" ] && echo "Need to set the library mapping input via the -l flag" && exit 1;
[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;
[ -z "$PROPOSAL" ] && echo "Need to set the proposal outfile via the -p flag" && exit 1;
[ -z "$REPORT" ] && echo "Need to set the compatibility report input via the -r flag" && exit 1;

BUILD_DIR="./out/"

yarn ts-node ./scripts/foundry/make-release.ts \
  --branch "$BRANCH" \
  --privateKey "$PRIVATE_KEY" \
  --initialize_data "$INITIALIZE_DATA" \
  --librariesFile "$LIBRARIES" \
  --network "$NETWORK" \
  --proposal "$PROPOSAL" \
  --report "$REPORT" \
  --build_directory "$BUILD_DIR"
