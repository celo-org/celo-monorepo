#!/usr/bin/env bash
set -euo pipefail

# Read environment variables and constants
source $PWD/scripts/foundry/constants.sh

# Generate and run devchain
echo "Generating and running devchain before running e2e tests..."
source $PWD/scripts/foundry/create_and_migrate_anvil_devchain.sh

# Run e2e tests
echo "Running e2e tests..."
forge test \
-vvv \
--match-path "*test-sol/e2e/*" \
--fork-url $ANVIL_RPC_URL

# Stop devchain
echo "Stopping devchain..."
source $PWD/scripts/foundry/stop_anvil.sh