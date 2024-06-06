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

[ -z "$BRANCH" ] && echo "Need to set the branch via the -b flag" && exit 1;

# if BUILD_DIR was not set as a parameter, we generate the build and the chain for that specific branch
if [ -z "$BUILD_DIR" ]
then
    RE_BUILD_REPO="yes"
    BUILD_DIR=$(echo build/$(echo $BRANCH | sed -e 's/\//_/g'))
fi


echo "- Run local network"
yarn devchain run-tar-in-bg packages/protocol/$BUILD_DIR/devchain.tar.gz

GANACHE_PID=
if command -v lsof; then
    GANACHE_PID=`lsof -i tcp:8545 | tail -n 1 | awk '{print $2}'`
    echo "Network started with PID $GANACHE_PID, if exit 1, you will need to manually stop the process"
fi

echo "- Verify bytecode of the network"

yarn run truffle exec ./scripts/truffle/verify-bytecode.js --network development --build_artifacts $BUILD_DIR/contracts --build_artifacts08 $BUILD_DIR/contracts-0.8 --branch $BRANCH --librariesFile libraries.json

echo "- Check versions of current branch"
# From check-versions.sh

BASE_COMMIT=$(git rev-parse HEAD)
echo " - Base commit $BASE_COMMIT"
echo " - Checkout migrationsConfig.js at $BRANCH"
git checkout $BRANCH -- migrationsConfig.js

source scripts/bash/contract-exclusion-regex.sh
yarn ts-node scripts/check-backward.ts sem_check --old_contracts $BUILD_DIR/contracts --new_contracts build/contracts --exclude $CONTRACT_EXCLUSION_REGEX --output_file report.json

echo "- Clean git modified file"
git restore migrationsConfig.js


# From make-release.sh
echo "- Deploy release of current branch"
INITIALIZATION_FILE=`ls releaseData/initializationData/release*.json | sort -V | tail -n 1 | xargs realpath`
yarn truffle exec --network development ./scripts/truffle/make-release.js --build_directory build/ --branch $BRANCH --report report.json --proposal proposal.json --librariesFile libraries.json --initialize_data $INITIALIZATION_FILE

# From verify-release.sh
echo "- Verify release"
yarn truffle exec --network development ./scripts/truffle/verify-bytecode.js --build_artifacts build/contracts --proposal ../../proposal.json --branch $BRANCH --initialize_data $INITIALIZATION_FILE

if [[ -n $GANACHE_PID ]]; then
    kill $GANACHE_PID
fi
