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
# -i: Path to the data needed to initialize contracts.
# -f: Boolean flag to indicate if the Forno service should be used to connect to
# the network
# -l: Path to a file to which logs should be appended

BRANCH=""
NETWORK=""
PROPOSAL=""
FORNO=""
INITIALIZE_DATA=""
LOG_FILE="/tmp/celo-verify-release.log"

while getopts 'b:n:p:fl:i:' flag; do
  case "${flag}" in
    b) BRANCH="${OPTARG}" ;;
    n) NETWORK="${OPTARG}" ;;
    i) INITIALIZE_DATA="--initialize_data $(realpath $OPTARG)" ;;
    p) PROPOSAL="$(realpath $OPTARG)" ;;
    f) FORNO="--forno" ;;
    l) LOG_FILE="${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$BRANCH" ] && echo "Need to set the branch via the -b flag" && exit 1;
[ -z "$NETWORK" ] && echo "Need to set the network via the -n flag" && exit 1;
[ -z "$PROPOSAL" ] && echo "Need to set the proposal via the -p flag" && exit 1;

source scripts/bash/release-lib.sh
build_tag $BRANCH $LOG_FILE

yarn run truffle exec ./scripts/truffle/verify-bytecode.js --network $NETWORK --build_artifacts $BUILD_DIR/contracts --branch $BRANCH --proposal $PROPOSAL $FORNO $INITIALIZE_DATA
