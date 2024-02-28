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

BRANCH=""
NEW_BRANCH=""
REPORT=""
LOG_FILE="/tmp/celo-check-versions.log"

while getopts 'a:b:r:l:i' flag; do
  case "${flag}" in
    a) BRANCH="${OPTARG}" ;;
    b) NEW_BRANCH="${OPTARG}" ;;
    r) REPORT="${OPTARG}" ;;
    l) LOG_FILE="${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$BRANCH" ] && echo "Need to set the old branch via the -a flag" && exit 1;
[ -z "$NEW_BRANCH" ] && echo "Need to set the new branch via the -b flag" && exit 1;

# CONTRACT_EXCLUSION_REGEX imported from here
source scripts/bash/contract-exclusion-regex.sh

REPORT_FLAG=""
if [ ! -z "$REPORT" ]; then
  REPORT_FLAG="--output_file "$REPORT
fi

source scripts/bash/release-lib.sh

build_tag $BRANCH $LOG_FILE
BRANCH_BUILD_DIR=$BUILD_DIR
build_tag $NEW_BRANCH $LOG_FILE
NEW_BRANCH_BUILD_DIR=$BUILD_DIR

# check-backward script uses migrationsConfig
echo " - Checkout migrationsConfig.js at $NEW_BRANCH"
CURRENT_HASH=`git log -n 1 --oneline | cut -c 1-9`
git checkout $NEW_BRANCH -- migrationsConfig.js

yarn ts-node scripts/check-backward.ts sem_check \
  --old_contracts $BRANCH_BUILD_DIR/contracts \
  --new_contracts $NEW_BRANCH_BUILD_DIR/contracts \
  --exclude $CONTRACT_EXCLUSION_REGEX \
  --new_branch $NEW_BRANCH \
  $REPORT_FLAG

git checkout $CURRENT_HASH -- migrationsConfig.js
