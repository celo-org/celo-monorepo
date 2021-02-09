#!/usr/bin/env bash
set -euo pipefail

source ./scripts/bash/utils.sh

# Simulates a release of the current contracts against a target git ref on a local network
#
# Flags:
# -l: Path to a file to which logs should be appended

BUILD_DIR=""
RE_BUILD_REPO=""
LOG_FILE="/dev/null"

while getopts 'b:l:d:' flag; do
  case "${flag}" in
    l) LOG_FILE="${OPTARG}" ;;
    d) BUILD_DIR="${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done


# if BUILD_DIR was not set as a parameter, we generate the build and the chain for that specific branch
if [ -z "$BUILD_DIR" ]
then
    RE_BUILD_REPO="yes"
    BUILD_DIR=$(echo build/$(echo $BRANCH | sed -e 's/\//_/g'))
fi

echo "- Run local network"
startInBgAndWaitForString 'Ganache STARTED' yarn devchain run-tar packages/protocol/$BUILD_DIR/devchain.tar.gz >> $LOG_FILE

mkdir build/development

if [ -n "$RE_BUILD_REPO" ]
then
    # Move back to branch from which we started
    git checkout -
    yarn install >> $LOG_FILE
    yarn build >> $LOG_FILE
    cp -r build/contracts build/development/contracts
else
  cp -r $BUILD_DIR/contracts build/development/contracts
fi

GANACHE_PID=
if command -v lsof; then
    GANACHE_PID=`lsof -i tcp:8545 | tail -n 1 | awk '{print $2}'`
    echo "Network started with PID $GANACHE_PID, if exit 1, you will need to manually stop the process"
fi

cp -r $BUILD_DIR

yarn build:ts
yarn run truffle exec scripts/truffle/deploy-release-contracts.test.js


if [[ -n $GANACHE_PID ]]; then
    kill $GANACHE_PID
fi
