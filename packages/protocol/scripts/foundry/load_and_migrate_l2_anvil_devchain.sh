#!/usr/bin/env bash
set -euo pipefail

# Generate and run L1 devchain
echo "Generating and running L1 devchain before activating L2..."
source $PWD/scripts/foundry/create_and_migrate_anvil_devchain.sh

# Activate L2 on the devchain by deploying bytecode to the proxyAdminAddress
echo "Activating L2 on the devchain..."

# Get arbitrary bytecode. In this instance, we're using the Registry.sol bytecode, 
# which we're reading from the Foundry build artifacts, but we could have used any other arbitary 
# bytecode.
ARBITRARY_BYTECODE=$(jq -r '.bytecode' build/contracts/Registry.json)

# Set the bytecode on the proxyAdminAddress to our arbitrary bytecode
cast rpc anvil_setCode \
0x4200000000000000000000000000000000000018 \
$ARBITRARY_BYTECODE \
--rpc-url=http://127.0.0.1:8546

# Activate other L2 related-contracts



# Export L2 state to JSON
# TODO(Arthur): Check that I'm not mixing up JSON state in `--dump-state $ANVIL_FOLDER`

# # Stop L2 devchain
# echo "Stopping devchain..."
# source $PWD/scripts/foundry/stop_anvil.sh