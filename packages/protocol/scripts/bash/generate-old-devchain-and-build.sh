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

while getopts ':b:rl:d:' flag; do
  case "${flag}" in
    b) BRANCH="${OPTARG}" ;;
    l) LOG_FILE="${OPTARG}" ;;
    d) BUILD_DIR="${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$BRANCH" ] && echo "Need to set the branch via the -b flag" && exit 1;
[ -z "$BUILD_DIR" ] && BUILD_DIR=$(echo build/$(echo $BRANCH | sed -e 's/\//_/g'));

source scripts/bash/release-lib.sh
build_tag $BRANCH

# TODO: Move to yarn build:sol after the next contract release.
echo "- Create local network"
yarn devchain generate-tar "$PWD/devchain.tar.gz" >> $LOG_FILE
rm -rf $BUILD_DIR && mkdir -p $BUILD_DIR
mv build/contracts $BUILD_DIR
mv "$PWD/devchain.tar.gz" $BUILD_DIR/.
