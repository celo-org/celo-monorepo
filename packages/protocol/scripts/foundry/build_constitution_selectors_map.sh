#!/usr/bin/env bash
set -euo pipefail

### This scripts builds map of selectors to avoid reliance on ffi through Foundry scripts and tests

# Create selectors dir
mkdir -p .tmp/selectors

# Iterate over contracts defined in constitution and build json map from the artifacts the
# caller has already built (forge inspect re-opens the whole project for every contract,
# several seconds apiece, for the same methodIdentifiers field). The Proxy is a Solidity 0.5
# contract and so absent from the default build; its selectors come from the solc05 build.
# Only artifacts compiled from contracts-0.5 itself count there: that build tree also holds
# the vendored Mento dependencies, which must never shadow a 0.8 implementation of the same
# name.
for contractName in $(jq -r keys[] governanceConstitution.json); do
  echo "Building selectors map for contract: $contractName"
  artifact="out/$contractName.sol/$contractName.json"
  solc05_artifact="out-solc-0.5/$contractName.sol/$contractName.json"
  if [ -f "$solc05_artifact" ] && jq -e '.metadata.settings.compilationTarget | keys[0] | startswith("contracts-0.5/")' "$solc05_artifact" > /dev/null; then
    artifact="$solc05_artifact"
  elif [ ! -f "$artifact" ]; then
    echo "Missing artifact $artifact: build the 0.8 contracts before mapping selectors" >&2
    exit 1
  fi
  jq '.methodIdentifiers' "$artifact" > .tmp/selectors/$contractName.json
done
