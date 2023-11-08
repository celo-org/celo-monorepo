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

# Remember the original working directory
ORIG_PWD=$(pwd)

[ -z "$BUILD_DIR_ORIG" ] && BUILD_DIR_ORIG=$(echo build/$(echo $BRANCH | sed -e 's/\//_/g'));

# Create temporary directory
TMP_DIR=$(mktemp -d)
echo "Using temporary directory $TMP_DIR"

[ -z "$BUILD_DIR" ] && BUILD_DIR=$(echo "$TMP_DIR/build/$(echo $BRANCH | sed -e 's/\//_/g')");

echo "- Checkout source code at $BRANCH"
# Clone the repository into the temporary directory
git clone . "$TMP_DIR/repo" --branch "$BRANCH" --single-branch
cd "$TMP_DIR/repo"

# Redirection of logs
exec 2>>$LOG_FILE >> $LOG_FILE

echo "- Build monorepo (contract artifacts, migrations, + all dependencies)"
# Assuming we need to go up two directories to get to the root of the monorepo
cd ../../..

# Here, replace the 'yarn' commands as necessary to work within the temp directory structure
yarn run reset
yarn install
yarn run clean
RELEASE_TAG="" yarn build
cd packages/protocol

echo "- Create local network"
if [ -z "$GRANTS_FILE" ]; then
  yarn devchain generate-tar "$BUILD_DIR/devchain.tar.gz"
else
  yarn devchain generate-tar "$BUILD_DIR/devchain.tar.gz" --release_gold_contracts "$GRANTS_FILE"
fi

cd "$ORIG_PWD"

rm -rf $BUILD_DIR_ORIG && mkdir -p $BUILD_DIR_ORIG
mv build/contracts $BUILD_DIR_ORIG
mv "$PWD/devchain.tar.gz" $BUILD_DIR_ORIG/.

# Clean up if necessary
# rm -rf "$TMP_DIR"
