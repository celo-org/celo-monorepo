#!/bin/bash
set -euo pipefail

# Constants
L2_L1_MESSAGE_PASSER=0x4200000000000000000000000000000000000016

# Required environment variables
RECIPIENT=${RECIPIENT:-}; [ -z "${RECIPIENT:-}" ] && echo "Need to set the RECIPIENT via env" && exit 1;
VALUE=${VALUE:-}; [ -z "${VALUE:-}" ] && echo "Need to set the VALUE via env" && exit 1;
PK=${PK:-}; [ -z "${PK:-}" ] && echo "Need to set the PK via env" && exit 1;

# Optional environment variables
GAS_LIMIT=${GAS_LIMIT:-0}
DATA=${DATA:-"0x00"}
L2_RPC_URL=${L2_RPC_URL:-"https://forno.celo-sepolia.celo-testnet.org"}

# Initiation of withdrawal on L2
cast send $L2_L1_MESSAGE_PASSER \
  "initiateWithdrawal(address,uint256,bytes)" \
  $RECIPIENT \
  $GAS_LIMIT \
  $DATA \
  --value $VALUE \
  --private-key $PK \
  --rpc-url $L2_RPC_URL
