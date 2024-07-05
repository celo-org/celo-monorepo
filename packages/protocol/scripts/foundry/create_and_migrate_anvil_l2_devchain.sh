#!/usr/bin/env bash
set -euo pipefail

# Read environment variables and constants
source $PWD/scripts/foundry/constants.sh

# Generate L1 devchain
echo "Generating and running L1 devchain before activating L2..."
source $PWD/scripts/foundry/create_and_migrate_anvil_devchain.sh

# Duplicate L1 state
cp $TMP_FOLDER/$L1_DEVCHAIN_FILE_NAME $TMP_FOLDER/$L2_DEVCHAIN_FILE_NAME

# Start L2 devchain from L1 state and apply L2 migrations
echo "Anvil L2 state will be saved to $TMP_FOLDER/$L2_DEVCHAIN_FILE_NAME"
anvil \
--port $ANVIL_PORT \
--state $TMP_FOLDER/$L2_DEVCHAIN_FILE_NAME \
--state-interval $STATE_INTERVAL \
--gas-limit $GAS_LIMIT \
--code-size-limit $CODE_SIZE_LIMIT \
--balance $BALANCE \
--steps-tracing &

# Activate the L2 on the devchain by deploying arbitrary bytecode to the PROXY_ADMIN_ADDRESS
# Arbitrarily using Registry.sol bytcode, but we could have used any 
# other arbitary bytecode of length > 0. See `isL2()` implementation in IsL2Check.sol.
echo "Activating L2 on the devchain..."
REGISTRY_BYTECODE=$(jq -r '.bytecode.object' ./out/Registry.sol/Registry.json)
cast rpc anvil_setCode \
$PROXY_ADMIN_ADDRESS \
$REGISTRY_BYTECODE \
--rpc-url $ANVIL_RPC_URL

# Fetch address of Celo distribution 
CELO_DISTRIBUTION_SCHEDULE_ADDRESS=$(
  cast call \
  $REGISTRY_ADDRESS \
  "getAddressForStringOrDie(string calldata identifier)(address)" \
  "CeloDistributionSchedule" \
  --rpc-url $ANVIL_RPC_URL
)

# Set the balance of the CeloDistributionSchedule (like the Celo client would do during L2 genesis)
# This cannot be done during the migrations, because CeloDistributionSchedule.sol does not
# implement the receive function nor does it allow ERC20 transfers.
# This is the only way I managed to give the CeloDistributionSchedule a balance.
echo "Setting CeloDistributionSchedule balance..."
cast rpc \
anvil_setBalance \
$CELO_DISTRIBUTION_SCHEDULE_ADDRESS $CELO_DISTRIBUTION_SCHEDULE_INITIAL_BALANCE \
--rpc-url $ANVIL_RPC_URL

# Fetch timestamp of the latest block
LATEST_BLOCK_TIMESTAMP=$(
    cast block \
    latest \
    --field timestamp \
    --rpc-url $ANVIL_RPC_URL
)

# Arbitrarily set L2 start time at 5 seconds before the latest block. The L2 start time can be any 
# timestamp in the past, but can never be in the future.
L2_START_TIME=$((LATEST_BLOCK_TIMESTAMP - 5))

# Activate CeloDistributionSchedule
echo "Activating CeloDistributionSchedule..."
cast send \
$CELO_DISTRIBUTION_SCHEDULE_ADDRESS \
"activate(uint256,uint256,address,uint256)" \
$L2_START_TIME $COMMUNITY_REWARD_FRACTION $CARBON_OFFSETTING_PARTNER $CARBON_OFFSETTING_FRACTION \
--from $FROM_ACCOUNT \
--private-key $FROM_ACCOUNT_PRIVATE_KEY \
--gas-limit 10000000 \
--rpc-url $ANVIL_RPC_URL

# Save and rename L2 devchain state
# mv $ANVIL_FOLDER/$L2_DEVCHAIN_FILE_NAME $TMP_FOLDER/$L2_DEVCHAIN_FILE_NAME
# rm -rf $ANVIL_FOLDER