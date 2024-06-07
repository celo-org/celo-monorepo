#!/usr/bin/env bash
set -euo pipefail

# Generate and run devchain
echo "Generating and running devchain before running e2e tests..."
source $PWD/migrations_sol/create_and_migrate_anvil_devchain.sh

# Run e2e tests
echo "Running e2e tests..."
forge test \
-vvv \
--match-path "*test-sol/e2e/*" \
--fork-url http://127.0.0.1:$ANVIL_PORT

# helper kill anvil
# kill $(lsof -i tcp:$ANVIL_PORT | tail -n 1 | awk '{print $2}')

echo "Killing Anvil"
if [[ -n $ANVIL_PID ]]; then
    kill $ANVIL_PID
fi
