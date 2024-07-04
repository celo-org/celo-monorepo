#!/usr/bin/env bash
set -euo pipefail

# Read environment variables and constants
source $PWD/scripts/foundry/constants.sh

# Generate and run L1 devchain
echo "Generating and running L1 devchain before activating L2..."
source $PWD/scripts/foundry/create_and_migrate_anvil_devchain.sh

# In this instance, we're arbitrarily using the bytecode of Registry.sol, but we could have used any 
# other arbitary bytecode.
ARBITRARY_BYTECODE=$REGISTRY_BYTECODE

# Activate the L2 on the devchain by deploying arbitrary bytecode to the PROXY_ADMIN_ADDRESS
echo "Activating L2 on the devchain..."
cast rpc anvil_setCode \
$PROXY_ADMIN_ADDRESS \
$ARBITRARY_BYTECODE \
--rpc-url http://127.0.0.1:$ANVIL_PORT

# Fetch address of Celo distribution 
CELO_DISTRIBUTION_SCHEDULE_ADDRESS=$(
  cast call \
  $REGISTRY_ADDRESS \
  "getAddressForStringOrDie(string calldata identifier)(address)" \
  "CeloDistributionSchedule" \
  --rpc-url http://127.0.0.1:$ANVIL_PORT
)

# Arbitrary balance
ARBITRARY_BALANCE='10000'

# Set the balance of the CeloDistributionSchedule (like the Celo client would do during L2 genesis)
# This cannot be done during the migrations, because CeloDistributionSchedule.sol does not
# implement the receive function nor does it allow ERC20 transfers.
# This is the only way I managed to give the CeloDistributionSchedule a balance.
echo "Setting CeloDistributionSchedule balance..."
cast rpc \
anvil_setBalance \
$CELO_DISTRIBUTION_SCHEDULE_ADDRESS $ARBITRARY_BALANCE \
--rpc-url http://127.0.0.1:$ANVIL_PORT

# Fetch timestamp of the latest block
LATEST_BLOCK_TIMESTAMP=$(
    cast block \
    latest \
    --field timestamp \
    --rpc-url http://127.0.0.1:$ANVIL_PORT
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
--rpc-url http://127.0.0.1:$ANVIL_PORT

# Export L2 state to `l2-state.json`
# TODO(Arthur): Check that I'm not mixing up state.json in `--dump-state $ANVIL_FOLDER`