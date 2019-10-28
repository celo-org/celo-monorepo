#!/usr/bin/env bash
set -euo pipefail

# This test starts a local node which tries to sync with remotely running nodes and
# verifies that the sync works.

# For testing a particular commit hash of Geth repo (usually, on Circle CI)
# Usage: ci_test_sync_with_network.sh checkout <commit_hash_of_geth_repo_to_test>
# For testing the local Geth dir (usually, for manual testing)
# Usage: ci_test_sync_with_network.sh local <location_of_local_geth_dir>

if [ "${1}" == "checkout" ]; then
    export GETH_DIR="/tmp/geth"
    # Test master by default.
    COMMIT_HASH_TO_TEST=${2:-"master"}
    echo "Checking out geth at commit hash ${COMMIT_HASH_TO_TEST}..."
    # Shallow clone up to depth of 20. If the COMMIT_HASH_TO_TEST is not within the last 20 hashes then
    # this test will fail. This will force someone to keep updating the COMMIT_HASH_TO_TEST we are
    # testing. Clone up to 20 takes about 4 seconds on my machine and a full clone is
    # about 60 seconds as of May 20, 2019. The difference will only grow over time.
    git clone --depth 20 https://github.com/celo-org/celo-blockchain.git ${GETH_DIR} && cd ${GETH_DIR} && git checkout ${COMMIT_HASH_TO_TEST} && cd -
elif [ "${1}" == "local" ]; then
    export GETH_DIR="${2}"
    echo "Testing using local geth dir ${GETH_DIR}..."
fi

# For now, the script assumes that it runs from a sub-dir of sub-dir of monorepo directory.
CELO_MONOREPO_DIR="${PWD}/../.."
# Assume that the logs are in /tmp/geth_stdout
GETH_LOG_FILE=/tmp/geth_stdout

# usage: test_ultralight_sync <network_name>
test_ultralight_sync () {
    NETWORK_NAME=$1
    echo "Testing ultralight sync with '${NETWORK_NAME}' network"
    # Run the sync in ultralight mode
    geth_tests/network_sync_test.sh ${NETWORK_NAME} ultralight
    # Verify what happened by reading the logs.
    ${CELO_MONOREPO_DIR}/node_modules/.bin/mocha -r ts-node/register ${CELO_MONOREPO_DIR}/packages/celotool/src/e2e-tests/verify_ultralight_geth_logs.ts --network "${NETWORK_NAME}" --gethlogfile ${GETH_LOG_FILE}
}

# Some code in celotool requires this file to contain the MNEMONOIC.
# The value of MNEMONOIC does not matter.
if [[ ! -e ${CELO_MONOREPO_DIR}/.env.mnemonic ]]; then
    echo "MNEMONOIC=anything random" > ${CELO_MONOREPO_DIR}/.env.mnemonic
fi

# Test syncing
export NETWORK_NAME="integration"
# Add an extra echo at the end to dump a new line, this makes the results a bit more readable.
geth_tests/network_sync_test.sh ${NETWORK_NAME} full && echo
# This is broken, I am not sure why, therefore, commented for now.
# geth_tests/network_sync_test.sh ${NETWORK_NAME} fast && echo
geth_tests/network_sync_test.sh ${NETWORK_NAME} light && echo
test_ultralight_sync ${NETWORK_NAME} && echo

export NETWORK_NAME="alfajoresstaging"
geth_tests/network_sync_test.sh ${NETWORK_NAME} full && echo
# This is broken, I am not sure why, therefore, commented for now.
# geth_tests/network_sync_test.sh ${NETWORK_NAME} fast && echo
geth_tests/network_sync_test.sh ${NETWORK_NAME} light && echo
test_ultralight_sync ${NETWORK_NAME} && echo
