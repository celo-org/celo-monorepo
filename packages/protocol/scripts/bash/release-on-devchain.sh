#!/usr/bin/env bash
set -euo pipefail

# Simulates a release of the current contracts against a target git ref on a local network
#
# Flags:
# -b: Branch containing smart contracts that currently comprise the Celo protocol
# -l: Path to a file to which logs should be appended

BRANCH=""
NETWORK=""
FORNO=""
LOG_FILE="/dev/null"

while getopts 'b:rl:' flag; do
  case "${flag}" in
    b) BRANCH="${OPTARG}" ;;
    l) LOG_FILE="${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$BRANCH" ] && echo "Need to set the branch via the -b flag" && exit 1;

echo "- Checkout source code at $BRANCH"
BUILD_DIR=$(echo build/$(echo $BRANCH | sed -e 's/\//_/g'))
git fetch --all --tags 2>$LOG_FILE >> $LOG_FILE
git checkout $BRANCH 2>$LOG_FILE >> $LOG_FILE
echo "- Build contract artifacts"
rm -rf build/contracts
yarn build >> $LOG_FILE

# TODO: Move to yarn build:sol after the next contract release.
echo "- Create local network"
yarn devchain generate-tar devchain.tar.gz >> $LOG_FILE
rm -rf $BUILD_DIR && mkdir -p $BUILD_DIR
mv build/contracts $BUILD_DIR

echo "- Run local network"
# yarn devchain generate-tar devchain.tar.gz
yarn devchain run-tar devchain.tar.gz >> $LOG_FILE &
GANACHE_PID=$!
echo "Network started with PID $GANACHE_PID, if exit 1, you will need to manually stop the process"

echo "Waiting for ganache to start"
# sleep 20

# Move back to branch from which we started
git checkout -
yarn build >> $LOG_FILE
echo "- Verify bytecode of the network"
yarn run truffle exec ./scripts/truffle/verify-bytecode.js --network development --build_artifacts $BUILD_DIR/contracts

echo "- Check versions of current branch"
# From check-versions.sh
CONTRACT_EXCLUSION_REGEX=".*Test|Mock.*|I[A-Z].*|.*Proxy|.*LinkedList.*|MultiSig.*|ReleaseGold|MetaTransactionWallet|SlasherUtil|FixidityLib|Signatures|Proposals|UsingPrecompiles"
yarn ts-node scripts/check-backward.ts sem_check --old_contracts $BUILD_DIR/contracts --new_contracts build/contracts --exclude $CONTRACT_EXCLUSION_REGEX --output_file report.json

# From make-release.sh
echo "- Deploy release of current branch"
yarn truffle exec --network development ./scripts/truffle/make-release.js --build_directory build/ --report report.json --proposal proposal.json --initialize_data example-initialize-data.json

# From verify-release.sh
echo "- Verify release"
yarn truffle exec --network development ./scripts/truffle/verify-bytecode.js --build_artifacts build/contracts --proposal ../../proposal.json

kill $GANACHE_PID
