#!/usr/bin/env bash
set -euo pipefail

# Runs ganache-cli with the mnemonic used in our tests.

yarn run ganache-cli \
  --deterministic \
  --mnemonic 'concert load couple harbor equip island argue ramp clarify fence smart topic' \
  --gasPrice 0 \
  --networkId 1101 \
  --gasLimit 20000000 \
  --defaultBalanceEther 200000000 \
  --allowUnlimitedContractSize
