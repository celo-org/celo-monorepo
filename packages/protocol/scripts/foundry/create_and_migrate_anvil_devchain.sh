#!/usr/bin/env bash
set -euo pipefail

### This scripts sets up a local Anvil instance, deploys libraries, precompiles, and runs migrations

# Read environment variables and constants
source $PWD/scripts/foundry/constants.sh

# Keeping track of start time to measure how long it takes to run the script entirely
START_TIME=$SECONDS

echo "Forge version: $(forge --version)"

# Create temporary directory
if [ -d "$TMP_FOLDER" ]; then
    # Remove temporary directory first it if exists
    echo "Removing existing temporary folder..."
    rm -rf $TMP_FOLDER
fi
mkdir -p $TMP_FOLDER

# Start a local anvil instance
source $PWD/scripts/foundry/start_anvil.sh

# Deploy libraries to the anvil instance
source $PWD/scripts/foundry/deploy_libraries.sh
echo "Library flags are: $LIBRARY_FLAGS"

# Build all contracts with deployed libraries
# Including contracts that depend on libraries. This step replaces the library placeholder
# in the bytecode with the address of the actually deployed library.
echo "Compiling with libraries..."
time FOUNDRY_PROFILE=devchain forge build $LIBRARY_FLAGS

# Deploy precompile contracts
source $PWD/scripts/foundry/deploy_precompiles.sh

echo "Setting Registry Proxy"
PROXY_DEPLOYED_BYTECODE=$(jq -r '.deployedBytecode.object' ./out/Proxy.sol/Proxy.json)
cast rpc anvil_setCode $REGISTRY_ADDRESS $PROXY_DEPLOYED_BYTECODE --rpc-url $ANVIL_RPC_URL

# Sets the storage of the registry so that it has an owner we control
echo "Setting Registry owner"
cast rpc \
anvil_setStorageAt \
$REGISTRY_ADDRESS $REGISTRY_STORAGE_LOCATION "0x000000000000000000000000$REGISTRY_OWNER_ADDRESS" \
--rpc-url $ANVIL_RPC_URL

# Run migrations
echo "Running migration script... "
forge script \
  $MIGRATION_SCRIPT_PATH \
  --target-contract $MIGRATION_TARGET_CONTRACT \
  --sender $FROM_ACCOUNT \
  --unlocked \
  $VERBOSITY_LEVEL \
  $BROADCAST \
  $SKIP_SIMULATION \
  $NON_INTERACTIVE \
  $LIBRARY_FLAGS \
  --rpc-url $ANVIL_RPC_URL || { echo "Migration script failed"; exit 1; }

CELO_EPOCH_REWARDS_ADDRESS=$(
  cast call \
    $REGISTRY_ADDRESS \
    "getAddressForStringOrDie(string calldata identifier)(address)" \
    "EpochRewards" \
    --rpc-url $ANVIL_RPC_URL
)

echo "Setting storage of EpochRewards start time to same value as on mainnet"
# Storage slot of start time is 2 and the value is 1587587214 which is identical to mainnet
cast rpc \
anvil_setStorageAt \
$CELO_EPOCH_REWARDS_ADDRESS 2 "0x000000000000000000000000000000000000000000000000000000005ea0a88e" \
--rpc-url $ANVIL_RPC_URL

# Keeping track of the finish time to measure how long it takes to run the script entirely
ELAPSED_TIME=$(($SECONDS - $START_TIME))
echo "Migration script total elapsed time: $ELAPSED_TIME seconds"

# this helps to make sure that devchain state is actually being saved
sleep 1

if [[ "${KEEP_DEVCHAIN_FOLDER:-}" == "true" ]]; then
    cp $ANVIL_FOLDER/state.json $TMP_FOLDER/$L1_DEVCHAIN_FILE_NAME
    echo "Keeping devchain folder as per flag."
else
    # Rename devchain artifact and remove unused directory
    mv $ANVIL_FOLDER/state.json $TMP_FOLDER/$L1_DEVCHAIN_FILE_NAME
    rm -rf $ANVIL_FOLDER
fi
