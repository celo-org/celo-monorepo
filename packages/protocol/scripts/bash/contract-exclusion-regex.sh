# Exclude test contracts, mock contracts, contract interfaces, Proxy contracts, inlined libraries,
# MultiSig contracts, and the ReleaseGold contract.
CONTRACT_EXCLUSION_REGEX=".*Test|Mock.*|I[A-Z].*|.*Proxy|MultiSig.*|ReleaseGold|SlasherUtil|UsingPrecompiles"

# Before CR7, UsingRegistry and UsingRegistryV2 had been deployed, they need to keep getting deployed to keep the release reports without changes.
VERSION_NUMBER=$(echo "$OLD_BRANCH" | tr -dc '0-9')

if [ $VERSION_NUMBER -gt 6 ]
  then
  CONTRACT_EXCLUSION_REGEX="$CONTRACT_EXCLUSION_REGEX|^UsingRegistry"
fi


if [ $VERSION_NUMBER -gt 8 ]
  then
  # keeping track of contracts moved to other repos so they are ignored in version check and deployment
  # for other packages, like attestations, this may not be expected, as releasing it may be important as well.
  echo "Ignoring Mento contracts"
  CONTRACT_EXCLUSION_REGEX="$CONTRACT_EXCLUSION_REGEX|^Exchange|ˆStableToken|ˆGrandaMento|ˆReserve"
fi