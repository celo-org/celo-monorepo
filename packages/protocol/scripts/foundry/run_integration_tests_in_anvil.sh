#!/usr/bin/env bash
set -euo pipefail

# Read environment variables and constants
source $PWD/scripts/foundry/constants.sh

# Generate and run devchain
echo "Generating and running devchain before running integration tests..."
source $PWD/scripts/foundry/create_and_migrate_anvil_devchain.sh

# Before running the migration script, check that the tests compile
# This will avoid having to wait for the whole chain to start just to realize
# there's a compilation error at the very end
forge build --contracts $PWD/test-sol/integration

# Run integration tests
echo "Running integration tests..."
forge test \
-vvv \
--match-contract RegistryIntegrationTest \
--fork-url $ANVIL_RPC_URL

# Stop devchain
echo "Stopping devchain..."
source $PWD/scripts/foundry/stop_anvil.sh