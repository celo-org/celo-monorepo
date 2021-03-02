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

while getopts 'a:b:r:l:' flag; do
  case "${flag}" in
    a) OLD_BRANCH="${OPTARG}" ;;
    b) NEW_BRANCH="${OPTARG}" ;;
    r) REPORT="${OPTARG}" ;;
    l) LOG_FILE="${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$OLD_BRANCH" ] && echo "Need to set the old branch via the -a flag" && exit 1;
[ -z "$NEW_BRANCH" ] && echo "Need to set the new branch via the -b flag" && exit 1;

REPORT_FLAG=""
if [ ! -z "$REPORT" ]; then
  REPORT_FLAG="--output_file "$REPORT
fi

# fetch tags
git fetch origin +'refs/tags/celo-core-contracts*:refs/tags/celo-core-contracts*' >> $LOG_FILE

source scripts/bash/release-lib.sh

build_tag $OLD_BRANCH
BUILD_DIR_1=$BUILD_DIR
build_tag $NEW_BRANCH
BUILD_DIR_2=$BUILD_DIR

# Exclude test contracts, mock contracts, contract interfaces, Proxy contracts, inlined libraries,
# MultiSig contracts, and the ReleaseGold contract.
CONTRACT_EXCLUSION_REGEX=".*Test|Mock.*|I[A-Z].*|.*Proxy|.*LinkedList.*|MultiSig.*|ReleaseGold|MetaTransactionWallet|SlasherUtil|FixidityLib|Signatures|Proposals|UsingPrecompiles"
yarn ts-node scripts/check-backward.ts sem_check --old_contracts $BUILD_DIR_1/contracts --new_contracts $BUILD_DIR_2/contracts --exclude $CONTRACT_EXCLUSION_REGEX $REPORT_FLAG
