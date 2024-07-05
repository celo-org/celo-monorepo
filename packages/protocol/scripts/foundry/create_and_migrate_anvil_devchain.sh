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
echo "Compiling with libraries... "
time forge build $LIBRARY_FLAGS

# Deploy precompile contracts
source $PWD/scripts/foundry/deploy_precompiles.sh

echo "Setting Registry Proxy"
cast rpc anvil_setCode $REGISTRY_ADDRESS $PROXY_DEPLOYED_BYTECODE --rpc-url http://127.0.0.1:$ANVIL_PORT

# Sets the storage of the registry so that it has an owner we control
echo "Setting Registry owner"
cast rpc \
anvil_setStorageAt \
$REGISTRY_ADDRESS $REGISTRY_STORAGE_LOCATION "0x000000000000000000000000$REGISTRY_OWNER_ADDRESS" \
--rpc-url http://127.0.0.1:$ANVIL_PORT

# Run migrations
echo "Running migration script... "
forge script \
$MIGRATION_SCRIPT_PATH \
--target-contract $TARGET_CONTRACT \
--sender $FROM_ACCOUNT \
--unlocked \
$VERBOSITY_LEVEL \
$BROADCAST \
$SKIP_SIMULATION \
$NON_INTERACTIVE \
$LIBRARY_FLAGS \
--rpc-url http://127.0.0.1:$ANVIL_PORT || echo "Migration script failed"

# Keeping track of the finish time to measure how long it takes to run the script entirely
ELAPSED_TIME=$(($SECONDS - $START_TIME))
echo "Total elapsed time: $ELAPSED_TIME seconds"

# Rename devchain artifact and remove unused directory
mv $ANVIL_FOLDER/state.json $TMP_FOLDER/$DEVCHAIN_FILE_NAME
rm -rf $ANVIL_FOLDER
