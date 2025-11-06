#!/bin/bash
set -euo pipefail

# Constants
SYSTEM_CONFIG=0x760a5f022c9940f4a074e0030be682f560d29818
OPTIMISM_PORTAL=0x44ae3d41a335a7d05eb533029917aad35662dcc2

# Required environment variables
RECIPIENT=${RECIPIENT:-}; [ -z "${RECIPIENT:-}" ] && echo "Need to set the RECIPIENT via env" && exit 1;
VALUE=${VALUE:-}; [ -z "${VALUE:-}" ] && echo "Need to set the VALUE via env" && exit 1;
PK=${PK:-}; [ -z "${PK:-}" ] && echo "Need to set the PK via env" && exit 1;
L1_RPC_URL=${L1_RPC_URL:-}; [ -z "${L1_RPC_URL:-}" ] && echo "Need to set the L1_RPC_URL via env" && exit 1;

# Optional environment variables
GAS_LIMIT=${GAS_LIMIT:-100000}
IS_CREATION=${IS_CREATION:-false}
DATA=${DATA:-"0x00"}

# Retrieve gas paying token on L1
echo "1. Retrieving gas paying token on L1..."
CELO_L1=$(cast call $SYSTEM_CONFIG "gasPayingToken()(address,uint8)" --rpc-url $L1_RPC_URL)
read -r CELO_L1 <<< "$CELO_L1"
echo "  >>> Gas paying token on L1: $CELO_L1"

# Give approval on L1
echo "2. Giving approval on L1..."
cast send $CELO_L1 \
  "approve(address,uint256)" \
  $OPTIMISM_PORTAL \
  $VALUE \
  --private-key $PK \
  --rpc-url $L1_RPC_URL
echo "  >>> Approval transaction sent."

# Perform deposit on L1
echo "3. Performing deposit on L1..."
cast send $OPTIMISM_PORTAL \
  "depositERC20Transaction(address,uint256,uint256,uint64,bool,bytes)" \
  $RECIPIENT \
  $VALUE \
  $VALUE \
  $GAS_LIMIT \
  $IS_CREATION \
  $DATA \
  --private-key $PK \
  --rpc-url $L1_RPC_URL
echo "  >>> Deposit transaction sent."
