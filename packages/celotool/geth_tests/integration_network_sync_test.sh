#!/usr/bin/env bash
set -euo pipefail

# Usage: geth_tests/integration_network_sync_test.sh [network name] [sync mode]
# Default to testing the integration network
NETWORK_NAME=${1:-"integration"}
# Default to testing the full sync mode
SYNCMODE=${2:-"full"}

echo "This test will start a local node in '${SYNCMODE}' sync mode which will connect to network '${NETWORK_NAME}' and verify that syncing works"

echo "Setting constants..."
# For now, the script assumes that it runs from a sub-dir of sub-dir of monorepo directory.
CELO_MONOREPO_DIR="${PWD}/../.."

DATA_DIR="/tmp/tmp1"
GENESIS_FILE_PATH="/tmp/genesis_ibft.json"

GETH_BINARY="${GETH_DIR}/build/bin/geth --datadir ${DATA_DIR}"
CELOTOOLJS="${CELO_MONOREPO_DIR}/packages/celotool/bin/celotooljs.sh"

${CELOTOOLJS} generate genesis-file --celo-env ${NETWORK_NAME} > ${GENESIS_FILE_PATH}
${CELOTOOLJS} geth build --geth-dir ${GETH_DIR}

rm -rf ${DATA_DIR}
${GETH_BINARY} init ${GENESIS_FILE_PATH} 1>/dev/null 2>/dev/null
curl "https://www.googleapis.com/storage/v1/b/static_nodes/o/${NETWORK_NAME}?alt=media" --output ${DATA_DIR}/static-nodes.json

echo "Running geth in the background..."
# Run geth in the background
${CELOTOOLJS} geth run \
    --geth-dir ${GETH_DIR} \
    --data-dir ${DATA_DIR} \
    --sync-mode ${SYNCMODE} 1>/tmp/geth_stdout 2>/tmp/geth_stderr &
# let it sync
sleep 20
latestBlock=$(${GETH_BINARY} attach -exec eth.blockNumber)
echo "Latest block number is ${latestBlock}"

pkill -9 geth

if [ "$latestBlock" -eq "0" ]; then
    echo "Sync is not working with network '${NETWORK_NAME}' in mode '${SYNCMODE}', see logs in /tmp/geth_stdout"
    exit 1
fi
