#!/usr/bin/env bash
set -euo pipefail

### This scripts sets up a local Anvil instance, deploys libraries, precompiles, and runs migrations

# this temp file is deleted at the end
cp test-sol/devchain/Import05Dependencies.sol contracts

# Read environment variables and constants
source $PWD/scripts/foundry/constants.sh

CACHED_LIBRARIES_FLAG=`cat $TMP_FOLDER/library_flags.txt || echo ""`
echo "Cached library flags are: $CACHED_LIBRARIES_FLAG"

# Keeping track of start time to measure how long it takes to run the script entirely
START_TIME=$SECONDS
echo "Forge version: $($FORGE --version)"

# Start a local anvil instance
# TODO figure out how to use start_op_anvil.sh
# OP_DIR=$HOME/celo/optimism/packages/contracts-bedrock ./scripts/foundry/start_op_anvil.sh
# LOAD_STATE=$HOME/celo/optimism/packages/contracts-bedrock/anvil-state.json
$PWD/scripts/foundry/start_anvil.sh --celo

# build standard forge artifacts, needed to deploy precompiles
FOUNDRY_PROFILE=truffle-compat forge build
export ANVIL_RPC_URL=$ANVIL_OP_RPC_URL

# Deploy libraries to the anvil instance
source $PWD/scripts/foundry/deploy_libraries.sh
echo "Library flags 0.5 are: $LIBRARY_FLAGS"
echo "Library flags 0.8 are: $LIBRARY_FLAGS_08"

# Build map of selectors from governanceConstitution.json
source $PWD/scripts/foundry/build_constitution_selectors_map.sh

# exit 1
# Build all contracts with deployed libraries
# Including contracts that depend on libraries. This step replaces the library placeholder
# in the bytecode with the address of the actually deployed library.
echo "Compiling 0.5 with libraries..."
time FOUNDRY_PROFILE=truffle-compat forge build $LIBRARY_FLAGS 
echo "Compiling 0.8 with libraries..."

time FOUNDRY_PROFILE=truffle-compat8 forge build $LIBRARY_FLAGS_08 

echo "Setting Registry Proxy"
PROXY_DEPLOYED_BYTECODE=$(jq -r '.deployedBytecode.object' ./out-truffle-compat/Proxy.sol/Proxy.json)
cast rpc anvil_setCode $REGISTRY_ADDRESS $PROXY_DEPLOYED_BYTECODE --rpc-url $ANVIL_RPC_URL

# Sets the storage of the registry so that it has an owner we control
echo "Setting Registry owner"
cast rpc \
anvil_setStorageAt \
$REGISTRY_ADDRESS $REGISTRY_STORAGE_LOCATION "0x000000000000000000000000$REGISTRY_OWNER_ADDRESS" \
--rpc-url $ANVIL_RPC_URL


# Run migrations
# Not using the --slow flag causes the migrations to randomly hang
echo "Running migration script..."
$FORGE script \
  $MIGRATION_SCRIPT_PATH \
  --target-contract $MIGRATION_TARGET_CONTRACT \
  --sender $FROM_ACCOUNT \
  --legacy \
  --slow \
  --sig "runMigration()" \
  --private-key $FROM_PK \
  $VERBOSITY_LEVEL \
  $BROADCAST \
  $SKIP_SIMULATION \
  $NON_INTERACTIVE \
  $LIBRARY_FLAGS \
  $LIBRARY_FLAGS_08 \
  --rpc-url $ANVIL_RPC_URL || { echo "Migration script failed"; exit 1; }


# if the script is not split into two, then the funding of the UnreleasedTreasury is not recognized
# this is likely due a bug in how anvil simulates the Celo transfer precompile

echo "Running second part of migration script..."
$FORGE script \
  $MIGRATION_SCRIPT_PATH \
  --target-contract $MIGRATION_TARGET_CONTRACT \
  --sender $FROM_ACCOUNT \
  --private-key $FROM_PK \
  --sig "runAfterMigration()" \
  $VERBOSITY_LEVEL \
  $BROADCAST \
  $SKIP_SIMULATION \
  $NON_INTERACTIVE \
  $LIBRARY_FLAGS \
  --rpc-url $ANVIL_OP_RPC_URL || { echo "Migration script (part 2) failed"; exit 1; }


# Keeping track of the finish time to measure how long it takes to run the script entirely
ELAPSED_TIME=$(($SECONDS - $START_TIME))
echo "Migration script total elapsed time: $ELAPSED_TIME seconds"
rm contracts/Import05Dependencies.sol