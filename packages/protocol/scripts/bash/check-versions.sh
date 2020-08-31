#!/usr/bin/env bash
set -euo pipefail

# Checks that the contract version numbers in a provided branch are as expected given
# a released branch.
#
# Flags:
# -a: Old branch containing smart contracts, which has likely been released.
# -b: New branch containing smart contracts, on which version numbers may be updated.
# -n: The network to deploy to.
# -r: Path that the contract compatibility report should be written to.

BRANCH_1=""
BRANCH_2=""
NETWORK=""
REPORT=""

while getopts 'a:b:n:r:' flag; do
  case "${flag}" in
    a) BRANCH_1="${OPTARG}" ;;
    b) BRANCH_2="${OPTARG}" ;;
    n) NETWORK="${OPTARG}" ;;
    r) REPORT="${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$BRANCH_1" ] && echo "Need to set the first branch via the -a flag" && exit 1;
[ -z "$BRANCH_2" ] && echo "Need to set the second branch via the -b flag" && exit 1;

BUILD_DIR_1=$(echo build/$(echo $BRANCH_1 | sed -e 's/\//_/g'))
git checkout $BRANCH_1
rm -rf build/contracts
# TODO: Move to yarn build:sol after the next contract release.
yarn build
rm -rf $BUILD_DIR_1 && mkdir -p $BUILD_DIR_1
mv build/contracts $BUILD_DIR_1


BUILD_DIR_2=$(echo build/$(echo $BRANCH_2 | sed -e 's/\//_/g'))
git checkout $BRANCH_2
rm -rf build/contracts
yarn build:sol
rm -rf $BUILD_DIR_2 && mkdir -p $BUILD_DIR_2
mv build/contracts $BUILD_DIR_2

REPORT_FLAG=""
if [ ! -z "$REPORT" ]; then
  REPORT_FLAG="-f "$REPORT
fi

# Exclude test contracts, mock contracts, contract interfaces, Proxy contracts, inlined libraries,
# MultiSig contracts, and the ReleaseGold contract.
CONTRACT_EXCLUSION_REGEX=".*Test|Mock.*|I[A-Z].*|.*Proxy|LinkedList|SortedLinkedList|SortedLinkedListWithMedian|MultiSig.*|ReleaseGold"
yarn ts-node scripts/check-backward.ts sem_check -o $BUILD_DIR_1/contracts -n $BUILD_DIR_2/contracts -e $CONTRACT_EXCLUSION_REGEX $REPORT_FLAG
