#!/usr/bin/env bash
set -euo pipefail


# TODO move me to another folder
# Compile everything

./start_abvil.sh


# recomile with the libraries
time forge compile --libraries contracts/common/linkedlist/AddressSortedLinkedListWithMedian.sol:AddressSortedLinkedListWithMedian:$deployed_to

# run migrations
BROADCAST="--broadcast"
forge script migrations_sol/Migration.s.sol --rpc-url http://127.0.0.1:8545 -vvv $BROADCAST --skip-simulation --slow --libraries contracts/common/linkedlist/AddressSortedLinkedListWithMedian.sol:AddressSortedLinkedListWithMedian:$deployed_to || echo "Migration script failed"

# Run integration tests
# TODO for some reason match path doesn't work
# forge test --fork-url http://127.0.0.1:8545 --match-contract=IntegrationTest -vvv # || echo "Test failed" # TODO for some reason the echo didn't work



echo "Killing Anvil"
if [[ -n $ANVIL_PID ]]; then
    kill $ANVIL_PID
fi

# helper kill anvil
# kill $(lsof -i tcp:8545 | tail -n 1 | awk '{print $2}')