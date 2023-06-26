#!/usr/bin/env bash
set -euo pipefail

source ./scripts/bash/utils.sh

# Generates a local network of a target git ref
#
# Flags:
# -b: Branch containing smart contracts that currently comprise the Celo protocol
# -l: Path to a file to which logs should be appended

BRANCH=""
NETWORK=""
FORNO=""
BUILD_DIR=""
LOG_FILE="/dev/null"
GRANTS_FILE=""

while getopts ':b:rl:d:g:' flag; do
  case "${flag}" in
    b) BRANCH="${OPTARG}" ;;
    l) LOG_FILE="${OPTARG}" ;;
    d) BUILD_DIR="${OPTARG}" ;;
    g) GRANTS_FILE="${OPTARG}";;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$BRANCH" ] && echo "Need to set the branch via the -b flag" && exit 1;
[ -z "$BUILD_DIR" ] && BUILD_DIR=$(echo build/$(echo $BRANCH | sed -e 's/\//_/g'));

echo "- Checkout source code at $BRANCH"
git fetch origin +"$BRANCH" 2>>$LOG_FILE >> $LOG_FILE
git checkout $BRANCH 2>>$LOG_FILE >> $LOG_FILE

echo "- Build monorepo (contract artifacts, migrations, + all dependencies)"
cd ../..
# TODO: use `yarn clean` after release v8 (not available at monorepo-root for <=v8)
# yarn run lerna run clean >> $LOG_FILE
yarn run reset >> $LOG_FILE
# build entire monorepo to account for any required dependencies.
yarn install >> $LOG_FILE
yarn run lerna run clean >> $LOG_FILE
yarn install >> $LOG_FILE
# in release v8 and earlier, @celo/contractkit automatically uses set RELEASE_TAG
# when building, which fails if this differs from `package/protocol`'s build directory.
RELEASE_TAG="" yarn build >> $LOG_FILE
cd packages/protocol

echo "- Create local network"
if [ -z "$GRANTS_FILE" ]; then
  yarn devchain generate-tar "$PWD/devchain.tar.gz" >> $LOG_FILE
else
  yarn devchain generate-tar "$PWD/devchain.tar.gz" --release_gold_contracts $GRANTS_FILE >> $LOG_FILE
fi
rm -rf $BUILD_DIR && mkdir -p $BUILD_DIR
mv build/contracts $BUILD_DIR
mv "$PWD/devchain.tar.gz" $BUILD_DIR/.

git checkout -
