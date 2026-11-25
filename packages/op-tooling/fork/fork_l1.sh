#!/usr/bin/env bash
set -euo pipefail

[ -z "${NETWORK:-}" ] && echo "Need to set the NETWORK via env" && exit 1;
[ -z "${BLOCK_NUMBER:-}" ] && echo "Need to set the BLOCK_NUMBER via env" && exit 1;

PORT="${PORT:-8545}"

if [ -z "${RPC_URL:-}" ]; then
  [ -z "${ALCHEMY_API_KEY:-}" ] && echo "Need to set RPC_URL (archive-capable upstream) or ALCHEMY_API_KEY via env" && exit 1;
  RPC_URL="https://eth-$NETWORK.g.alchemy.com/v2/$ALCHEMY_API_KEY"
fi

case $NETWORK in
  "mainnet")
    echo "Detected supported network: $NETWORK"
    CHAIN_ID=1
    ;;
  "sepolia")
    echo "Detected supported network: $NETWORK"
    CHAIN_ID=11155111
    ;;
  *)
    echo "Unsupported network: $NETWORK" && exit 1
    ;;
esac

echo "Starting Anvil on port $PORT (fork=$NETWORK, block=$BLOCK_NUMBER)"
anvil \
  --port "$PORT" \
  --fork-url "$RPC_URL" \
  --fork-chain-id "$CHAIN_ID" \
  --fork-block-number "$BLOCK_NUMBER"
