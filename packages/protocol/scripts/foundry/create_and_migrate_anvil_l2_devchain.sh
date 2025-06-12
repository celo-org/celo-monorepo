#!/usr/bin/env bash
set -euo pipefail

# Read environment variables and constants
source $PWD/scripts/foundry/constants.sh

# Read the JSON file
CONFIG_FILE=$PWD/migrations_sol/migrationsConfig.json

export KEEP_DEVCHAIN_FOLDER=true

# Generate and run L1 devchain
echo "Generating and running L1 devchain before activating L2..."
source $PWD/scripts/foundry/create_and_migrate_anvil_devchain.sh

# Fetch address
CELO_UNRELEASED_TREASURY_ADDRESS=$(
  cast call \
    $REGISTRY_ADDRESS \
    "getAddressForStringOrDie(string calldata identifier)(address)" \
    "CeloUnreleasedTreasury" \
    --rpc-url $ANVIL_RPC_URL
)

RESERVE_ADDRESS=$(
  cast call \
    $REGISTRY_ADDRESS \
    "getAddressForStringOrDie(string calldata identifier)(address)" \
    "Reserve" \
    --rpc-url $ANVIL_RPC_URL
)

VALIDATORS_ADDRESS=$(
  cast call \
    $REGISTRY_ADDRESS \
    "getAddressForStringOrDie(string calldata identifier)(address)" \
    "Validators" \
    --rpc-url $ANVIL_RPC_URL
)

ELECTIONS_ADDRESS=$(
  cast call \
    $REGISTRY_ADDRESS \
    "getAddressForStringOrDie(string calldata identifier)(address)" \
    "Election" \
    --rpc-url $ANVIL_RPC_URL
)

# Activate Validators
echo "Activating Validators..."
registered_validators=$(cast call \
  $VALIDATORS_ADDRESS \
  "getRegisteredValidators()(address[])" \
  --rpc-url $ANVIL_RPC_URL)

echo "### registered_validators: $registered_validators"

# Increase the block number using anvil cast rpc
# BLOCKS_TO_ADVANCE=17280
# cast rpc anvil_mine $BLOCKS_TO_ADVANCE --rpc-url $ANVIL_RPC_URL --rpc-timeout 30000

# Check if registered_validators is empty or invalid
# if [ -z "$registered_validators" ] || [ "$registered_validators" == "[]" ]; then
#   echo "Error: registered_validators is empty or invalid JSON."
#   exit 1
# fi

VAL_KEYS=$(jq -r '.validators.valKeys[]' "$CONFIG_FILE")

# Extract the first 3 keys from VAL_KEYS
FIRST_THREE_KEYS=($(echo "$VAL_KEYS" | head -n 3))

# Print the extracted keys
# echo "First 3 keys from VAL_KEYS:"
# for key in "${FIRST_THREE_KEYS[@]}"; do
#   echo "$key"
# done
# key_index=0
# for validator in $registered_validators; do
#   validator=$(echo $validator | tr -d '[],')
#   echo "### registered val $validator"

#   validator_info=$(cast call \
#     $VALIDATORS_ADDRESS \
#     "getValidator(address)(bytes,bytes,address,uint256,address)" \
#     $validator \
#     --rpc-url $ANVIL_RPC_URL)

#   echo "### validator info: $validator_info"
#   # Extract the validator group from the validator info
#   validator_group=$(echo "$validator_info" | sed -n '3p' | tr -d '[:space:]')

#   if [ -z "$validator_group" ]; then
#     echo "Error: Failed to retrieve validator group for validator $validator"
#     exit 1
#   fi

#   echo "### validator group: $validator_group"

#   pending_votes=$(cast call \
#     $ELECTIONS_ADDRESS \
#     "getPendingVotesForGroup(address)(uint256)" \
#     $validator_group \
#     --rpc-url $ANVIL_RPC_URL)

#   echo "### pending votes for group $validator_group: $pending_votes"

#   pending_votes_cleaned=$(echo $pending_votes | sed 's/\[[^]]*\]//g' | tr -d '[:space:]')
#   echo "### cleaned pending votes:$pending_votes_cleaned"
#   if [ "$pending_votes_cleaned" = "0" ]; then
#     continue
#   fi

#   cast send $ELECTIONS_ADDRESS "activate(address)" $validator_group --private-key ${FIRST_THREE_KEYS[$key_index]} --rpc-url $ANVIL_RPC_URL
#   key_index=$((key_index + 1))

#   echo "### activated validator group: $validator_group with pending votes: $pending_votes"

# done

# active_votes=$(cast call \
#   $ELECTIONS_ADDRESS \
#   "getActiveVotes()(uint256)" \
#   --rpc-url $ANVIL_RPC_URL)
# echo "### active votes: $active_votes"

# Activate L2 by deploying arbitrary bytecode to the proxy admin address.
# Note: This can't be done from the migration script
echo "Activating L2 by deploying arbitrary bytecode to the proxy admin address..."
ARBITRARY_BYTECODE=$(cast format-bytes32-string "L2 is activated")
cast rpc anvil_setCode \
  $PROXY_ADMIN_ADDRESS $ARBITRARY_BYTECODE \
  --rpc-url $ANVIL_RPC_URL

# Set the balance of the CeloUnreleasedTreasury (like the Celo client would do during L2 genesis)
# Note: This can't be done from the migration script, because CeloUnreleasedTreasury.sol does not
# implement the receive function nor does it allow ERC20 transfers. This is the only way I
# managed to give the CeloUnreleasedTreasury a balance.
echo "Setting CeloUnreleasedTreasury balance..."
HEX_CELO_UNRELEASED_TREASURY_INITIAL_BALANCE=$(cast to-hex $CELO_UNRELEASED_TREASURY_INITIAL_BALANCE"000000000000000000")
cast rpc \
  anvil_setBalance \
  $CELO_UNRELEASED_TREASURY_ADDRESS $HEX_CELO_UNRELEASED_TREASURY_INITIAL_BALANCE \
  --rpc-url $ANVIL_RPC_URL

# Set the balance of the Reserve For some reason, the balance that is set in the anvil_L1_devchain
# migration script does not get carried over to anvil_L2_devchain.
echo "Setting reserve balance..."
HEX_RESERVE_INITIAL_BALANCE=$(cast to-hex $RESERVE_INITIAL_BALANCE"000000000000000000")
cast rpc \
  anvil_setBalance \
  $RESERVE_ADDRESS $HEX_RESERVE_INITIAL_BALANCE \
  --rpc-url $ANVIL_RPC_URL

# Run L2 migrations
echo "Running L2 migration script... "
forge script \
  $MIGRATION_L2_SCRIPT_PATH \
  --target-contract $MIGRATION_L2_TARGET_CONTRACT \
  --sender $FROM_ACCOUNT \
  --unlocked \
  $BROADCAST \
  $SKIP_SIMULATION \
  $NON_INTERACTIVE \
  --timeout $TIMEOUT \
  -vvv \
  --rpc-url $ANVIL_RPC_URL || {
  echo "Migration script failed"
  exit 1
}

# Give anvil enough time to save the state
sleep $SLEEP_DURATION

# Save L2 state so it can published to NPM
mv $ANVIL_FOLDER/state.json $TMP_FOLDER/$L2_DEVCHAIN_FILE_NAME
echo "Saved anvil L2 state to $TMP_FOLDER/$L2_DEVCHAIN_FILE_NAME"

rm -rf $ANVIL_FOLDER
