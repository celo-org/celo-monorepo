#!/usr/bin/env bash
set -euo pipefail

### This scripts sets up a local Anvil instance, deploys libraries, precompiles, and runs migrations

# Read environment variables and constants
source $PWD/scripts/foundry/constants.sh
DEPLOYER_PK=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
MIGRATION_PK=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

CACHED_LIBRARIES_FLAG=`cat $TMP_FOLDER/library_flags.txt || echo ""`
echo "Library flags are: $CACHED_LIBRARIES_FLAG"

# Keeping track of start time to measure how long it takes to run the script entirely
START_TIME=$SECONDS
echo "Forge version: $($FORGE_EXEC --version)"

# Create temporary directory
if [ -d "$TMP_FOLDER" ]; then
    # Remove temporary directory first it if exists
    echo "Removing existing temporary folder..."
    rm -rf $TMP_FOLDER
fi
mkdir -p $TMP_FOLDER

# Deploy libraries to the anvil instance
source $PWD/scripts/foundry/deploy_libraries.sh
echo "Library flags are: $LIBRARY_FLAGS"
echo $LIBRARY_FLAGS > $TMP_FOLDER/library_flags.txt

# Build all contracts with deployed libraries
# Including contracts that depend on libraries. This step replaces the library placeholder
# in the bytecode with the address of the actually deployed library.
echo "Compiling with libraries..."
time FOUNDRY_PROFILE=devchain $FORGE_EXEC build $LIBRARY_FLAGS

# TODO: Move to L2Gensis.s.sol?
# Deploy precompile contracts
#source $PWD/scripts/foundry/deploy_precompiles.s

# Pre-deploy Election
echo "Deploying Election contract..."
forge create -r $ANVIL_RPC_URL --private-key $DEPLOYER_PK $LIBRARY_FLAGS \
  --broadcast \
  contracts/governance/Election.sol:Election \
  --constructor-args false

# Pre-deploy Celo Token to utilize transfer precompile
echo "Pre-deploying Celo Token contract..."
$FORGE_EXEC script \
  $MIGRATION_SCRIPT_PATH \
  --target-contract $MIGRATION_TARGET_CONTRACT \
  --sender $FROM_ACCOUNT \
  --private-key $MIGRATION_PK \
  --sig "predeployCeloToken()" \
  $VERBOSITY_LEVEL \
  $BROADCAST \
  $SKIP_SIMULATION \
  $NON_INTERACTIVE \
  $LIBRARY_FLAGS \
  --rpc-url $ANVIL_RPC_URL || { echo "Predeploy script failed"; exit 1; }

# Run migrations
echo "Running migration script..."
$FORGE_EXEC script \
  $MIGRATION_SCRIPT_PATH \
  --target-contract $MIGRATION_TARGET_CONTRACT \
  --sender $FROM_ACCOUNT \
  --private-key $MIGRATION_PK \
  $VERBOSITY_LEVEL \
  $BROADCAST \
  $SKIP_SIMULATION \
  $NON_INTERACTIVE \
  $LIBRARY_FLAGS \
  --rpc-url $ANVIL_RPC_URL || { echo "Migration script failed"; exit 1; }

echo "Getting address for Epoch Rewards..."
CELO_EPOCH_REWARDS_ADDRESS=$(
  $CAST_EXEC call \
    $REGISTRY_ADDRESS \
    "getAddressForStringOrDie(string calldata identifier)(address)" \
    "EpochRewards" \
    --rpc-url $ANVIL_RPC_URL
)

# Keeping track of the finish time to measure how long it takes to run the script entirely
ELAPSED_TIME=$(($SECONDS - $START_TIME))
echo "Migration script total elapsed time: $ELAPSED_TIME seconds"
