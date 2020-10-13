#!/usr/bin/env bash
set -euo pipefail

# Checks that Solidity sources on a given branch correspond to bytecodes
# deployed to a Celo system deployed to the given network, as modified by a
# Governance proposal.
#
# Flags:
# -b: Branch containing smart contracts that are proposed to be deployed.
# -n: The network to check
# -p: The proposal JSON file
# -f: Boolean flag to indicate if the Forno service should be used to connect to
# the network

BRANCH=""
NETWORK=""
PROPOSAL=""
FORNO=""

while getopts 'b:n:p:f' flag; do
  case "${flag}" in
    b) BRANCH="${OPTARG}" ;;
    n) NETWORK="${OPTARG}" ;;
    p) PROPOSAL="${OPTARG}" ;;
    f) FORNO="--forno" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$BRANCH" ] && echo "Need to set the branch via the -b flag" && exit 1;
[ -z "$NETWORK" ] && echo "Need to set the network via the -n flag" && exit 1;
[ -z "$PROPOSAL" ] && echo "Need to set the proposal via the -p flag" && exit 1;

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
yarn run truffle exec ./scripts/truffle/verify-bytecode.js --network $NETWORK --build_artifacts $BUILD_DIR/contracts --proposal "../../$PROPOSAL" $FORNO
