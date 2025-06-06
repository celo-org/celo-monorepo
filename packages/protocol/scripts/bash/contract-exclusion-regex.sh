#!/usr/bin/env bash
set -euo pipefail

# Exclude test contracts, mock contracts, contract interfaces, Proxy contracts, inlined libraries,
# MultiSig contracts, and the ReleaseGold contract.
CONTRACT_EXCLUSION_REGEX=".*Test|Mock.*|I[A-Z].*|.*Proxy|MultiSig.*|ReleaseGold|SlasherUtil|UsingPrecompiles|CeloFeeCurrencyAdapterOwnable|FeeCurrencyAdapter|FeeCurrencyAdapterOwnable|IsL2Check|Blockable|PrecompilesOverride|CompileExchange|PrecompilesOverrideV2|UsingRegistryV2NoMento"

echo "BRANCH: $BRANCH"

# Before CR7, UsingRegistry and UsingRegistryV2 had been deployed, they need to keep getting deployed to keep the release reports without changes.
VERSION_NUMBER=$(echo "$BRANCH" | grep -o 'v[0-9]\+' | tr -dc '0-9')

echo "VERSION_NUMBER: $VERSION_NUMBER"

if [ $VERSION_NUMBER -gt 6 ]
  then
  CONTRACT_EXCLUSION_REGEX="$CONTRACT_EXCLUSION_REGEX|^UsingRegistry"
fi

if [ $VERSION_NUMBER -gt 8 ]
  then
  CONTRACT_EXCLUSION_REGEX="$CONTRACT_EXCLUSION_REGEX|^Ownable|Initializable|BLS12_377Passthrough|BLS12_381Passthrough]UniswapV2ERC20|ReentrancyGuard"
fi

# In CR9 the SortedOracles contract was deployed by Mento team, in CR10 we redeployed it ourselves
if [ $VERSION_NUMBER -eq 9 ]
  then
  CONTRACT_EXCLUSION_REGEX="$CONTRACT_EXCLUSION_REGEX|SortedOracles"
fi

if [ $VERSION_NUMBER -eq 11 ]
  then
  # FeeHandlerSeller is not deployed, only its children
  CONTRACT_EXCLUSION_REGEX="$CONTRACT_EXCLUSION_REGEX|\\bFeeHandlerSeller\\b"
fi

if [ $VERSION_NUMBER -gt 11 ]
  then
  # FeeHandlerSeller is not deployed, only its children
  CONTRACT_EXCLUSION_REGEX="$CONTRACT_EXCLUSION_REGEX|MockElection|\\bFeeHandlerSeller\\b"
fi

echo "FULL CONTRACT_EXCLUSION_REGEX: $CONTRACT_EXCLUSION_REGEX"