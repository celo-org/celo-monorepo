#!/usr/bin/env bash
set -euo pipefail

source ./scripts/bash/utils.sh

# Simulates a release of the current contracts against a target git ref on a local network
#
# Flags:
# -b: Branch containing smart contracts that currently comprise the Celo protocol
# -l: Path to a file to which logs should be appended

BRANCH=""
DEVCHAIN_DIR=""
RE_BUILD_REPO=""
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

echo "- Run local network"
startInBgAndWaitForString 'Ganache STARTED' yarn devchain run-tar $DEVCHAIN_DIR/devchain.tar.gz >> $LOG_FILE

GANACHE_PID=
if command -v lsof; then
    GANACHE_PID=`lsof -i tcp:8545 | tail -n 1 | awk '{print $2}'`
    echo "Network started with PID $GANACHE_PID, if exit 1, you will need to manually stop the process"
fi

echo "- Verify bytecode of the network"
./scripts/bash/verify-deployed.sh -n development -b $BRANCH -l $LOG_FILE

CURR_BRANCH=`git symbolic-ref -q HEAD --short`

echo "- Check versions of current branch"
# From check-versions.sh
./scripts/bash/check-versions.sh -a $BRANCH -b $CURR_BRANCH -r "report.json" -l $LOG_FILE

INITIALIZATION_FILE=`ls -1 releaseData/initializationData/* | tail -n 1 | xargs realpath`

echo "- Deploy release of current branch"
./scripts/bash/make-release.sh -b $CURR_BRANCH -n development -r "report.json" -p "proposal.json" -i $INITIALIZATION_FILE

# From verify-release.sh
echo "- Verify release"
./scripts/bash/verify-release.sh -b $CURR_BRANCH -n development -p "proposal.json" -i $INITIALIZATION_FILE

if [[ -n $GANACHE_PID ]]; then
    kill $GANACHE_PID
fi
