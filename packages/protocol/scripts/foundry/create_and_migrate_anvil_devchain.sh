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
#source $PWD/scripts/foundry/start_anvil.sh

# Deploy libraries to the anvil instance
ANVIL_PORT=9545
ANVIL_RPC_URL="http://127.0.0.1:9545"
source $PWD/scripts/foundry/deploy_libraries.sh

# export LIBRARY_FLAGS="--libraries contracts/common/linkedlists/AddressSortedLinkedListWithMedian.sol:AddressSortedLinkedListWithMedian:0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690 --libraries contracts/common/Signatures.sol:Signatures:0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB --libraries contracts-0.8/common/linkedlists/AddressLinkedList.sol:AddressLinkedList:0x9E545E3C0baAB3E08CdfD552C960A1050f373042 --libraries contracts/common/linkedlists/AddressSortedLinkedList.sol:AddressSortedLinkedList:0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9 --libraries contracts/common/linkedlists/IntegerSortedLinkedList.sol:IntegerSortedLinkedList:0x1613beB3B2C4f22Ee086B2b38C1476A3cE7f78E8 --libraries contracts/governance/Proposals.sol:Proposals:0x851356ae760d987E095750cCeb3bC6014560891C"

echo "Library flags are: $LIBRARY_FLAGS"
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


# Can't do the transfer here
#  cast send 0xB76D502Ad168F9D545661ea628179878DcA92FD5 --value  390000000000000000000000000 --rpc-url  http://localhost:9545 --private-key 59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

# Run migrations
echo "Running migration script... "
forge script \
  $MIGRATION_SCRIPT_PATH \
  --target-contract $MIGRATION_TARGET_CONTRACT \
  --sender $FROM_ACCOUNT \
  # --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --unlocked
  $VERBOSITY_LEVEL \
  $BROADCAST \
  $SKIP_SIMULATION \
  $NON_INTERACTIVE \
  $LIBRARY_FLAGS \
  # --slow \
  # --gas-price 4331510
  --rpc-url $ANVIL_RPC_URL || { echo "Migration script failed"; exit 1; }

CELO_EPOCH_REWARDS_ADDRESS=$(
  cast call \
    $REGISTRY_ADDRESS \
    "getAddressForStringOrDie(string calldata identifier)(address)" \
    "EpochRewards" \
    --rpc-url $ANVIL_RPC_URL
)


cast send 0xB76D502Ad168F9D545661ea628179878DcA92FD5 --value  390000000000000000000000000 --rpc-url  http://localhost:9545 --private-key 59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d


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
