#!/usr/bin/env bash
set -euo pipefail

# Foundry-based bytecode verification script.
# 
# Checks that Solidity sources on a given branch correspond to bytecodes
# deployed to a Celo system on the given network, using Foundry for compilation.
#
# Flags:
# -b: Branch containing smart contracts that currently comprise the Celo protocol
# -n: The network to check
# -f: Boolean flag to indicate if the Forno service should be used to connect to
#     the network
# -l: Path to a file to which logs should be appended

BRANCH=""
NETWORK=""
FORNO=""
LOG_FILE="/dev/stdout"

while getopts 'b:n:fl:' flag; do
  case "${flag}" in
    b) BRANCH="${OPTARG}" ;;
    n) NETWORK="${OPTARG}" ;;
    f) FORNO="--forno" ;;
    l) LOG_FILE="${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$BRANCH" ] && echo "Need to set the branch via the -b flag" && exit 1;
[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;

# Source release library functions
source scripts/bash/release-lib.sh

echo "Checking out branch $BRANCH..."
CURRENT_HASH=$(git log -n 1 --oneline | cut -c 1-9)

# Save the current foundry.toml to preserve profiles
FOUNDRY_TOML_BACKUP=$(mktemp)
cp foundry.toml "$FOUNDRY_TOML_BACKUP"

# Cleanup function to restore original branch and foundry.toml
cleanup() {
  local exit_code=$?
  # Restore foundry.toml first
  if [ -f "$FOUNDRY_TOML_BACKUP" ]; then
    cp "$FOUNDRY_TOML_BACKUP" foundry.toml
    rm "$FOUNDRY_TOML_BACKUP"
  fi
  if [ -n "$CURRENT_HASH" ]; then
    echo "Restoring original branch contracts..."
    checkout_build_sources "$CURRENT_HASH" /dev/null -s 2>/dev/null
  fi
  exit $exit_code
}

# Set trap to always restore original branch on exit
trap cleanup EXIT INT TERM

# Checkout the contracts from the specified branch
git fetch origin +'refs/tags/core-contracts.v*:refs/tags/core-contracts.v*' >/dev/null 2>&1
checkout_build_sources "$BRANCH" /dev/null

# Restore the foundry.toml from current branch (which has the profiles we need)
cp "$FOUNDRY_TOML_BACKUP" foundry.toml

echo "Building contracts with Foundry..."

# Build using Foundry truffle-compat profiles for both Solidity versions
echo "Building Solidity 0.5.13 contracts (truffle-compat profile)..."
FOUNDRY_PROFILE=truffle-compat forge build

echo "Building Solidity 0.8.19 contracts (truffle-compat8 profile)..."
FOUNDRY_PROFILE=truffle-compat8 forge build

# Determine build directories based on profiles
BUILD_DIR_05="out-truffle-compat"
BUILD_DIR_08="out-truffle-compat-0.8"

echo "Build completed. Output directories: $BUILD_DIR_05 and $BUILD_DIR_08"

# Determine RPC URL based on network
case "$NETWORK" in
  mainnet)
    RPC_URL="${RPC_URL:-https://forno.celo.org}"
    ;;
  alfajores)
    RPC_URL="${RPC_URL:-https://alfajores-forno.celo-testnet.org}"
    ;;
  baklava)
    RPC_URL="${RPC_URL:-https://baklava-forno.celo-testnet.org}"
    ;;
  *)
    RPC_URL="${RPC_URL:-http://localhost:8545}"
    ;;
esac

# Override with forno if flag is set
if [ -n "$FORNO" ]; then
  case "$NETWORK" in
    mainnet)
      RPC_URL="https://forno.celo.org"
      ;;
    alfajores)
      RPC_URL="https://alfajores-forno.celo-testnet.org"
      ;;
    baklava)
      RPC_URL="https://baklava-forno.celo-testnet.org"
      ;;
  esac
fi

echo "Using RPC URL: $RPC_URL"

# Run the Foundry verification script using ts-node
echo "Running Foundry bytecode verification..."
yarn ts-node ./scripts/foundry/verify-bytecode.ts \
  --network "$NETWORK" \
  --rpc_url "$RPC_URL" \
  --build_artifacts "$BUILD_DIR_05" \
  --branch "$BRANCH" \
  --librariesFile "libraries-foundry.json"

echo "Verification completed successfully!"

# Cleanup trap will restore the original branch automatically

