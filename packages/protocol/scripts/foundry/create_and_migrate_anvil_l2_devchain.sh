#!/usr/bin/env bash
set -euo pipefail

# Read environment variables and constants
source $PWD/scripts/foundry/constants.sh

export KEEP_DEVCHAIN_FOLDER=true

# Generate and run L1 devchain
echo "Generating and running L1 devchain before activating L2..."
source $PWD/scripts/foundry/create_and_migrate_anvil_devchain.sh

# Activate L2 by deploying arbitrary bytecode to the proxy admin address. 
# Note: This can't be done from the migration script
ARBITRARY_BYTECODE=$(cast format-bytes32-string "L2 is activated")
cast rpc anvil_setCode \
  $PROXY_ADMIN_ADDRESS $ARBITRARY_BYTECODE \
  --rpc-url $ANVIL_RPC_URL

# Fetch address of Celo distribution 
CELO_UNRELEASED_TREASURE_ADDRESS=$(
  cast call \
    $REGISTRY_ADDRESS \
    "getAddressForStringOrDie(string calldata identifier)(address)" \
    "CeloUnreleasedTreasure" \
    --rpc-url $ANVIL_RPC_URL
)

# Set the balance of the CeloUnreleasedTreasure (like the Celo client would do during L2 genesis)
# Note: This can't be done from the migration script, because CeloUnreleasedTreasure.sol does not
# implement the receive function nor does it allow ERC20 transfers. This is the only way I 
# managed to give the CeloUnreleasedTreasure a balance.
echo "Setting CeloUnreleasedTreasure balance..."
HEX_CELO_UNRELEASED_TREASURE_INITIAL_BALANCE=$(cast to-hex $CELO_UNRELEASED_TREASURE_INITIAL_BALANCE"000000000000000000")
cast rpc \
  anvil_setBalance \
  $CELO_UNRELEASED_TREASURE_ADDRESS $HEX_CELO_UNRELEASED_TREASURE_INITIAL_BALANCE \
  --rpc-url $ANVIL_RPC_URL

# Run L2 migrations
echo "Running L2 migration script... "
forge script \
  $MIGRATION_L2_SCRIPT_PATH \
  --target-contract $MIGRATION_L2_TARGET_CONTRACT \
  --sender $FROM_ACCOUNT \
  --unlocked \
  $VERBOSITY_LEVEL \
  $BROADCAST \
  $SKIP_SIMULATION \
  $NON_INTERACTIVE \
  --rpc-url $ANVIL_RPC_URL || { echo "Migration script failed"; exit 1; }

# # Save L2 state so it can published to NPM
mv $ANVIL_FOLDER/state.json $TMP_FOLDER/$L2_DEVCHAIN_FILE_NAME
echo "Saved anvil L2 state to $TMP_FOLDER/$L2_DEVCHAIN_FILE_NAME"

rm -rf $ANVIL_FOLDER
