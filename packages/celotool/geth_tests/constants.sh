#!/usr/bin/env bash
set -euo pipefail

echo "Setting constants..."
# For now, the script assumes that it runs from a sub-dir of sub-dir of monorepo directory.
CELO_MONOREPO_DIR="${PWD}/../.."

DATA_DIR="/tmp/tmp2"
export GENESIS_FILE_PATH="/tmp/genesis_ibft_1.json"

export gethBinary="${GETH_DIR}/build/bin/geth --datadir=${DATA_DIR}"

# There is a ".env.integrationtesting" file in the root of celo-monorepo which defines the config
# of this network.
export NETWORK_NAME="integrationtesting"
SYNCMODE="full"

# Taken from .env.integrationtesting
mnemonic="jazz ripple brown cloth door bridge pen danger deer thumb cable prepare negative library vast"
CELOTOOLJS="${CELO_MONOREPO_DIR}/packages/celotool/bin/celotooljs.sh"
# Miner's address
ACCOUNT_0_PRIVATE_KEY=$(${CELOTOOLJS} generate bip32 --accountType validator --index 0 --mnemonic "${mnemonic}")
export ACCOUNT_0="$(${CELOTOOLJS} generate account-address --private-key ${ACCOUNT_0_PRIVATE_KEY})"

ACCOUNT_1_PRIVATE_KEY=$(${CELOTOOLJS} generate bip32 --accountType validator --index 1 --mnemonic "${mnemonic}")
export ACCOUNT_1="$(${CELOTOOLJS} generate account-address --private-key ${ACCOUNT_1_PRIVATE_KEY})"

echo "Account 0 private key is ${ACCOUNT_0_PRIVATE_KEY}"
echo "Account 1 private key is ${ACCOUNT_1_PRIVATE_KEY}"
echo "Account 0 is ${ACCOUNT_0}"
echo "Account 1 is ${ACCOUNT_1}"

# A random account
export ACCOUNT_2="0x047439e30c3b771f5fba75be293c91d32c306a8b"
export GAS_PRICE=999

# Now override the variable CELOTOOLJS and add more variables to it.
export CELOTOOLJS="${CELO_MONOREPO_DIR}/packages/celotool/bin/celotooljs.sh \
--celo-env=${NETWORK_NAME} \
--geth-dir=${GETH_DIR} \
--data-dir=${DATA_DIR} \
--sync-mode=${SYNCMODE} \
--mining=true \
--minerGasPrice=${GAS_PRICE} \
--miner-address=${ACCOUNT_0} \
--genesis=${GENESIS_FILE_PATH} \
--nodekeyhex=${ACCOUNT_0_PRIVATE_KEY}"  # Without explict node key, transactions will fail with "unauthorized address" error
echo "Finished setting constants"
