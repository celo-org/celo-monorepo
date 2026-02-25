#!/usr/bin/env bash
set -euo pipefail

# Simulates a governance proposal on a forked anvil instance.
#
# Flags:
#   -p: Path to the proposal JSON file.
#   -n: Network name (e.g., rc1, celo-sepolia).

PROPOSAL=""
NETWORK=""

while getopts 'p:n:' flag; do
  case "${flag}" in
    p) PROPOSAL="${OPTARG}" ;;
    n) NETWORK="${OPTARG}" ;;
    *) echo "Unexpected option ${flag}" >&2; exit 1 ;;
  esac
done

[ -z "$PROPOSAL" ] && echo "Need to set the proposal path via the -p flag" && exit 1;
[ -z "$NETWORK" ] && echo "Need to set the network via the -n flag" && exit 1;
[ ! -f "$PROPOSAL" ] && echo "Proposal file '$PROPOSAL' not found" && exit 1;

# Fetch all network metadata as JSON
NETWORK_INFO=$(yarn --silent ts-node scripts/bash/network-info.ts "$NETWORK")
RPC_URL=$(echo "$NETWORK_INFO" | jq -r '.rpcUrl')
PROPOSER=$(echo "$NETWORK_INFO" | jq -r '.proposer')
APPROVER=$(echo "$NETWORK_INFO" | jq -r '.approver')
VOTER=$(echo "$NETWORK_INFO" | jq -r '.voter')

echo "Network: $NETWORK"
echo "RPC URL: $RPC_URL"
echo "Proposer: $PROPOSER"
echo "Approver: $APPROVER"
echo "Voter: $VOTER"

# Fork the network with anvil
source scripts/foundry/constants.sh
scripts/foundry/start_anvil.sh -f "$RPC_URL" -a
ANVIL_RPC_URL=$(get_anvil_rpc_url)

# Impersonate governance accounts so celocli can send transactions from them
# this walks-around a cli trying to simulate a tx with the node tx
cast rpc anvil_impersonateAccount "$PROPOSER" --rpc-url "$ANVIL_RPC_URL"
cast rpc anvil_impersonateAccount "$APPROVER" --rpc-url "$ANVIL_RPC_URL"
cast rpc anvil_impersonateAccount "$VOTER" --rpc-url "$ANVIL_RPC_URL"

echo "Anvil forked $NETWORK at $ANVIL_RPC_URL"

# Verify the forked network is healthy
echo "Verifying Registry proxy implementation..."
REGISTRY_IMPL=$(cast call "$REGISTRY_ADDRESS" "_getImplementation() (address)" --rpc-url "$ANVIL_RPC_URL")
echo "Registry implementation: $REGISTRY_IMPL"
if [ "$REGISTRY_IMPL" = "0x0000000000000000000000000000000000000000" ]; then
  echo "Error: Registry has no implementation. Fork may not be working correctly." >&2
  kill $(lsof -t -i:$ANVIL_PORT) 2>/dev/null || true
  exit 1
fi

echo "Verifying network contracts..."
CONTRACTS_OUTPUT=$(NO_SYNCCHECK=true celocli network:contracts --node="$ANVIL_RPC_URL")
echo "$CONTRACTS_OUTPUT"

GOVERNANCE_ADDRESS=$(echo "$CONTRACTS_OUTPUT" | awk '/^Governance /{print $2}')
echo "Governance contract: $GOVERNANCE_ADDRESS"

# Propose
echo "Simulating proposal $PROPOSAL on $ANVIL_RPC_URL..."
PROPOSE_OUTPUT=$(NO_SYNCCHECK=true celocli governance:propose --jsonTransactions="$PROPOSAL" --from="$PROPOSER" --deposit=100e18 --descriptionURL="https://github.com/celo-org/governance/blob/main/CGPs/TEST" --node="$ANVIL_RPC_URL")
echo "$PROPOSE_OUTPUT"
PROPOSAL_ID=$(echo "$PROPOSE_OUTPUT" | grep "proposalId:" | awk '{print $2}')
echo "Proposal ID: $PROPOSAL_ID"

# Approve
NO_SYNCCHECK=true celocli governance:approve --proposalID="$PROPOSAL_ID" --from="$APPROVER" --node="$ANVIL_RPC_URL" && \
echo "Proposal approved"

# Vote
echo "Voting yes on proposal $PROPOSAL_ID..."
NO_SYNCCHECK=true celocli governance:vote --value=Yes --from="$VOTER" --proposalID="$PROPOSAL_ID" --node="$ANVIL_RPC_URL"
echo "Proposal voted"

# Fast-forward past the referendum period
REFERENDUM_DURATION=$(cast call "$GOVERNANCE_ADDRESS" "getReferendumStageDuration()(uint256)" --rpc-url "$ANVIL_RPC_URL")
echo "Referendum stage duration: $REFERENDUM_DURATION seconds"
cast rpc evm_increaseTime $((REFERENDUM_DURATION + 1)) --rpc-url "$ANVIL_RPC_URL"
cast rpc evm_mine --rpc-url "$ANVIL_RPC_URL"

# Execute
NO_SYNCCHECK=true celocli governance:execute --from="$VOTER" --proposalID="$PROPOSAL_ID" --node="$ANVIL_RPC_URL"
echo "Proposal executed"

# Cleanup
kill $(lsof -t -i:$ANVIL_PORT) 2>/dev/null || true
echo "Done."
