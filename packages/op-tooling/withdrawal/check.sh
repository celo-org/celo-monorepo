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
WITHDRAWAL_HASH=${WITHDRAWAL_HASH:-}; [ -z "${WITHDRAWAL_HASH:-}" ] && echo "Need to set the WITHDRAWAL_HASH via env" && exit 1;
PROOF_SUBMITTER=${PROOF_SUBMITTER:-}; [ -z "${PROOF_SUBMITTER:-}" ] && echo "Need to set the PROOF_SUBMITTER via env" && exit 1;

# Optional environment variables
L1_RPC_URL=${RPC_URL:-}

# Optionally required environment variables
if [ -z "${L1_RPC_URL:-}" ]; then
  ALCHEMY_KEY=${ALCHEMY_KEY:-}; [ -z "${ALCHEMY_KEY:-}" ] && echo "Need to specify full RPC_URL or to set the ALCHEMY_KEY via env" && exit 1;
  L1_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/$ALCHEMY_KEY
fi

# Reverts with reason if something is wrong with withdrawal (not proven, not initiated, not ready for claim etc.)
cast call $L1_OPTIMISM_PORTAL \
  "checkWithdrawal(bytes32,address)" \
  $WITHDRAWAL_HASH \
  $PROOF_SUBMITTER \
  --rpc-url $L1_RPC_URL
