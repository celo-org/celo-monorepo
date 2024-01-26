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


REMOTE_URL=$(git remote get-url origin)


# Create temporary directory
TMP_DIR=$(mktemp -d)
echo "Using temporary directory $TMP_DIR"

[ -z "$BUILD_DIR" ] && BUILD_DIR=$(echo "build/$(echo $BRANCH | sed -e 's/\//_/g')");

echo "Using build directory $BUILD_DIR"
rm -rf $BUILD_DIR && mkdir -p $BUILD_DIR
BUILD_DIR_ABOSLUTE=$(cd "$BUILD_DIR" && pwd || echo "Error: Failed to find directory")
echo "ABSOLUTE BUILD DIR: $BUILD_DIR_ABOSLUTE"


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
  yarn devchain generate-tar "$PWD/devchain.tar.gz"
else
  yarn devchain generate-tar "$PWD/devchain.tar.gz" --release_gold_contracts "$GRANTS_FILE"
fi

echo "moving contracts from build/contracts to $BUILD_DIR_ABOSLUTE"
mv build/contracts $BUILD_DIR_ABOSLUTE
echo "moving $PWD/devchain.tar.gz to $BUILD_DIR_ABOSLUTE"
mv "$PWD/devchain.tar.gz" $BUILD_DIR_ABOSLUTE/.

echo "removing tmp directory $TMP_DIR"
rm -rf "$TMP_DIR"
