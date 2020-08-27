#!/usr/bin/env bash
set -euo pipefail

# Checks that the contract version numbers in a provided branch are as expected given
# a released branch.
#
# Flags:
# -a: Old branch containing smart contracts, which has likely been released.
# -b: New branch containing smart contracts, on which version numbers may be updated.
# -n: The network to deploy to.
# -p: Path that the governance proposal should be written to.
# -i: Path to the data needed to initialize contracts.
# -r: Path that the contract compatibility report should be written to.

BRANCH_1=""
BRANCH_2=""
NETWORK=""
REPORT=""

while getopts 'a:b:n:p:i:r:' flag; do
  case "${flag}" in
    a) BRANCH_1="${OPTARG}" ;;
    b) BRANCH_2="${OPTARG}" ;;
    n) NETWORK="${OPTARG}" ;;
    p) PROPOSAL="${OPTARG}" ;;
    i) INITIALIZE_DATA="${OPTARG}" ;;
    r) REPORT="${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$BRANCH_1" ] && echo "Need to set the first branch via the -a flag" && exit 1;
[ -z "$BRANCH_2" ] && echo "Need to set the second branch via the -b flag" && exit 1;
[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;
[ -z "$INITIALIZE_DATA" ] && echo "Need to set the initialization data via the -i flag" && exit 1;
[ -z "$PROPOSAL" ] && echo "Need to set the proposal outfile via the -p flag" && exit 1;
[ -z "$REPORT" ] && echo "Need to set the compatibility report outfile via the -r flag" && exit 1;

yarn check-versions -a $BRANCH_1 -b $BRANCH_2 -r $REPORT
yarn build
yarn run truffle exec ./scripts/truffle/make-release.js --network $NETWORK --build_directory build/ --report $REPORT --proposal $PROPOSAL --initialize_data $INITIALIZE_DATA
