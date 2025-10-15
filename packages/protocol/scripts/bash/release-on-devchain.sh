#!/usr/bin/env bash
set -euo pipefail

source ./scripts/bash/utils.sh

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

# TODO
# TODO
#  THIS SHOULD BE REPLACED BY PROPER DEVCHAIN PROCESS
# TODO
# TODO
git checkout martinvol/WIPCR13makeItMatchTruffle
# FIX THE OZ submodule, it's probably not puuling it on the checkout
# yarn pull submodules?
yarn submodules:pull
yarn anvil-devchain:start-L2 > anvil.log #2>&1
git checkout -


# roll back submodules
yarn submodules:pull

ANVIL_PID=
if command -v lsof; then
    # TODO replace harcoded port
    ANVIL_PID=`lsof -i tcp:8545 | tail -n 1 | awk '{print $2}'`
    echo "Network started with PID $ANVIL_PID, if exit 1, you will need to manually stop the process"
fi

echo "- Verify bytecode of the network"


# this commands compiles the output
yarn --cwd packages/protocol release:verify-deployed -n anvil -b $BRANCH


echo "- Check versions of current branch"

# From check-versions.sh

BASE_COMMIT=$(git rev-parse HEAD)
echo " - Base commit $BASE_COMMIT"
echo " - Checkout migrationsConfig.js at $BRANCH"
git checkout $BRANCH -- migrationsConfig.js

source scripts/bash/contract-exclusion-regex.sh
yarn ts-node scripts/check-backward.ts sem_check --old_contracts $BUILD_DIR/contracts --new_contracts build/contracts --exclude $CONTRACT_EXCLUSION_REGEX --new_branch $BRANCH --output_file report.json

echo "- Clean git modified file"
git restore migrationsConfig.js


# From make-release.sh
echo "- Deploy release of current branch"
INITIALIZATION_FILE=`ls releaseData/initializationData/release*.json | sort -V | tail -n 1 | xargs realpath`
yarn truffle exec --network anvil ./scripts/truffle/make-release.js --build_directory build/ --branch $BRANCH --report report.json --proposal proposal.json --librariesFile libraries.json --initialize_data $INITIALIZATION_FILE

# From verify-release.sh
echo "- Verify release"
yarn truffle exec --network anvil ./scripts/truffle/verify-bytecode.js --build_artifacts build/contracts --proposal ../../proposal.json --branch $BRANCH --initialize_data $INITIALIZATION_FILE


# if [[ -n $ANVIL_PID ]]; then
#     kill $ANVIL_PID
# fi
