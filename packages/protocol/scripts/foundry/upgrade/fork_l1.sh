#!/usr/bin/env bash
set -euo pipefail

[ -z "${ALCHEMY_API_KEY:-}" ] && echo "Need to set the ALCHEMY_API_KEY via env" && exit 1;

anvil \
  --port 8545 \
  --fork-url https://eth-holesky.g.alchemy.com/v2/$ALCHEMY_API_KEY \
  --fork-chain-id 17000 \
  --fork-block-number 3974626
