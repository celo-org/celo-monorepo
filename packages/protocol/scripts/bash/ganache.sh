#!/usr/bin/env bash
set -euo pipefail

# Runs ganache with the mnemonic used in our tests.

yarn run ganache \
  --wallet.mnemonic='concert load couple harbor equip island argue ramp clarify fence smart topic' \
  --miner.defaultGasPrice=0 \
  --chain.networkId=1101 \
  --miner.blockGasLimit=20000000 \
  --wallet.defaultBalance=200000000 \
  --chain.allowUnlimitedContractSize=true \
  --chain.chainId=1 \
