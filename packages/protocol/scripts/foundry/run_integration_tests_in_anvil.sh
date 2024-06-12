#!/usr/bin/env bash
set -euo pipefail

# Generate and run devchain
echo "Generating and running devchain before running integration tests..."
source $PWD/scripts/foundry/create_and_migrate_anvil_devchain.sh

# Run integration tests
echo "Running integration tests..."
forge test \
-vvv \
--match-contract RegistryIntegrationTest \
--fork-url http://127.0.0.1:$ANVIL_PORT

# Stop devchain
echo "Stopping devchain..."
source $PWD/scripts/foundry/stop_anvil.sh