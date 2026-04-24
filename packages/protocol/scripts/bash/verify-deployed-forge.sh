#!/usr/bin/env bash
set -euo pipefail

# Checks that Solidity sources on a given branch correspond to bytecodes
# deployed to a Celo system deployed to the given network.
#
# Flags:
# -b: Branch containing smart contracts that currently comprise the Celo protocol
# -n: The network to check
# -f: Boolean flag to indicate if the Forno service should be used to connect to
#     the network
# -l: Path to a file to which logs should be appended
# -p: Path to the proposal JSON file (optional)
# -i: Path to the initialization data JSON file (optional)
# -e: Path to extra transactions JSON file (optional, used to skip validation of appended TXs)
# -a: Allow errors during verification (writes libraries to -err.json instead of failing)

BRANCH=""
NETWORK=""
FORNO=""
LOG_FILE="/dev/stdout"
PROPOSAL=""
INITIALIZE_DATA=""
EXTRA_TXS=""
ALLOW_ERROR=""

while getopts 'b:n:fl:p:i:e:a' flag; do
  case "${flag}" in
    b) BRANCH="${OPTARG}" ;;
    n) NETWORK="${OPTARG}" ;;
    f) FORNO="--forno" ;;
    l) LOG_FILE="${OPTARG}" ;;
    p) PROPOSAL="${OPTARG}" ;;
    i) INITIALIZE_DATA="${OPTARG}" ;;
    e) EXTRA_TXS="${OPTARG}" ;;
    a) ALLOW_ERROR="--allowError" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$BRANCH" ] && echo "Need to set the branch via the -b flag" && exit 1;
[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;

source scripts/bash/warn-extra-transactions.sh
warn_extra_transactions "$BRANCH" "$EXTRA_TXS"

source scripts/bash/release-lib.sh
source scripts/bash/warn-if-libraries-exist.sh
warn_if_libraries_exist "$NETWORK-$BRANCH-libraries.json"

cp foundry.toml foundry.toml.bak

build_tag_foundry $BRANCH $LOG_FILE truffle-compat foundry.toml.bak
build_tag_foundry $BRANCH $LOG_FILE truffle-compat8 foundry.toml.bak

mv foundry.toml.bak foundry.toml

OPTIONAL_FLAGS=""
if [ -n "$PROPOSAL" ]; then
  OPTIONAL_FLAGS="$OPTIONAL_FLAGS --proposal $PROPOSAL"
fi
if [ -n "$INITIALIZE_DATA" ]; then
  OPTIONAL_FLAGS="$OPTIONAL_FLAGS --initialize_data $INITIALIZE_DATA"
fi
if [ -n "$EXTRA_TXS" ]; then
  OPTIONAL_FLAGS="$OPTIONAL_FLAGS --extraTxs $EXTRA_TXS"
fi

TS_NODE_CACHE=false yarn ts-node --preferTsExts ./scripts/foundry/verify-bytecode-foundry.ts --network $NETWORK --branch $BRANCH --librariesFile "$NETWORK-$BRANCH-libraries.json" $FORNO $OPTIONAL_FLAGS $ALLOW_ERROR
