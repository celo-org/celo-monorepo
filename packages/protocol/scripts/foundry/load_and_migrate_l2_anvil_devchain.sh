#!/usr/bin/env bash
set -euo pipefail

# This address is defined in `IsL2Check.sol`
PROXY_ADMIN_ADDRESS='0x4200000000000000000000000000000000000018'

# Generate and run L1 devchain
echo "Generating and running L1 devchain before activating L2..."
source $PWD/scripts/foundry/create_and_migrate_anvil_devchain.sh

# Generate arbitrary bytecode. In this instance, we're arbitrarily using the bytecode of 
# Registry.sol, which we're reading from the Foundry build artifacts, but we could have used any 
# other arbitary bytecode.
ARBITRARY_BYTECODE=$(jq -r '.bytecode' build/contracts/Registry.json)

# Activate the L2 on the devchain by deploying arbitrary bytecode to the PROXY_ADMIN_ADDRESS
echo "Activating L2 on the devchain..."
cast rpc anvil_setCode \
$PROXY_ADMIN_ADDRESS \
$ARBITRARY_BYTECODE \
--rpc-url=http://127.0.0.1:8546
# TODO(Arthur): Use port 8546 defined in bash script and not hardcoded here

# Fetch address of Celo distribution 
CELO_DISTRIBUTION_SCHEDULE_ADDRESS=$(
  cast call \
  0x000000000000000000000000000000000000ce10 \
  "getAddressForStringOrDie(string calldata identifier)(address)" \
  "CeloDistributionSchedule" \
  --rpc-url=http://127.0.0.1:8546
)
# TODO(Arthur): Use port 8546 defined in bash script and not hardcoded here

# Arbitrary balance
ARBITRARY_BALANCE='10000'

# Set the balance of the CeloDistributionSchedule (like the Celo client would do during L2 genesis)
# This cannot be done during the migrations, because CeloDistributionSchedule.sol does not
# implement the receive function nor does it allow ERC20 transfers.
# This is the only way I managed to give the CeloDistributionSchedule a balance.
cast rpc \
anvil_setBalance \
$CELO_DISTRIBUTION_SCHEDULE_ADDRESS $ARBITRARY_BALANCE \
--rpc-url http://127.0.0.1:8546
# TODO(Arthur): Use port 8546 defined in bash script and not hardcoded here

# Fetch timestamp of the latest block
LATEST_BLOCK_TIMESTAMP=$(
    cast block \
    latest \
    --field timestamp \
    --rpc-url=http://127.0.0.1:8546
)
# TODO(Arthur): Use port 8546 defined in bash script and not hardcoded here

# Arbitrarily set L2 start time at 5 seconds before the latest block. The L2 start time can be any 
# timestamp in the past, but can never be in the future.
L2_START_TIME=$((LATEST_BLOCK_TIMESTAMP - 5))
COMMUNITY_REWARD_FRACTION="100000000000000000000" # 0.01 in fixidity format
CARBON_OFFSETTING_PARTNER="0x22579CA45eE22E2E16dDF72D955D6cf4c767B0eF"
CARBON_OFFSETTING_FRACTION="10000000000000000000" # 0.001 in fixidity format

# Activate CeloDistributionSchedule
cast send \
$CELO_DISTRIBUTION_SCHEDULE_ADDRESS \
"activate(uint256,uint256,address,uint256)" \
$L2_START_TIME $COMMUNITY_REWARD_FRACTION $CARBON_OFFSETTING_PARTNER $CARBON_OFFSETTING_FRACTION \
--from "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" \
--private-key "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" \
--gas-limit 10000000 \
--rpc-url=http://127.0.0.1:8546
# TODO(Arthur): Use port 8546 defined in bash script and not hardcoded here

# Export L2 state to `l2-state.json`
# TODO(Arthur): Check that I'm not mixing up state.json in `--dump-state $ANVIL_FOLDER`