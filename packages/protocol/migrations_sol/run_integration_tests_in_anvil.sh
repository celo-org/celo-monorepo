#!/usr/bin/env bash
set -euo pipefail


# generate devchain
source $PWD/migrations_sol/create_and_migrate_anvil_devchain.sh

# Run integration tests
source $PWD/migrations_sol/integration_tests.sh


# helper kill anvil
# kill $(lsof -i tcp:$ANVIL_PORT | tail -n 1 | awk '{print $2}')

echo "Killing Anvil"
if [[ -n $ANVIL_PID ]]; then
    kill $ANVIL_PID
fi
