#!/usr/bin/env bash
set -euo pipefail

anvil \
  --port 8546 \
  --fork-url https://forno.celo-sepolia.celo-testnet.org \
  --fork-chain-id 11142220 \
  --fork-block-number 9055818
