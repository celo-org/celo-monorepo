#!/usr/bin/env bash
set -euo pipefail

### This scripts builds map of selectors to avoid reliance on ffi through Foundry scripts and tests

# Create selectors dir
mkdir -p .tmp/selectors

# Iterate over contracts defined in constitution and build json map. The Proxy is a
# frozen Solidity 0.5 artifact (artifacts/solc-0.5), not part of the build, so its
# selectors come from the artifact's method identifiers, which forge inspect would
# otherwise report.
for contractName in $(jq -r keys[] governanceConstitution.json); do
  echo "Building selectors map for contract: $contractName"
  frozen="artifacts/solc-0.5/$contractName.sol/$contractName.json"
  if [ -f "$frozen" ]; then
    jq '.methodIdentifiers' "$frozen" > .tmp/selectors/$contractName.json
  else
    forge inspect $contractName methods --json > .tmp/selectors/$contractName.json
  fi
done
