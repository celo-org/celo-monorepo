#!/usr/bin/env bash
set -euo pipefail
set -x

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
# Fetching also tags so we can checkout if $BRACH references a tag
git fetch origin +"$BRANCH" --tags --force >> $LOG_FILE 2>&1
git checkout -f --recurse-submodules $BRANCH >> $LOG_FILE 2>&1

echo "- Build monorepo (contract artifacts, migrations, + all dependencies)"
cd ../..

# Using `yarn reset` to remove node_modules before re-installing using the node version of 
# the previous release branch. This is useful when node version between branches are incompatible

# build entire monorepo to account for any required dependencies.
yarn install >> $LOG_FILE
# in release v8 and earlier, @celo/contractkit automatically uses set RELEASE_TAG
# when building, which fails if this differs from `package/protocol`'s build directory.
RELEASE_TAG="" yarn build >> $LOG_FILE
cd packages/protocol

echo "- Create local network"
# if [ -z "$GRANTS_FILE" ]; then
#   yarn devchain generate-tar "$PWD/devchain.tar.gz" >> $LOG_FILE
# else
#   yarn devchain generate-tar "$PWD/devchain.tar.gz" --release_gold_contracts $GRANTS_FILE >> $LOG_FILE
# fi
# rm -rf $BUILD_DIR && mkdir -p $BUILD_DIR
# mv build/contracts* $BUILD_DIR
# mv "$PWD/devchain.tar.gz" $BUILD_DIR/.

echo "IN ORIGINAL FILE"

# Forcefully remove all submodules and reinitialize them after checkout
git submodule deinit -f --all
while IFS= read -r line; do
    # Extract the submodule path which is the second part of the line
    submodule_path=$(echo "$line" | cut -d ' ' -f 2)
    # Remove the submodule directory
    rm -rf "$submodule_path"
done < <(git config --file .gitmodules --get-regexp path)
rm -rf .git/modules/*
git checkout -f --recurse-submodules -
git submodule update --init --recursive
