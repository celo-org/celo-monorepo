#!/usr/bin/env bash
set -euo pipefail

### This scripts builds map of selectors to avoid reliance on ffi through Foundry scripts and tests

# Create selectors dir
mkdir -p .tmp/selectors

# Iterate over contracts defined in constitution and build json map. The Proxy is a
# Solidity 0.5 contract and so absent from the default profile's build that forge inspect
# reads; its selectors come from the method identifiers of the solc05 build instead (the
# devchain script builds that profile earlier in its run). Only artifacts compiled from
# contracts-0.5 itself count: that build tree also holds the vendored Mento dependencies,
# which must never shadow a 0.8 implementation of the same name.
for contractName in $(jq -r keys[] governanceConstitution.json); do
  echo "Building selectors map for contract: $contractName"
  solc05_artifact="out-solc-0.5/$contractName.sol/$contractName.json"
  if [ -f "$solc05_artifact" ] && jq -e '.metadata.settings.compilationTarget | keys[0] | startswith("contracts-0.5/")' "$solc05_artifact" > /dev/null; then
    jq '.methodIdentifiers' "$solc05_artifact" > .tmp/selectors/$contractName.json
  else
    forge inspect $contractName methods --json > .tmp/selectors/$contractName.json
  fi
done
