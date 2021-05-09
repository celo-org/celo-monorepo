#!/usr/bin/env bash
set -euo pipefail

source ./scripts/bash/utils.sh

# Simulates a release of the current contracts against a target git ref on a local network
#
# Flags:
# -b: Branch containing smart contracts that currently comprise the Celo protocol.
# -d: Devchain directory containing current network archive.
# -l: Path to a file to which logs should be appended

BRANCH=""
DEVCHAIN_DIR=""
LOG_FILE="/dev/null"

while getopts 'b:l:d:' flag; do
  case "${flag}" in
    b) BRANCH="${OPTARG}" ;;
    l) LOG_FILE="${OPTARG}" ;;
    d) DEVCHAIN_DIR="${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$BRANCH" ] && echo "Need to set the branch via the -b flag" && exit 1;
[ -z "$DEVCHAIN_DIR" ] && echo "Need to set the devchain build dir via the -d flag" && exit 1;

# build previous release branch contracts (sets $BUILD_DIR)
source scripts/bash/release-lib.sh
build_tag $BRANCH $LOG_FILE

echo "- Run local network"
startInBgAndWaitForString 'Ganache STARTED' yarn devchain run-tar $DEVCHAIN_DIR/devchain.tar.gz >> $LOG_FILE

GANACHE_PID=
if command -v lsof; then
    GANACHE_PID=`lsof -i tcp:8545 | tail -n 1 | awk '{print $2}'`
    echo "Network started with PID $GANACHE_PID, if exit 1, you will need to manually stop the process"
fi

echo "- Verify bytecode of the network"
yarn run truffle exec ./scripts/truffle/verify-bytecode.js --network development --build_artifacts $BUILD_DIR/contracts

echo "- Check versions of current branch"
# From check-versions.sh
CONTRACT_EXCLUSION_REGEX=".*Test|Mock.*|I[A-Z].*|.*Proxy|.*LinkedList.*|MultiSig.*|ReleaseGold|MetaTransactionWallet|SlasherUtil|FixidityLib|Signatures|Proposals|UsingPrecompiles"
yarn ts-node scripts/check-backward.ts sem_check --old_contracts $BUILD_DIR/contracts --new_contracts build/contracts --exclude $CONTRACT_EXCLUSION_REGEX --output_file report.json

# From make-release.sh
echo "- Deploy release of current branch"
INITIALIZATION_FILE=`ls -t releaseData/initializationData/* | head -n 1 | xargs realpath`
yarn truffle exec --network development ./scripts/truffle/make-release.js --build_directory build/ --report report.json --proposal proposal.json --libraries libraries.json --initialize_data $INITIALIZATION_FILE

# From verify-release.sh
echo "- Verify release"
yarn truffle exec --network development ./scripts/truffle/verify-bytecode.js --build_artifacts build/contracts --proposal ../../proposal.json --initialize_data $INITIALIZATION_FILE

if [[ -n $GANACHE_PID ]]; then
    kill $GANACHE_PID
fi
