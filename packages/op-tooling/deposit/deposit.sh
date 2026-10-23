#!/bin/bash
set -euo pipefail

# Determine network
NETWORK=${NETWORK:-}; [ -z "${NETWORK:-}" ] && echo "Need to set the NETWORK via env" && exit 1;
case $NETWORK in
  mainnet)
    SYSTEM_CONFIG=0x89E31965D844a309231B1f17759Ccaf1b7c09861
    OPTIMISM_PORTAL=0xc5c5D157928BDBD2ACf6d0777626b6C75a9EAEDC
    ;;
  sepolia)
    SYSTEM_CONFIG=0x760a5f022c9940f4a074e0030be682f560d29818
    OPTIMISM_PORTAL=0x44ae3d41a335a7d05eb533029917aad35662dcc2
    ;;
  chaos)
    SYSTEM_CONFIG=0x6baf5959cc06a39793c338e6586f49473c731b4c
    OPTIMISM_PORTAL=0x101f7d8038BEb55D92919E9F944FEb0fAf211a9b
    ;;
  havoc)
    SYSTEM_CONFIG=0xafc6fa968aebf7b4030f4acae02da34c3287bc78
    OPTIMISM_PORTAL=0x7a79515f9f916f38B1AED2DDc2658139C2ecF709
    ;;
  *)
    echo "Unsupported network: $NETWORK (supported: mainnet, sepolia, chaos, havoc)"
    exit 1
    ;;
esac

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
