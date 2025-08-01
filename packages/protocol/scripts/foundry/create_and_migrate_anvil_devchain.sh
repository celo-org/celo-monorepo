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
echo "Forge version: $(forge --version)"

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

# Build map of selectors from governanceConstitution.json
source $PWD/scripts/foundry/build_constitution_selectors_map.sh

# exit 1
# Build all contracts with deployed libraries
# Including contracts that depend on libraries. This step replaces the library placeholder
# in the bytecode with the address of the actually deployed library.
echo "Compiling with libraries..."
time FOUNDRY_PROFILE=devchain forge build $LIBRARY_FLAGS

# TODO: Move to L2Gensis.s.sol?
# Deploy precompile contracts
#source $PWD/scripts/foundry/deploy_precompiles.s

# Pre-deploy Election
echo "Deploying Election contract..."
forge create -r $ANVIL_RPC_URL --private-key $DEPLOYER_PK $LIBRARY_FLAGS \
  --broadcast \
  contracts/governance/Election.sol:Election \
  --constructor-args false

# Run migrations
echo "Running migration script..."
forge script \
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
  
# TODO: Combine run + unrealesed treasury + run2 into single Foundry script
echo "Transfering funds to Unreleased Treasury..."
CELO_TOKEN_ADDRESS=`cast call 000000000000000000000000000000000000ce10 "getAddressForStringOrDie(string calldata identifier) external view returns (address)" "CeloToken" --rpc-url $ANVIL_RPC_URL`
CELO_UNRELEASED_TREASURY_ADDRESS=0xB76D502Ad168F9D545661ea628179878DcA92FD5
UNRELEASE_TREASURY_PRE_MINT=390000000000000000000000000
cast send $CELO_TOKEN_ADDRESS "function transfer(address to, uint256 value) external returns (bool)" $CELO_UNRELEASED_TREASURY_ADDRESS $UNRELEASE_TREASURY_PRE_MINT --gas-limit 100000 --rpc-url  $ANVIL_RPC_URL --private-key $DEPLOYER_PK

TREASURY_BALANCE=$(cast call $CELO_TOKEN_ADDRESS "balanceOf(address account) external view returns (uint256)" $CELO_UNRELEASED_TREASURY_ADDRESS --rpc-url $ANVIL_RPC_URL)
echo "Unreleased Treasury balance: $TREASURY_BALANCE CELO"

echo "Running second part of migration script..."
forge script \
  $MIGRATION_SCRIPT_PATH \
  --target-contract $MIGRATION_TARGET_CONTRACT \
  --sender $FROM_ACCOUNT \
  --private-key $MIGRATION_PK \
  --sig "run2()" \
  $VERBOSITY_LEVEL \
  $BROADCAST \
  $SKIP_SIMULATION \
  $NON_INTERACTIVE \
  $LIBRARY_FLAGS \
  --rpc-url $ANVIL_RPC_URL || { echo "Migration script (part 2) failed"; exit 1; }

echo "Getting address for Epoch Rewards..."
CELO_EPOCH_REWARDS_ADDRESS=$(
  cast call \
    $REGISTRY_ADDRESS \
    "getAddressForStringOrDie(string calldata identifier)(address)" \
    "EpochRewards" \
    --rpc-url $ANVIL_RPC_URL
)

# Keeping track of the finish time to measure how long it takes to run the script entirely
ELAPSED_TIME=$(($SECONDS - $START_TIME))
echo "Migration script total elapsed time: $ELAPSED_TIME seconds"
