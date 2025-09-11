#!/usr/bin/env bash
set -euo pipefail

[ -z "${ALCHEMY_API_KEY:-}" ] && echo "Need to set the ALCHEMY_API_KEY via env" && exit 1;
[ -z "${NETWORK:-}" ] && echo "Need to set the NETWORK via env" && exit 1;

# Check network
case $NETWORK in
  "mainnet")
    echo "Detected supported network: $NETWORK"
    CHAIN_ID=1
    BLOCK_NUMBER=22830470
    ;;
  "holesky")
    echo "Detected supported network: $NETWORK"
    CHAIN_ID=17000
    BLOCK_NUMBER=4050838
    ;;
  *)
    echo "Unsupported network: $NETWORK" && exit 1
    ;;
esac

anvil \
  --port 8545 \
  --fork-url https://eth-$NETWORK.g.alchemy.com/v2/$ALCHEMY_API_KEY \
  --fork-chain-id $CHAIN_ID \
  --fork-block-number $BLOCK_NUMBER
