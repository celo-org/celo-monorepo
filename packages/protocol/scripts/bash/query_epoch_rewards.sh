#!/usr/bin/env bash
set -euo pipefail

MAINNET_RPC="https://forno.celo.org"
LOCAL_RPC="http://127.0.0.1:8546"

# Get contract address from celocli
get_contract_address() {
  local rpc_url=$1
  local contract_name=$2
  NO_SYNCCHECK=true celocli network:contracts -n $rpc_url | grep "$contract_name" | awk '{print $2}'
}

# Query a function from a contract (returns uint256)
query_contract() {
  local address=$1
  local func=$2
  local rpc_url=$3
  cast call $address "${func}()(uint256)" --rpc-url $rpc_url 2>/dev/null || echo "ERROR"
}

# Query getTargetVotingYieldParameters (returns 3 uint256 values)
query_target_voting_yield_params() {
  local address=$1
  local rpc_url=$2
  cast call $address "getTargetVotingYieldParameters()(uint256,uint256,uint256)" --rpc-url $rpc_url 2>/dev/null || echo "ERROR ERROR ERROR"
}

echo "Fetching contract addresses..."
MAINNET_EPOCH_REWARDS=$(get_contract_address $MAINNET_RPC "EpochRewards")
LOCAL_EPOCH_REWARDS=$(get_contract_address $LOCAL_RPC "EpochRewards")
MAINNET_ELECTION=$(get_contract_address $MAINNET_RPC "Election")
LOCAL_ELECTION=$(get_contract_address $LOCAL_RPC "Election")

echo "Mainnet EpochRewards: $MAINNET_EPOCH_REWARDS"
echo "Local EpochRewards:   $LOCAL_EPOCH_REWARDS"
echo "Mainnet Election:     $MAINNET_ELECTION"
echo "Local Election:       $LOCAL_ELECTION"
echo ""

# Define functions to query
FUNCTIONS=(
  "getTargetVoterRewards"
  "getTargetTotalEpochPaymentsInGold"
  "getCommunityRewardFraction"
  "getCarbonOffsettingFraction"
  "getTargetVotingGoldFraction"
  "getRewardsMultiplier"
)

# Print table header
printf "%-35s | %-45s | %-45s\n" "Function" "Mainnet" "Localhost"
printf "%-35s-+-%-45s-+-%-45s\n" "-----------------------------------" "---------------------------------------------" "---------------------------------------------"

# Query EpochRewards functions and print results
for func in "${FUNCTIONS[@]}"; do
  mainnet_result=$(query_contract $MAINNET_EPOCH_REWARDS $func $MAINNET_RPC)
  local_result=$(query_contract $LOCAL_EPOCH_REWARDS $func $LOCAL_RPC)
  printf "%-35s | %-45s | %-45s\n" "$func" "$mainnet_result" "$local_result"
done

# Query Election.getActiveVotes()
mainnet_active_votes=$(query_contract $MAINNET_ELECTION "getActiveVotes" $MAINNET_RPC)
local_active_votes=$(query_contract $LOCAL_ELECTION "getActiveVotes" $LOCAL_RPC)
printf "%-35s | %-45s | %-45s\n" "Election.getActiveVotes" "$mainnet_active_votes" "$local_active_votes"

# Query EpochRewards.getTargetVotingYieldParameters() - returns (target, max, adjustmentFactor)
mainnet_yield_params=$(query_target_voting_yield_params $MAINNET_EPOCH_REWARDS $MAINNET_RPC)
local_yield_params=$(query_target_voting_yield_params $LOCAL_EPOCH_REWARDS $LOCAL_RPC)

# Parse the results (newline separated)
mainnet_target=$(echo "$mainnet_yield_params" | sed -n '1p')
mainnet_max=$(echo "$mainnet_yield_params" | sed -n '2p')
mainnet_adj=$(echo "$mainnet_yield_params" | sed -n '3p')

local_target=$(echo "$local_yield_params" | sed -n '1p')
local_max=$(echo "$local_yield_params" | sed -n '2p')
local_adj=$(echo "$local_yield_params" | sed -n '3p')

printf "%-35s | %-45s | %-45s\n" "TargetVotingYield.target" "$mainnet_target" "$local_target"
printf "%-35s | %-45s | %-45s\n" "TargetVotingYield.max" "$mainnet_max" "$local_max"
printf "%-35s | %-45s | %-45s\n" "TargetVotingYield.adjustmentFactor" "$mainnet_adj" "$local_adj"
