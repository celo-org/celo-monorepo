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
TARGET_DIR=""

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

REMOTE_URL=$(git remote get-url origin)

TARGET_DIR_RELATIVE=$(echo build/$(echo $BRANCH | sed -e 's/\//_/g'));
rm -rf $TARGET_DIR_RELATIVE && mkdir -p $TARGET_DIR_RELATIVE
TARGET_DIR=$(cd "$TARGET_DIR_RELATIVE" && pwd || echo "Error: Failed to find directory")

echo TARGET_DIR: $TARGET_DIR
echo BUILD_DIR: $BUILD_DIR

# Create temporary directory
TMP_DIR=$(mktemp -d)
echo "Using temporary directory $TMP_DIR"

[ -z "$BUILD_DIR" ] && BUILD_DIR=$(echo "$TMP_DIR/build/$(echo $BRANCH | sed -e 's/\//_/g')");

echo "- Checkout source code at $BRANCH" and remote url $REMOTE_URL
# Clone the repository into the temporary directory
git clone $REMOTE_URL "$TMP_DIR/repo" --branch "$BRANCH" --single-branch
cd "$TMP_DIR/repo"

# Redirection of logs
exec 2>>$LOG_FILE >> $LOG_FILE

echo "- Build monorepo (contract artifacts, migrations, + all dependencies)"

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


mv build/contracts $TARGET_DIR
mv "$PWD/devchain.tar.gz" $TARGET_DIR/.

# Clean up if necessary
rm -rf "$TMP_DIR"
