#!/usr/bin/env bash
set -euo pipefail

anvil \
  --port 8546 \
  --fork-url https://alfajores-forno.celo-testnet.org \
  --fork-chain-id 44787 \
  --fork-block-number 47029145
