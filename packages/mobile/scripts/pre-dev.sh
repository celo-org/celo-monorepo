#!/usr/bin/env bash
set -euo pipefail

# ====================================
# Tasks to run before running yarn dev
# ====================================

# Detect network from .env and build the sdk for it
ENV_FILENAME="${ENVFILE:-.env}"
export $(grep -v '^#' $ENV_FILENAME | xargs)
echo "Building sdk for testnet $DEFAULT_TESTNET"
yarn build:sdk $DEFAULT_TESTNET
echo "Done building sdk"