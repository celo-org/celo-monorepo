#!/usr/bin/env bash
set -euo pipefail

# Checks that Solidity sources on a given branch correspond to bytecodes
# deployed to a Celo system deployed to the given network.
#
# Flags:
# -b: Branch containing smart contracts that currently comprise the Celo protocol
# -n: The network to check
# -f: Boolean flag to indicate if the Forno service should be used to connect to
#     the network
# -l: Path to a file to which logs should be appended

BRANCH=""
NETWORK=""
FORNO=""
LOG_FILE="/tmp/celo-verify-deployed.log"

while getopts 'b:n:fl:' flag; do
  case "${flag}" in
    b) BRANCH="${OPTARG}" ;;
    n) NETWORK="${OPTARG}" ;;
    f) FORNO="--forno" ;;
    l) LOG_FILE="${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$BRANCH" ] && echo "Need to set the branch via the -b flag" && exit 1;
[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;

echo "- Checkout source code at $BRANCH"
BUILD_DIR=$(echo build/$(echo $BRANCH | sed -e 's/\//_/g'))
git fetch origin +'refs/tags/celo-core-contracts*:refs/tags/celo-core-contracts*' 2>>$LOG_FILE >> $LOG_FILE
git checkout $BRANCH 2>>$LOG_FILE >> $LOG_FILE
echo "- Build contract artifacts"
rm -rf build/contracts
yarn build:sol >> $LOG_FILE
rm -rf $BUILD_DIR && mkdir -p $BUILD_DIR
mv build/contracts $BUILD_DIR
cp lib/registry-utils.ts $BUILD_DIR/


# Move back to branch from which we started
echo "- Return to original git commit"
git checkout - >> $LOG_FILE

cp $BUILD_DIR/registry-utils.ts lib/

# Hack since v1 did not yet expose celoRegistryAddress
if ! cat lib/registry-utils.ts | grep -q "celoRegistryAddress"; then
  echo "export const celoRegistryAddress = '0x000000000000000000000000000000000000ce10'" >> lib/registry-utils.ts
fi

echo "- Build verification script"
yarn build >> $LOG_FILE

echo "- Run verification script"
yarn run truffle exec ./scripts/truffle/verify-bytecode.js --network $NETWORK --build_artifacts $BUILD_DIR/contracts $FORNO

git checkout lib/registry-utils.ts
