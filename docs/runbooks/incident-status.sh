#!/usr/bin/env bash
# Read-only snapshot of every emergency lever described in the runbooks in this
# directory. Sends no transactions. Requires `cast` (Foundry).
#
# Addresses are resolved from the chain (the Celo Registry on L2, SystemConfig
# on L1) so the output stays correct across upgrades and redeployments.
#
# Usage:
#   ./incident-status.sh
#   L2_RPC_URL=http://127.0.0.1:8545 L1_RPC_URL=http://127.0.0.1:8546 ./incident-status.sh
set -euo pipefail

L2_RPC_URL="${L2_RPC_URL:-https://forno.celo.org}"
L1_RPC_URL="${L1_RPC_URL:-https://ethereum-rpc.publicnode.com}"
REGISTRY="${REGISTRY:-0x000000000000000000000000000000000000ce10}"
SYSTEM_CONFIG="${SYSTEM_CONFIG:-0x89E31965D844a309231B1f17759Ccaf1b7c09861}"

command -v cast >/dev/null || { echo "cast not found; install Foundry" >&2; exit 1; }

l2() { cast call "$@" --rpc-url "$L2_RPC_URL"; }
l1() { cast call "$@" --rpc-url "$L1_RPC_URL"; }
registered() { l2 "$REGISTRY" "getAddressForStringOrDie(string)(address)" "$1"; }
row() { printf '  %-34s %s\n' "$1" "$2"; }

echo "== L2 core contracts ($L2_RPC_URL, block $(cast block-number --rpc-url "$L2_RPC_URL"))"
GOVERNANCE=$(registered Governance)
FREEZER=$(registered Freezer)
row "Governance" "$GOVERNANCE"
row "hotfix approver" "$(l2 "$GOVERNANCE" 'approver()(address)')"
row "hotfix security council" "$(l2 "$GOVERNANCE" 'securityCouncil()(address)')"
row "hotfix execution window (s)" "$(l2 "$GOVERNANCE" 'hotfixExecutionTimeWindow()(uint256)')"
row "Freezer" "$FREEZER (owner $(l2 "$FREEZER" 'owner()(address)'))"
for name in EpochRewards FeeHandler; do
  row "frozen: $name" "$(l2 "$FREEZER" 'isFrozen(address)(bool)' "$(registered "$name")")"
done
for name in Election LockedGold; do
  target=$(registered "$name")
  row "blocked: $name" "$(l2 "$target" 'isBlocked()(bool)') (blocker $(l2 "$target" 'getBlockedByContract()(address)'))"
done

echo "== L1 bridge contracts ($L1_RPC_URL, block $(cast block-number --rpc-url "$L1_RPC_URL"))"
PORTAL=$(l1 "$SYSTEM_CONFIG" 'optimismPortal()(address)')
SUPERCHAIN_CONFIG=$(l1 "$SYSTEM_CONFIG" 'superchainConfig()(address)')
ANCHOR_REGISTRY=$(l1 "$PORTAL" 'anchorStateRegistry()(address)')
row "SystemConfig" "$SYSTEM_CONFIG (owner $(l1 "$SYSTEM_CONFIG" 'owner()(address)'))"
row "SuperchainConfig" "$SUPERCHAIN_CONFIG"
row "pause guardian" "$(l1 "$SUPERCHAIN_CONFIG" 'guardian()(address)')"
row "paused" "$(l1 "$SUPERCHAIN_CONFIG" 'paused()(bool)')"
row "OptimismPortal" "$PORTAL (paused $(l1 "$PORTAL" 'paused()(bool)'))"
row "proof maturity delay (s)" "$(l1 "$PORTAL" 'proofMaturityDelaySeconds()(uint256)')"
row "AnchorStateRegistry" "$ANCHOR_REGISTRY"
row "respected game type" "$(l1 "$ANCHOR_REGISTRY" 'respectedGameType()(uint32)')"
row "retirement timestamp" "$(l1 "$ANCHOR_REGISTRY" 'retirementTimestamp()(uint64)')"
row "game finality delay (s)" "$(l1 "$ANCHOR_REGISTRY" 'disputeGameFinalityDelaySeconds()(uint256)')"
row "anchor game" "$(l1 "$ANCHOR_REGISTRY" 'anchorGame()(address)')"
