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

# Before running the migration script, check that the scripts compile
# This will avoid having to wait for the whole chain to start just to realize theres a compilation error at the end
forge build --contracts $PWD/test-sol/devchain

# Build all contracts with deployed libraries
# Including contracts that depend on libraries. This step replaces the library placeholder
# in the bytecode with the address of the actually deployed library.
echo "Compiling with libraries... "
time forge build $LIBRARY_FLAGS

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
--target-contract $TARGET_CONTRACT \
--sender $FROM_ACCOUNT \
--unlocked \
$VERBOSITY_LEVEL \
$BROADCAST \
$SKIP_SIMULATION \
$NON_INTERACTIVE \
$LIBRARY_FLAGS \
--rpc-url $ANVIL_RPC_URL || echo "Migration script failed"

# Set the supply for Celo:
# This supply is just an approximation, but it's importat that this number is non-zero.

# Get CeloToken contract address
CELO_ADDRESS=$(
  cast call \
  $REGISTRY_ADDRESS \
  "getAddressForStringOrDie(string calldata identifier)(address)" \
  "CeloToken" \
  --rpc-url $ANVIL_RPC_URL
)

# interpersonate the VM, this can't be done from the migration script
cast rpc anvil_impersonateAccount $CELO_VM_ADDRESS --rpc-url $ANVIL_RPC_URL

# set the balance of the vm address so that it can send a tx
cast rpc anvil_setBalance $CELO_VM_ADDRESS $ETHER_IN_WEI --rpc-url $ANVIL_RPC_URL

# increase the supply (it is harcoded as bash overflows)
# ideally this number should come from the amount of address funded when Anvil loads
# 540001000000000000000000 = (60e3 * 9 + 1) * 10^18 60K per account * 9 accounts + 1 for the VM (gas)
INITIAL_SUPPLY="540001000000000000000000"
cast send \
--from $CELO_VM_ADDRESS \
--unlocked $CELO_ADDRESS "increaseSupply(uint256)" $INITIAL_SUPPLY \
--rpc-url $ANVIL_RPC_URL

# stop impersonating the VM address
cast rpc \
anvil_stopImpersonatingAccount \
$CELO_VM_ADDRESS \
--rpc-url $ANVIL_RPC_URL

# Keeping track of the finish time to measure how long it takes to run the script entirely
ELAPSED_TIME=$(($SECONDS - $START_TIME))
echo "Total elapsed time: $ELAPSED_TIME seconds"

# Rename devchain artifact and remove unused directory
mv $ANVIL_FOLDER/state.json $TMP_FOLDER/$L1_DEVCHAIN_FILE_NAME
rm -rf $ANVIL_FOLDER
