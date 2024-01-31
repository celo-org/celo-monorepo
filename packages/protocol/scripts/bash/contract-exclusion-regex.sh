#!/usr/bin/env bash
set -euo pipefail

# Exclude test contracts, mock contracts, contract interfaces, Proxy contracts, inlined libraries,
# MultiSig contracts, and the ReleaseGold contract.
CONTRACT_EXCLUSION_REGEX=".*Test|Mock.*|I[A-Z].*|.*Proxy|MultiSig.*|ReleaseGold|SlasherUtil|UsingPrecompiles"

# Before CR7, UsingRegistry and UsingRegistryV2 had been deployed, they need to keep getting deployed to keep the release reports without changes.
VERSION_NUMBER=$(echo "$BRANCH" | tr -dc '0-9')

if [ $VERSION_NUMBER -gt 6 ]
  then
  CONTRACT_EXCLUSION_REGEX="$CONTRACT_EXCLUSION_REGEX|^UsingRegistry"
fi

if [ $VERSION_NUMBER -gt 8 ]
  then
  CONTRACT_EXCLUSION_REGEX="$CONTRACT_EXCLUSION_REGEX|^Ownable|Initializable|BLS12_377Passthrough|BLS12_381Passthrough]UniswapV2ERC20"
fi

  # https://github.com/celo-org/celo-monorepo/issues/10435
  # SortedOracles is currently not deployable
  # after fixing that this should be modified to VERSION_NUMBER==10
if [ $VERSION_NUMBER -gt 9 ]
  then
  CONTRACT_EXCLUSION_REGEX="$CONTRACT_EXCLUSION_REGEX|SortedOracles"
fi
