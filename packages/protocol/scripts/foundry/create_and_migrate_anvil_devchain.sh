#!/usr/bin/env bash
set -euo pipefail

### This scripts sets up a local Anvil instance, deploys libraries, precompiles, and runs migrations

# Read environment variables and constants
source $PWD/scripts/foundry/constants.sh


ANVIL_PORT=9545
ANVIL_RPC_URL="http://127.0.0.1:9545"

CACHED_LIBRARIES_FLAG=`cat $TMP_FOLDER/library_flags.txt || echo ""`
echo "Library flags are: $CACHED_LIBRARIES_FLAG"
# forge script \
#   $MIGRATION_SCRIPT_PATH \
#   --target-contract $MIGRATION_TARGET_CONTRACT \
#   --sender $FROM_ACCOUNT \
#   --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
#   $VERBOSITY_LEVEL \
#   --sig "run3()" \
#   $NON_INTERACTIVE \
#   --rpc-url $ANVIL_RPC_URL \
#   $BROADCAST \
#   $SKIP_SIMULATION \
#   --slow

  # `cat $TMP_FOLDER/library_flags.txt` \ 
# forge script \
#   $MIGRATION_SCRIPT_PATH \
#   --target-contract $MIGRATION_TARGET_CONTRACT \
#   --sender $FROM_ACCOUNT \
#   --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
#   $VERBOSITY_LEVEL \
#   --sig "run3()" \
#   $NON_INTERACTIVE \
#   $BROADCAST \
#   $SKIP_SIMULATION \
#   --slow \
#   --rpc-url $ANVIL_RPC_URL || { echo "Migration script failed"; exit 1; }
# exit 1



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
#source $PWD/scripts/foundry/start_anvil.sh

# Deploy libraries to the anvil instance
ANVIL_PORT=9545
ANVIL_RPC_URL="http://127.0.0.1:9545"
source $PWD/scripts/foundry/deploy_libraries.sh
echo "Library flags are: $LIBRARY_FLAGS"
echo $LIBRARY_FLAGS > $TMP_FOLDER/library_flags.txt
# exit 1
# Build all contracts with deployed libraries
# Including contracts that depend on libraries. This step replaces the library placeholder
# in the bytecode with the address of the actually deployed library.
echo "Compiling with libraries..."
time FOUNDRY_PROFILE=devchain forge build $LIBRARY_FLAGS

# Deploy precompile contracts
#source $PWD/scripts/foundry/deploy_precompiles.sh

#echo "Setting Registry Proxy"
#PROXY_DEPLOYED_BYTECODE=$(jq -r '.deployedBytecode.object' ./out/Proxy.sol/Proxy.json)
#cast rpc anvil_setCode $REGISTRY_ADDRESS $PROXY_DEPLOYED_BYTECODE --rpc-url $ANVIL_RPC_URL

# Sets the storage of the registry so that it has an owner we control
# echo "Setting Registry owner"
# cast rpc \
# anvil_setStorageAt \
# $REGISTRY_ADDRESS $REGISTRY_STORAGE_LOCATION "0x000000000000000000000000$REGISTRY_OWNER_ADDRESS" \
# --rpc-url $ANVIL_RPC_URL

# pre-deploy election.sol?
forge create Election --constructor-args false --rpc-url  http://localhost:9545 --private-key 59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d $LIBRARY_FLAGS
# [⠊] Compiling...
# No files changed, compilation skipped
# Deployer: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
# Deployed to: 0x71C95911E9a5D330f4D621842EC243EE1343292e
# Transaction hash: 0x8c19e2eacd9a036cfc8e3c3a48c0685db8e99719f8b400319bf08d9abd016327
# exit 1

# Run migrations
echo "Running migration script... "
forge script \
  $MIGRATION_SCRIPT_PATH \
  --target-contract $MIGRATION_TARGET_CONTRACT \
  --sender $FROM_ACCOUNT \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  $VERBOSITY_LEVEL \
  $BROADCAST \
  $SKIP_SIMULATION \
  $NON_INTERACTIVE \
  $LIBRARY_FLAGS \
  --slow \
  --rpc-url $ANVIL_RPC_URL || { echo "Migration script failed"; exit 1; }
  

echo "transfering funds to UNRELEASE_TREASURY"
CELO_TOKEN_ADDRESS=`cast call 000000000000000000000000000000000000ce10 "getAddressForStringOrDie(string calldata identifier) external view returns (address)" "CeloToken" --rpc-url $ANVIL_RPC_URL`
CELO_UNRELEASED_TREASURY_ADDRESS=0xB76D502Ad168F9D545661ea628179878DcA92FD5
#CELO_UNRELEASED_TREASURY=`cast call 000000000000000000000000000000000000ce10 "getAddressForStringOrDie(string calldata identifier) external view returns (address)" "CeloUnreleasedTreasury" --rpc-url $ANVIL_RPC_URL`
UNRELEASE_TREASURY_PRE_MINT=390000000000000000000000000
cast send $CELO_TOKEN_ADDRESS "function transfer(address to, uint256 value) external returns (bool)" $CELO_UNRELEASED_TREASURY_ADDRESS $UNRELEASE_TREASURY_PRE_MINT --rpc-url  $ANVIL_RPC_URL --private-key 59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
# libraries flag somehow breaks the next script?

forge script \
  $MIGRATION_SCRIPT_PATH \
  --target-contract $MIGRATION_TARGET_CONTRACT \
  --sender $FROM_ACCOUNT \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  $VERBOSITY_LEVEL \
  --sig "run2()" \
  $NON_INTERACTIVE \
  --slow \
  $BROADCAST \
  $SKIP_SIMULATION \
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
sleep $SLEEP_DURATION

if [[ "${KEEP_DEVCHAIN_FOLDER:-}" == "true" ]]; then
    cp $ANVIL_FOLDER/state.json $TMP_FOLDER/$L1_DEVCHAIN_FILE_NAME
    echo "Keeping devchain folder as per flag."
else
    # Rename devchain artifact and remove unused directory
    mv $ANVIL_FOLDER/state.json $TMP_FOLDER/$L1_DEVCHAIN_FILE_NAME
    rm -rf $ANVIL_FOLDER
fi
