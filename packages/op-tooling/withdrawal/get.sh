#!/bin/bash
set -euo pipefail

# Constants (on Sepolia for Celo Sepolia)
L1_OPTIMISM_PORTAL=0x44ae3d41a335a7d05eb533029917aad35662dcc2

# Required environment variables
WITHDRAWAL_ID=${WITHDRAWAL_ID:-}; [ -z "${WITHDRAWAL_ID:-}" ] && echo "Need to set the WITHDRAWAL_ID via env" && exit 1;
PROOF_SUBMITTER=${PROOF_SUBMITTER:-}; [ -z "${PROOF_SUBMITTER:-}" ] && echo "Need to set the PROOF_SUBMITTER via env" && exit 1;

# Optional environment variables
L1_RPC_URL=${RPC_URL:-}

# Optionally required environment variables
if [ -z "${L1_RPC_URL:-}" ]; then
  ALCHEMY_KEY=${ALCHEMY_KEY:-}; [ -z "${ALCHEMY_KEY:-}" ] && echo "Need to specify full RPC_URL or to set the ALCHEMY_KEY via env" && exit 1;
  L1_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/$ALCHEMY_KEY
fi

# Retrieves stored data about proven withdrawal from L1
cast call $L1_OPTIMISM_PORTAL \
  "provenWithdrawals(bytes32,address)" \
  $WITHDRAWAL_ID \
  $PROOF_SUBMITTER \
  -r $L1_RPC_URL
