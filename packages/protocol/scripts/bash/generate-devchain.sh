#!/usr/bin/env bash
set -euo pipefail

source ./scripts/bash/release-lib.sh

# Generates a local network of a target git ref
#
# Flags:
# -b: Branch containing smart contracts that currently comprise the Celo protocol
# -l: Path to a file to which logs should be appended

BRANCH=""
LOG_FILE="/dev/null"
GRANTS_FLAG=""

while getopts 'b:l:g:' flag; do
  case "${flag}" in
    b) BRANCH="${OPTARG}" ;;
    l) LOG_FILE="${OPTARG}" ;;
    g) GRANTS_FLAG="--release_gold_contracts ${OPTARG}";;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$BRANCH" ] && echo "Need to set the branch via the -b flag" && exit 1;

CURR_BRANCH=`git symbolic-ref -q HEAD --short`

checkout_tag $BRANCH $LOG_FILE contracts
checkout_tag $BRANCH $LOG_FILE migrations
# build migrations
yarn build:ts

echo "- Create local network"
yarn devchain generate-tar "build/$BRANCH/devchain.tar.gz" $GRANTS_FLAG >> $LOG_FILE

checkout_tag $CURR_BRANCH $LOG_FILE contracts
checkout_tag $CURR_BRANCH $LOG_FILE migrations
