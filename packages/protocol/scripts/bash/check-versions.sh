#!/usr/bin/env bash
set -euo pipefail

# Checks that the contract version numbers in a provided branch are as expected given
# a released branch.
#
# Flags:
# -a: Old branch containing smart contracts, which has likely been released.
# -b: New branch containing smart contracts, on which version numbers may be updated.
# -r: Path that the contract compatibility report should be written to.
# -l: Path to a file to which logs should be appended

OLD_BRANCH=""
NEW_BRANCH=""
REPORT=""
LOG_FILE="/tmp/celo-check-versions.log"
IGNORE_INITIALIZABLE_V2=""

while getopts 'a:b:r:l:i' flag; do
  case "${flag}" in
    a) OLD_BRANCH="${OPTARG}" ;;
    b) NEW_BRANCH="${OPTARG}" ;;
    r) REPORT="${OPTARG}" ;;
    l) LOG_FILE="${OPTARG}" ;;
    i) IGNORE_INITIALIZABLE_V2="--ignore_initializable_v2" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$OLD_BRANCH" ] && echo "Need to set the old branch via the -a flag" && exit 1;
[ -z "$NEW_BRANCH" ] && echo "Need to set the new branch via the -b flag" && exit 1;

# Exclude test contracts, mock contracts, contract interfaces, Proxy contracts, inlined libraries,
# MultiSig contracts, and the ReleaseGold contract.
CONTRACT_EXCLUSION_REGEX=".*Test|Mock.*|I[A-Z].*|.*Proxy|MultiSig.*|ReleaseGold|SlasherUtil|UsingPrecompiles"

REPORT_FLAG=""
if [ ! -z "$REPORT" ]; then
  REPORT_FLAG="--output_file "$REPORT
fi

# fetch tags
git fetch origin +'refs/tags/celo-core-contracts*:refs/tags/celo-core-contracts*' >> $LOG_FILE

source scripts/bash/release-lib.sh

build_tag $OLD_BRANCH $LOG_FILE
OLD_BRANCH_BUILD_DIR=$BUILD_DIR
build_tag $NEW_BRANCH $LOG_FILE
NEW_BRANCH_BUILD_DIR=$BUILD_DIR

yarn ts-node scripts/check-backward.ts sem_check \
  --old_contracts $OLD_BRANCH_BUILD_DIR/contracts \
  --new_contracts $NEW_BRANCH_BUILD_DIR/contracts \
  --exclude $CONTRACT_EXCLUSION_REGEX \
  $REPORT_FLAG \
  $IGNORE_INITIALIZABLE_V2
