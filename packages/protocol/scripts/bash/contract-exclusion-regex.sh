#!/usr/bin/env bash
set -euo pipefail

# Exclude test contracts, mock contracts, contract interfaces, Proxy contracts, inlined libraries,
# MultiSig contracts, and the ReleaseGold contract.
CONTRACT_EXCLUSION_REGEX=".*Test|Mock.*|I[A-Z].*|.*Proxy|MultiSig.*|ReleaseGold|SlasherUtil|UsingPrecompiles|CeloFeeCurrencyAdapterOwnable|FeeCurrencyAdapter|FeeCurrencyAdapterOwnable|IsL2Check|Blockable|PrecompilesOverride|CompileExchange|PrecompilesOverrideV2|UsingRegistryV2NoMento|GasSponsoredOFTBridge"

echo "BRANCH: $BRANCH"

# Before CR7, UsingRegistry and UsingRegistryV2 had been deployed, they need to keep getting deployed to keep the release reports without changes.
source scripts/bash/extract-release-version.sh
extract_release_version "$BRANCH"
VERSION_NUMBER=$RELEASE_VERSION

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

# SortedOracles is owned and upgraded by Mento, and AddressSortedLinkedListWithMedian is
# the library only it links. Reports against CR17 or later (the CR18 release onwards)
# leave both out, matching the release and verification tooling.
if [ $VERSION_NUMBER -ge 17 ]
  then
  CONTRACT_EXCLUSION_REGEX="$CONTRACT_EXCLUSION_REGEX|SortedOracles|AddressSortedLinkedListWithMedian"
fi

# CalledByVm and SuperBridgeETHWrapper are unversioned helpers: neither is a registry
# contract and neither declares getVersionNumber, so neither can answer the version bump
# that a code change asks for. Recompiling with a newer Solidity changes the code of every
# contract, which is what first asked them for one. GasSponsoredOFTBridge, the contract
# SuperBridgeETHWrapper sits beside, is left out above for the same reason. The number is
# the release being compared against, as in the block above, so 17 is what the CR18
# release reads; the snapshots committed for earlier releases compare from 16 or lower.
if [ $VERSION_NUMBER -ge 17 ]
  then
  CONTRACT_EXCLUSION_REGEX="$CONTRACT_EXCLUSION_REGEX|CalledByVm|SuperBridgeETHWrapper"
fi

echo "FULL CONTRACT_EXCLUSION_REGEX: $CONTRACT_EXCLUSION_REGEX"
