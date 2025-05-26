#!/usr/bin/env bash
set -euo pipefail

anvil \
  --port 8545 \
  --fork-url https://reth-0.cel2.celo-networks-dev.org?apikey= \
  --fork-chain-id 17000 \
  --fork-block-number 3881641
