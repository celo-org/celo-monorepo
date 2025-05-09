#!/usr/bin/env bash
set -euo pipefail

# Read environment variables and constants
source $PWD/scripts/foundry/constants.sh

# Generate and run devchain
echo "Generating and running devchain before running e2e tests..."
source $PWD/scripts/foundry/create_and_migrate_anvil_l2_devchain.sh


# Run e2e tests
echo "Running e2e tests..."
time FOUNDRY_PROFILE=devchain forge test \
-vvv \
--match-path "*test-sol/devchain/e2e/*" \
--isolate \
--fork-url $ANVIL_RPC_URL \
--ffi

# Stop devchain
echo "Stopping devchain..."
source $PWD/scripts/foundry/stop_anvil.sh
