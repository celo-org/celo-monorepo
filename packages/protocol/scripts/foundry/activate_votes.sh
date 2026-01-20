#!/usr/bin/env bash
set -euo pipefail

CONFIG_FILE=$PWD/migrations_sol/migrationsConfig.json

ELECTIONS_ADDRESS=$(
  cast call \
    $REGISTRY_ADDRESS \
    "getAddressForStringOrDie(string calldata identifier)(address)" \
    "Election" \
    --rpc-url $ANVIL_RPC_URL
)

VALIDATORS_ADDRESS=$(
  cast call \
    $REGISTRY_ADDRESS \
    "getAddressForStringOrDie(string calldata identifier)(address)" \
    "Validators" \
    --rpc-url $ANVIL_RPC_URL
)
# Activate votes:
# Activate Validators
echo "Activating Validators..."
registered_validators=$(cast call \
  $VALIDATORS_ADDRESS \
  "getRegisteredValidators()(address[])" \
  --rpc-url $ANVIL_RPC_URL)

echo "### registered_validators: $registered_validators"

# Increase the block number using anvil cast rpc
echo `cast block --rpc-url $ANVIL_RPC_URL`
BLOCKS_TO_ADVANCE=$(($(jq '.epochManager.newEpochDuration' "$CONFIG_FILE") + 1))
MS_TO_ADVANCE=$((BLOCKS_TO_ADVANCE * 1000))

cast rpc evm_increaseTime $MS_TO_ADVANCE --rpc-url $ANVIL_RPC_URL --rpc-timeout 30000
cast rpc anvil_mine $BLOCKS_TO_ADVANCE --rpc-url $ANVIL_RPC_URL --rpc-timeout 30000

# advance 101 seconds
echo `cast block --rpc-url $ANVIL_RPC_URL`

celocli epochs:switch --from $FROM_ACCOUNT -n $ANVIL_RPC_URL

# Check if registered_validators is empty or invalid
if [ -z "$registered_validators" ] || [ "$registered_validators" == "[]" ]; then
  echo "Error: registered_validators is empty or invalid JSON."
  exit 1
fi

VAL_KEYS=$(jq -r '.validators.valKeys[]' "$CONFIG_FILE")

# Extract the first 3 keys from VAL_KEYS
FIRST_THREE_KEYS=($(echo "$VAL_KEYS" | head -n 3))

# Print the extracted keys
echo "First 3 keys from VAL_KEYS:"
for key in "${FIRST_THREE_KEYS[@]}"; do
  echo "$key"
done
key_index=0
for validator in $registered_validators; do
  validator=$(echo $validator | tr -d '[],')
  echo "### registered val $validator"

  validator_info=$(cast call \
    $VALIDATORS_ADDRESS \
    "getValidator(address)(bytes,bytes,address,uint256,address)" \
    $validator \
    --rpc-url $ANVIL_RPC_URL)

  echo "### validator info: $validator_info"
  # Extract the validator group from the validator info
  validator_group=$(echo "$validator_info" | sed -n '3p' | tr -d '[:space:]')

  if [ -z "$validator_group" ]; then
    echo "Error: Failed to retrieve validator group for validator $validator"
    exit 1
  fi

  echo "### validator group: $validator_group"

  pending_votes=$(cast call \
    $ELECTIONS_ADDRESS \
    "getPendingVotesForGroup(address)(uint256)" \
    $validator_group \
    --rpc-url $ANVIL_RPC_URL)

  echo "### pending votes for group $validator_group: $pending_votes"

  pending_votes_cleaned=$(echo $pending_votes | sed 's/\[[^]]*\]//g' | tr -d '[:space:]')
  echo "### cleaned pending votes:$pending_votes_cleaned"
  if [ "$pending_votes_cleaned" = "0" ]; then
    continue
  fi

  

  echo "### activating validator group: $validator_group with pending votes: $pending_votes"
  cast send $ELECTIONS_ADDRESS "activate(address)" $validator_group --private-key ${FIRST_THREE_KEYS[$key_index]} --rpc-url $ANVIL_RPC_URL
  key_index=$((key_index + 1))

  echo "### activated validator group: $validator_group with pending votes: $pending_votes"

done

active_votes=$(cast call \
  $ELECTIONS_ADDRESS \
  "getActiveVotes()(uint256)" \
  --rpc-url $ANVIL_RPC_URL)
echo "### active votes: $active_votes"