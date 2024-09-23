#!/usr/bin/env bash
set -euo pipefail

# Read environment variables and constants
source $PWD/scripts/foundry/constants.sh

# Generate and run devchain
echo "Generating and running devchain before running integration tests..."
source $PWD/scripts/foundry/create_and_migrate_anvil_devchain.sh

# Run integration tests
echo "Running integration tests..."
time FOUNDRY_PROFILE=devchain forge test \
-vvv \
--match-path "test-sol/devchain/migration/*" \
--fork-url $ANVIL_RPC_URL

exit 1

# Stop devchain
echo "Stopping devchain..."
source $PWD/scripts/foundry/stop_anvil.sh