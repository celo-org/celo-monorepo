#!/usr/bin/env bash
set -euo pipefail

### This scripts builds map of selectors to avoid reliance on ffi through Foundry scripts and tests

# Create selectors dir
mkdir .tmp/selectors

# Iterate over contracts defined in constitution and build json map
for contractName in $(jq -r keys[] governanceConstitution.json | grep -v proxy); do
  echo "Building selectors map for contract: $contractName"
  forge inspect $contractName methods --json > .tmp/selectors/$contractName.json
done
