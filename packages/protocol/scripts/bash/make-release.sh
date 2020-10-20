#!/usr/bin/env bash
set -euo pipefail

# Checks that the contract version numbers in a provided branch are as expected given
# a released branch.
#
# Flags:
# -n: The network to deploy to.
# -b: Branch to build contracts from.
# -p: Path that the governance proposal should be written to.
# -i: Path to the data needed to initialize contracts.
# -r: Path to the contract compatibility report.
# -d: Whether to dry-run this deploy

NETWORK=""
PROPOSAL=""
BRANCH=""
INITIALIZE_DATA=""
REPORT=""
DRYRUN=""

while getopts 'b:n:p:i:r:d' flag; do
  case "${flag}" in
    b) BRANCH="${OPTARG}" ;;
    n) NETWORK="${OPTARG}" ;;
    p) PROPOSAL="${OPTARG}" ;;
    i) INITIALIZE_DATA="${OPTARG}" ;;
    r) REPORT="${OPTARG}" ;;
    d) DRYRUN="--dry_run" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;
[ -z "$BRANCH" ] && echo "Need to set the build branch via the -b flag" && exit 1;
[ -z "$PROPOSAL" ] && echo "Need to set the proposal outfile via the -p flag" && exit 1;
[ -z "$INITIALIZE_DATA" ] && echo "Need to set the initialization data via the -i flag" && exit 1;
[ -z "$REPORT" ] && echo "Need to set the compatibility report input via the -r flag" && exit 1;

BUILD_DIR=$(echo build/$(echo $BRANCH | sed -e 's/\//_/g'))

git checkout $BRANCH
rm -rf build/contracts
yarn build
rm -rf $BUILD_DIR && mkdir -p $BUILD_DIR
mv build/contracts $BUILD_DIR

git checkout -
yarn build

# TODO: remove the truffle_override
yarn run truffle exec ./scripts/truffle/make-release.js \
  --network $NETWORK \
  --build_directory $BUILD_DIR \
  --report $REPORT \
  --proposal $PROPOSAL \
  --truffle_override '{"gasLimit": 13000000, "gas": 13000000 }' \
  --initialize_data $INITIALIZE_DATA $DRYRUN
