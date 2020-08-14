#!/usr/bin/env bash
set -euo pipefail

# Checks that the contract version numbers in a provided branch are as expected given
# a released branch.
#
# Flags:
# -o: Old branch containing smart contracts, which has likely been released.
# -n: New branch containing smart contracts, on which version numbers may be updated.

BRANCH_1=""
BRANCH_2=""

while getopts 'o:n:' flag; do
  case "${flag}" in
    o) BRANCH_1="${OPTARG}" ;;
    n) BRANCH_2="${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$BRANCH_1" ] && echo "Need to set the first branch via the -n flag" && exit 1;
[ -z "$BRANCH_2" ] && echo "Need to set the second branch via the -o flag" && exit 1;

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

# Exclude test contracts, mock contracts, contract interfaces, Proxy contracts, MultiSig contracts,
# and the ReleaseGold contract. 
CONTRACT_EXCLUSION_REGEX=".*Test|Mock.*|I[A-Z].*|.*Proxy|MultiSig.*|ReleaseGold"
yarn ts-node scripts/check-backward.ts sem_check -o $BUILD_DIR_1/contracts -n $BUILD_DIR_2/contracts -e $CONTRACT_EXCLUSION_REGEX
