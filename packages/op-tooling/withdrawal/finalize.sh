#!/bin/bash
set -euo pipefail

# Determine network
NETWORK=${NETWORK:-"sepolia"}
case $NETWORK in
  alfajores)
    L1_OPTIMISM_PORTAL=0x82527353927d8D069b3B452904c942dA149BA381
    ;;
  baklava)
    L1_OPTIMISM_PORTAL=0x87e9cB54f185a32266689138fbA56F0C994CF50c
    ;;
  sepolia)
    L1_OPTIMISM_PORTAL=0x44ae3d41a335a7d05eb533029917aad35662dcc2
    ;;
  *)
    echo "Unsupported network: $NETWORK"
    exit 1
    ;;
esac

# Required environment variables
WITHDRAWAL_NONCE=${WITHDRAWAL_NONCE:-}; [ -z "${WITHDRAWAL_NONCE:-}" ] && echo "Need to set the WITHDRAWAL_NONCE via env" && exit 1;
SENDER=${SENDER:-}; [ -z "${SENDER:-}" ] && echo "Need to set the SENDER via env" && exit 1;
RECIPIENT=${RECIPIENT:-}; [ -z "${RECIPIENT:-}" ] && echo "Need to set the RECIPIENT via env" && exit 1;
VALUE=${VALUE:-}; [ -z "${VALUE:-}" ] && echo "Need to set the VALUE via env" && exit 1;
PK=${PK:-}; [ -z "${PK:-}" ] && echo "Need to set the PK via env" && exit 1;

# Optional environment variables
GAS_LIMIT=${GAS_LIMIT:-0}
DATA=${DATA:-"0x00"}
L1_RPC_URL=${RPC_URL:-}

# Optionally required environment variables
if [ -z "${L1_RPC_URL:-}" ]; then
  ALCHEMY_KEY=${ALCHEMY_KEY:-}; [ -z "${ALCHEMY_KEY:-}" ] && echo "Need to specify full RPC_URL or to set the ALCHEMY_KEY via env" && exit 1;
  L1_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/$ALCHEMY_KEY
fi

# Finalization & claim of withdrawal on L1
cast send $L1_OPTIMISM_PORTAL \
  "finalizeWithdrawalTransaction((uint256, address, address, uint256, uint256, bytes))" \
  "($WITHDRAWAL_NONCE,$SENDER,$RECIPIENT,$VALUE,$GAS_LIMIT,$DATA)" \
  --private-key $PK \
  --rpc-url $L1_RPC_URL
