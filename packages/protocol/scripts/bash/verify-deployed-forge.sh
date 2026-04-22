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
# -e: Path to extra transactions JSON file (optional, used to skip validation of appended TXs)

BRANCH=""
NETWORK=""
FORNO=""
LOG_FILE="/dev/stdout"
EXTRA_TXS=""

while getopts 'b:n:fl:e:' flag; do
  case "${flag}" in
    b) BRANCH="${OPTARG}" ;;
    n) NETWORK="${OPTARG}" ;;
    f) FORNO="--forno" ;;
    l) LOG_FILE="${OPTARG}" ;;
    e) EXTRA_TXS="${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$BRANCH" ] && echo "Need to set the branch via the -b flag" && exit 1;
[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;

source scripts/bash/release-lib.sh
source scripts/bash/warn-if-libraries-exist.sh
warn_if_libraries_exist "$NETWORK-$BRANCH-libraries.json"

cp foundry.toml foundry.toml.bak

build_tag_foundry $BRANCH $LOG_FILE truffle-compat foundry.toml.bak
build_tag_foundry $BRANCH $LOG_FILE truffle-compat8 foundry.toml.bak

mv foundry.toml.bak foundry.toml

EXTRA_TXS_FLAG=""
if [ -n "$EXTRA_TXS" ]; then
  EXTRA_TXS_FLAG="--extraTxs $EXTRA_TXS"
fi

TS_NODE_CACHE=false yarn ts-node --preferTsExts ./scripts/foundry/verify-bytecode-foundry.ts --network $NETWORK --branch $BRANCH --librariesFile "$NETWORK-$BRANCH-libraries.json" $FORNO $EXTRA_TXS_FLAG
