#!/usr/bin/env bash
set -euo pipefail

### This scripts builds map of selectors to avoid reliance on ffi through Foundry scripts and tests

# Read environment variables and constants
source $PWD/scripts/foundry/constants.sh

# Create selectors dir
mkdir -p .tmp/selectors

# Iterate over contracts defined in constitution and build json map
for contractName in $(jq -r keys[] governanceConstitution.json); do
  echo "Building selectors map for contract: $contractName"
  $FORGE inspect $contractName methods --json > .tmp/selectors/$contractName.json
done
