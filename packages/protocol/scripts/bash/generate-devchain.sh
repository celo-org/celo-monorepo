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

while getopts ':b:rl:d:g:' flag; do
  case "${flag}" in
    b) BRANCH="${OPTARG}" ;;
    l) LOG_FILE="${OPTARG}" ;;
    g) GRANTS_FLAG="--release_gold_contracts ${OPTARG}";;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$BRANCH" ] && echo "Need to set the branch via the -b flag" && exit 1;

checkout_tag $BRANCH $LOG_FILE

echo "- Create local network"
yarn devchain generate-tar "build/$BRANCH/devchain.tar.gz" $GRANTS_FLAG >> $LOG_FILE

checkout_tag - $LOG_FILE
