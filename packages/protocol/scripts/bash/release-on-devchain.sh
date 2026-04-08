#!/usr/bin/env bash
set -euo pipefail

source ./scripts/bash/utils.sh
source ./scripts/foundry/constants.sh
source ./scripts/bash/validate-libraries-filename.sh

# Simulates a release of the current contracts against a target git ref on a local network
#
# Flags:
# -b: Branch containing smart contracts that currently comprise the Celo protocol
# -l: Path to a file to which logs should be appended

BRANCH=""
BUILD_DIR=""
RE_BUILD_REPO=""

while getopts 'b:l:d:' flag; do
  case "${flag}" in
    b) BRANCH="${OPTARG}" ;;
    d) BUILD_DIR="${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done


[ -z "$BRANCH" ] && echo "Need to set the branch via the -b flag" && exit 1;

echo "- Run local network"
./scripts/foundry/start_anvil.sh -p $ANVIL_PORT -l .tmp/devchain/l2-devchain.json

if command -v lsof; then
    ANVIL_PID=`lsof -i tcp:$ANVIL_PORT | tail -n 1 | awk '{print $2}'`
    echo "Network started with PID $ANVIL_PID, if exit 1, you will need to manually stop the process"
fi

echo "- Verify bytecode of the network"


# this commands compiles the output
yarn --cwd packages/protocol release:verify-deployed:foundry -n anvil -b $BRANCH

# Rename to the expected format for make-release
LIBRARIES_FILE=$(get_previous_libraries_filename "anvil" "$BRANCH")
VERIFY_LIBRARIES_FILE=$(get_libraries_filename "anvil" "$BRANCH")
mv "$VERIFY_LIBRARIES_FILE" "$LIBRARIES_FILE"

echo "- Check versions of current branch"
yarn release:check-versions:foundry -a $BRANCH -b HEAD

# From make-release.sh
echo "- Deploy release of current branch"
INITIALIZATION_FILE=`ls releaseData/initializationData/release*.json | sort -V | tail -n 1 | xargs realpath`
REPORT="report-$BRANCH-HEAD.json"
LIBRARIES_FILE="anvil-$BRANCH-libraries.json"


ANVIL_DEVNET_PRIVATE_KEY='0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
yarn release:make:foundry \
  -b "$BRANCH" \
  -k "$ANVIL_DEVNET_PRIVATE_KEY" \
  -i "$INITIALIZATION_FILE" \
  -l "$LIBRARIES_FILE" \
  -n anvil \
  -r "report-$BRANCH-HEAD.json" \
  -u "http://localhost:$ANVIL_PORT"

# From verify-release.sh
echo "- Verify release"
yarn --cwd packages/protocol release:verify-deployed:foundry \
    -n anvil \
    -b $BRANCH \
    -p "proposal-anvil-$BRANCH.json"

if [[ -n $ANVIL_PID ]]; then
    kill $ANVIL_PID
fi
