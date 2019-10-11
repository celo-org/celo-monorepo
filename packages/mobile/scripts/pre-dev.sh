#!/usr/bin/env bash
set -euo pipefail

# ====================================
# Tasks to run before running yarn dev
# ====================================

# Detect network from .env and build the sdk for it
export $(grep -v '^#' .env | xargs)
echo "Building sdk for testnet $DEFAULT_TESTNET"
yarn build:sdk $DEFAULT_TESTNET
echo "Done building sdk"