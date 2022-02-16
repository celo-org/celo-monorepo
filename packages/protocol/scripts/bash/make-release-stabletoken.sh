#!/usr/bin/env bash
set -euo pipefail

# Builds and deploy a contract release involving stable tokens
#
# Flags:
# -n: The network to deploy to.
# -b: Branch to build contracts from.
# -p: Path that the governance proposal should be written to.
# -i: Path to the data needed to initialize contracts.
# -r: Path to the contract compatibility report.
# -d: Whether to dry-run this deploy
# -f: Address to sign transactions from.
# -l: Path to the canonical library mapping.
# -F: Whether to use the forno endpoint.
# -s: Path to the data needed to initialize StableTokens.

NETWORK=""
PROPOSAL=""
BRANCH=""
INITIALIZE_DATA=""
REPORT=""
DRYRUN=""
FROM=""
LIBRARIES=""
FORNO=""
STABLETOKEN_DATA=""

while getopts 'b:n:p:i:r:df:l:F:s' flag; do
  case "${flag}" in
    b) BRANCH="${OPTARG}" ;;
    n) NETWORK="${OPTARG}" ;;
    p) PROPOSAL="${OPTARG}" ;;
    i) INITIALIZE_DATA="${OPTARG}" ;;
    r) REPORT="${OPTARG}" ;;
    d) DRYRUN="--dry_run" ;;
    F) FORNO="--forno" ;;
    f) FROM="${OPTARG}" ;;
    l) LIBRARIES="${OPTARG}" ;;
    s) STABLETOKEN_DATA="${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;
[ -z "$BRANCH" ] && echo "Need to set the build branch via the -b flag" && exit 1;
[ -z "$PROPOSAL" ] && echo "Need to set the proposal outfile via the -p flag" && exit 1;
[ -z "$INITIALIZE_DATA" ] && echo "Need to set the initialization data via the -i flag" && exit 1;
[ -z "$STABLETOKEN_DATA" ] && echo "Need to set the stablecoin data with -s flag" && exit 1;
[ -z "$REPORT" ] && echo "Need to set the compatibility report input via the -r flag" && exit 1;
[ -z "$LIBRARIES" ] && echo "Need to set the library mapping input via the -l flag" && exit 1;

source scripts/bash/release-lib.sh
build_tag $BRANCH "/dev/stdout"

yarn run truffle exec ./scripts/truffle/make-release-stabletoken.js \
  --network $NETWORK \
  --build_directory $BUILD_DIR \
  --report $REPORT \
  --librariesFile $LIBRARIES \
  --proposal $PROPOSAL \
  --from $FROM \
  --stabletoken_data $STABLETOKEN_DATA
  --initialize_data $INITIALIZE_DATA $DRYRUN $FORNO
