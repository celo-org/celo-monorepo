#!/bin/bash
set -e

# Script to generate initial state for devchain
# This script starts anvil, runs the L2Genesis forge script, and converts the state to anvil format

CONTRACTS_BEDROCK_DIR=""
ANVIL_PORT="9545"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --contracts-dir)
      CONTRACTS_BEDROCK_DIR="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

if [[ -z "$CONTRACTS_BEDROCK_DIR" ]]; then
  echo "Error: --contracts-dir is required"
  exit 1
fi

cd "$CONTRACTS_BEDROCK_DIR"

# Start anvil in background
anvil --celo --port "$ANVIL_PORT" --code-size-limit 245760 &
ANVIL_PID=$!

# Wait for anvil to be ready
while ! nc -z localhost "$ANVIL_PORT"; do
  sleep 0.5
done

# Run the forge script
DEPLOY_CONFIG_PATH=deploy-config/celo-devnet.json forge script \
  --rpc-url "http://localhost:$ANVIL_PORT" \
  --broadcast \
  --private-key ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --sig "runCeloDevnet()" \
  scripts/L2Genesis.s.sol:L2Genesis

# Kill anvil
kill $ANVIL_PID

# Convert state to anvil format
python3 convert_to_anvil_state.py state-dump-11142220-granite.json anvil-state.json
