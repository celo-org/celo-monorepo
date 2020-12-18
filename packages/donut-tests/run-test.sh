#!/usr/bin/env bash
set -euo pipefail

# This test starts a standalone Geth node and runs transactions on it.

# For testing a particular branch of Geth repo (usually, on Circle CI)
# Usage: ci_test_attestations.sh checkout <branch_of_geth_repo_to_test>
# For testing the local Geth dir (usually, for manual testing)
# Usage: ci_test_attestations.sh local <location_of_local_geth_dir>

export TS_NODE_FILES=true
if [ "${1}" == "checkout" ]; then
    # Test master by default.
    BRANCH_TO_TEST=${2:-"master"}
    echo "Checking out geth at branch ${BRANCH_TO_TEST}..."
    rm -rf /tmp/geth
    git clone https://github.com/celo-org/celo-blockchain -b ${BRANCH_TO_TEST} /tmp/geth
    pushd /tmp/geth
    make
    ./build/bin/geth --verbosity 1 --dev --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,personal,istanbul --nousb --rpccorsdomain '*' --allow-insecure-unlock &
    popd
    npx buidler test --config buidler.config.5.js
    killall geth
elif [ "${1}" == "local" ]; then
    export GETH_DIR="${2}"
    echo "Testing using local geth dir ${GETH_DIR}..."
    pushd ${GETH_DIR}
    make && ./build/bin/geth --dev --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,personal,istanbul --nousb --rpccorsdomain '*' --allow-insecure-unlock
    popd
    npx buidler test --config buidler.config.5.js
    killall geth
fi
