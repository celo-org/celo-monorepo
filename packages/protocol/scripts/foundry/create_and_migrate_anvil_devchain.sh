#!/usr/bin/env bash
set -euo pipefail

### This scripts sets up a local Anvil instance, deploys libraries, precompiles, and runs migrations

# Read environment variables and constants
source $PWD/scripts/foundry/constants.sh

CACHED_LIBRARIES_FLAG=`cat $TMP_FOLDER/library_flags.txt || echo ""`
echo "Library flags are: $CACHED_LIBRARIES_FLAG"

# Keeping track of start time to measure how long it takes to run the script entirely
START_TIME=$SECONDS
echo "Forge version: $($FORGE --version)"

# Deploy libraries to the anvil instance
USE_OP_ANVIL=true source $PWD/scripts/foundry/deploy_libraries.sh
echo "Library flags are: $LIBRARY_FLAGS"
echo $LIBRARY_FLAGS > $TMP_FOLDER/library_flags.txt

# Build map of selectors from governanceConstitution.json
source $PWD/scripts/foundry/build_constitution_selectors_map.sh

# exit 1
# Build all contracts with deployed libraries
# Including contracts that depend on libraries. This step replaces the library placeholder
# in the bytecode with the address of the actually deployed library.
echo "Compiling with libraries..."
time FOUNDRY_PROFILE=devchain $FORGE build $LIBRARY_FLAGS

# Run migrations
echo "Running migration script..."
$FORGE script \
  $MIGRATION_SCRIPT_PATH \
  --target-contract $MIGRATION_TARGET_CONTRACT \
  --sender $FROM_ACCOUNT \
  --private-key $FROM_PK \
  --sig "runMigration()" \
  $VERBOSITY_LEVEL \
  $BROADCAST \
  $SKIP_SIMULATION \
  $NON_INTERACTIVE \
  $LIBRARY_FLAGS \
  --rpc-url $ANVIL_OP_RPC_URL || { echo "Migration script failed"; exit 1; }
  
# TODO: Combine both runs & funding of treasury into single Foundry script
echo "Transfering funds to Unreleased Treasury..."
CELO_TOKEN_ADDRESS=`$CAST call 000000000000000000000000000000000000ce10 "getAddressForStringOrDie(string)(address)" "CeloToken" --rpc-url $ANVIL_OP_RPC_URL`
CELO_UNRELEASED_TREASURY_ADDRESS=`$CAST call 000000000000000000000000000000000000ce10 "getAddressForStringOrDie(string)(address)" "CeloUnreleasedTreasury" --rpc-url $ANVIL_OP_RPC_URL`
UNRELEASE_TREASURY_PRE_MINT=390000000000000000000000000

# without explicit `--gas-limit 100000` it fails with "Error: Internal error: Insufficient gas for Celo transfer precompile"
$CAST send $CELO_TOKEN_ADDRESS "function transfer(address to, uint256 value) external returns (bool)" $CELO_UNRELEASED_TREASURY_ADDRESS $UNRELEASE_TREASURY_PRE_MINT --gas-limit 100000 --rpc-url  $ANVIL_OP_RPC_URL --private-key $DEPLOYER_PK

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

echo "Getting address for Epoch Rewards..."
CELO_EPOCH_REWARDS_ADDRESS=$(
  $CAST call \
    $REGISTRY_ADDRESS \
    "getAddressForStringOrDie(string calldata identifier)(address)" \
    "EpochRewards" \
    --rpc-url $ANVIL_OP_RPC_URL
)

# Keeping track of the finish time to measure how long it takes to run the script entirely
ELAPSED_TIME=$(($SECONDS - $START_TIME))
echo "Migration script total elapsed time: $ELAPSED_TIME seconds"
