#!/usr/bin/env bash
set -euo pipefail

# Checks that Solidity sources on a given branch correspond to bytecodes
# deployed to a Celo system deployed to the given network.
#
# Flags:
# -b: Branch containing smart contracts that currently comprise the Celo protocol
# -n: The network to check
# -r: Boolean flag to indicate if this is the first release (before linked
#     libraries were proxied)
#     TODO: remove -r in the future.
# -f: Boolean flag to indicate if the Forno service should be used to connect to
# the network
# -q: Suppress positive output

BRANCH=""
NETWORK=""
RELEASE_1=""
FORNO=""
QUIET=""

while getopts 'b:n:rfq' flag; do
  case "${flag}" in
    b) BRANCH="${OPTARG}" ;;
    n) NETWORK="${OPTARG}" ;;
    r) RELEASE_1="--before_release_1" ;;
    f) FORNO="--forno" ;;
    q) QUIET="--quiet" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$BRANCH" ] && echo "Need to set the branch via the -b flag" && exit 1;
[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;

BUILD_DIR=$(echo build/$(echo $BRANCH | sed -e 's/\//_/g'))
git checkout $BRANCH
rm -rf build/contracts
# TODO: Move to yarn build:sol after the next contract release.
yarn build
rm -rf $BUILD_DIR && mkdir -p $BUILD_DIR
mv build/contracts $BUILD_DIR
# Move back to branch from which we started
git checkout -

yarn build
yarn run truffle exec ./scripts/truffle/verify-bytecode.js --network $NETWORK --build_artifacts $BUILD_DIR/contracts $RELEASE_1 $FORNO $QUIET
