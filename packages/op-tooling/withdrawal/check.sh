#!/bin/bash
set -euo pipefail

# Determine network
NETWORK=${NETWORK:-}; [ -z "${NETWORK:-}" ] && echo "Need to set the NETWORK via env" && exit 1;
case $NETWORK in
  sepolia)
    L1_OPTIMISM_PORTAL=0x44ae3d41a335a7d05eb533029917aad35662dcc2
    ;;
  mainnet)
    L1_OPTIMISM_PORTAL=0xc5c5D157928BDBD2ACf6d0777626b6C75a9EAEDC
    ;;
  *)
    echo "Unsupported network: $NETWORK"
    exit 1
    ;;
esac

# Required environment variables
WITHDRAWAL_HASH=${WITHDRAWAL_HASH:-}; [ -z "${WITHDRAWAL_HASH:-}" ] && echo "Need to set the WITHDRAWAL_HASH via env" && exit 1;
PROOF_SUBMITTER=${PROOF_SUBMITTER:-}; [ -z "${PROOF_SUBMITTER:-}" ] && echo "Need to set the PROOF_SUBMITTER via env" && exit 1;
L1_RPC_URL=${L1_RPC_URL:-}; [ -z "${L1_RPC_URL:-}" ] && echo "Need to set the L1_RPC_URL via env" && exit 1;

# Reverts with reason if something is wrong with withdrawal (not proven, not initiated, not ready for claim etc.)
cast call $L1_OPTIMISM_PORTAL \
  "checkWithdrawal(bytes32,address)" \
  $WITHDRAWAL_HASH \
  $PROOF_SUBMITTER \
  --rpc-url $L1_RPC_URL
