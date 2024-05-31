#!/usr/bin/env bash
set -euo pipefail

# Generate and run devchain
echo "Generating and running devchain before running integration tests..."
source $PWD/migrations_sol/create_and_migrate_anvil_devchain.sh

# Run integration tests
echo "Running integration tests..."
forge test \
--match-path test-sol/integration/Integration.t.sol \
-vvv \
--fork-url http://127.0.0.1:$ANVIL_PORT

# helper kill anvil
# kill $(lsof -i tcp:$ANVIL_PORT | tail -n 1 | awk '{print $2}')

echo "Killing Anvil"
if [[ -n $ANVIL_PID ]]; then
    kill $ANVIL_PID
fi
