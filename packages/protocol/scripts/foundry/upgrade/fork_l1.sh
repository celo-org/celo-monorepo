#!/usr/bin/env bash
set -euo pipefail

anvil \
  --port 8545 \
  --fork-url https://eth-holesky.g.alchemy.com/v2/ \
  --fork-chain-id 17000 \
  --fork-block-number 3904335
