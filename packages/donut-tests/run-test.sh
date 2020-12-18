#!/usr/bin/env bash
set -euo pipefail

# This test starts a standalone Geth node and runs transactions on it.

if [ "${1}" == "checkout" ]; then
    # Test master by default.
    BRANCH_TO_TEST=${2:-"master"}
    echo "Checking out geth at branch ${BRANCH_TO_TEST}..."
    rm -rf /tmp/geth
    git clone https://github.com/mrsmkl/celo-bls-go -b test /tmp/celo-bls-go
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
