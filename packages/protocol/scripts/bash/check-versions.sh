#!/usr/bin/env bash
set -euo pipefail

# Checks that the contract version numbers in a provided branch are as expected given
# a released branch.
#
# Flags:
# -a: Old branch containing smart contracts, which has likely been released.
# -b: New branch containing smart contracts, on which version numbers may be updated.
# -r: Path that the contract compatibility report should be written to.

OLD_BRANCH=""
NEW_BRANCH=""
REPORT=""

while getopts 'a:b:r:' flag; do
  case "${flag}" in
    a) OLD_BRANCH="${OPTARG}" ;;
    b) NEW_BRANCH="${OPTARG}" ;;
    r) REPORT="${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$OLD_BRANCH" ] && echo "Need to set the old branch via the -a flag" && exit 1;
[ -z "$NEW_BRANCH" ] && echo "Need to set the new branch via the -b flag" && exit 1;

BUILD_DIR_1=$(echo build/$(echo $OLD_BRANCH | sed -e 's/\//_/g'))
git checkout $OLD_BRANCH
rm -rf build/contracts
# TODO: Move to yarn build:sol after the next contract release.
yarn build
rm -rf $BUILD_DIR_1 && mkdir -p $BUILD_DIR_1
mv build/contracts $BUILD_DIR_1


BUILD_DIR_2=$(echo build/$(echo $NEW_BRANCH | sed -e 's/\//_/g'))
git checkout $NEW_BRANCH
rm -rf build/contracts
yarn build:sol
rm -rf $BUILD_DIR_2 && mkdir -p $BUILD_DIR_2
mv build/contracts $BUILD_DIR_2

REPORT_FLAG=""
if [ ! -z "$REPORT" ]; then
  REPORT_FLAG="--output_file "$REPORT
fi

# Exclude test contracts, mock contracts, contract interfaces, Proxy contracts, inlined libraries,
# MultiSig contracts, and the ReleaseGold contract.
CONTRACT_EXCLUSION_REGEX=".*Test|Mock.*|I[A-Z].*|.*Proxy|LinkedList|SortedLinkedList|SortedLinkedListWithMedian|MultiSig.*|ReleaseGold"
yarn ts-node scripts/check-backward.ts sem_check --old_contracts $BUILD_DIR_1/contracts --new_contracts $BUILD_DIR_2/contracts --exclude $CONTRACT_EXCLUSION_REGEX $REPORT_FLAG
