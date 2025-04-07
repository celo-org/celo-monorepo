#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Options:
  --create      Create and migrate Anvil devchain.
  --snapshot    Take a snapshot of the current devchain state.
  --restore     Restore the devchain state from a snapshot.
  --run         Run end-to-end tests.
  --stop        Stop the Anvil devchain.
  --help        Display this help message.

Note:
  If no options are provided, the default behavior is to run: create, run, and stop.
EOF
  exit 1
}

CREATE=false
RESTORE=false
RUN=false
SNAPSHOT=false
STOP=false

# Parse parameters
if [ "$#" -gt 0 ]; then
  while [[ "$#" -gt 0 ]]; do
    case $1 in
      --create)    CREATE=true ;;
      --restore)   RESTORE=true ;;
      --run)       RUN=true ;;
      --snapshot)  SNAPSHOT=true ;;
      --stop)      STOP=true ;;
      --help)      usage ;;
      *)           echo "Unknown parameter: $1" ; usage ;;
    esac
    shift
  done
else
  # Default behavior: create, run, and stop if no flags provided.
  CREATE=true
  RUN=true
  STOP=true
fi

source "$PWD/scripts/foundry/constants.sh"

SNAPSHOT_FILE="/tmp/anvil_snapshot_id.txt"

check_anvil_running() {
  local RESPONSE
  RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"web3_clientVersion","params":[],"id":1}' \
    "$ANVIL_RPC_URL") || {
      echo "Error: Anvil is not running at $ANVIL_RPC_URL."
      exit 1
    }
  if ! echo "$RESPONSE" | grep -q '"result"'; then
    echo "Error: Received an invalid response from Anvil. Please ensure Anvil is running correctly."
    exit 1
  fi
}

create_devchain() {
  echo "=== Creating & Migrating Anvil Devchain ==="
  source "$PWD/scripts/foundry/create_and_migrate_anvil_devchain.sh"

  echo URL: "$ANVIL_RPC_URL"
}

create_snapshot() {
  check_anvil_running

  echo "=== Taking Snapshot ==="
  local SNAPSHOT_ID
  SNAPSHOT_ID=$(curl -s \
    -X POST \
    -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"evm_snapshot","params":[],"id":1}' \
    "$ANVIL_RPC_URL" | jq -r '.result')

  if [ -z "$SNAPSHOT_ID" ] || [ "$SNAPSHOT_ID" = "null" ]; then
    echo "Error: Failed to create snapshot. Please check that Anvil is running correctly."
    exit 1
  fi

  echo "$SNAPSHOT_ID" > "$SNAPSHOT_FILE"
  echo "Snapshot ID: $SNAPSHOT_ID"
}

restore_devchain() {
  check_anvil_running

  if [ ! -f "$SNAPSHOT_FILE" ]; then
    echo "No snapshot file found at $SNAPSHOT_FILE. Did you run --create or --snapshot first?"
    exit 1
  fi

  local SNAPSHOT_ID
  SNAPSHOT_ID=$(cat "$SNAPSHOT_FILE")

  echo "=== Restoring Snapshot $SNAPSHOT_ID ==="
  local REVERT_RESULT
  REVERT_RESULT=$(curl -s \
    -X POST \
    -H "Content-Type: application/json" \
    --data "{\"jsonrpc\":\"2.0\",\"method\":\"evm_revert\",\"params\":[\"$SNAPSHOT_ID\"],\"id\":2}" \
    "$ANVIL_RPC_URL" | jq -r '.result')

  if [ "$REVERT_RESULT" != "true" ]; then
    echo "Error: Snapshot revert failed. Exiting."
    exit 1
  fi

  echo "=== Taking Fresh Snapshot After Restore ==="
  local NEW_SNAPSHOT_ID
  NEW_SNAPSHOT_ID=$(curl -s \
    -X POST \
    -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"evm_snapshot","params":[],"id":3}' \
    "$ANVIL_RPC_URL" | jq -r '.result')

  if [ -z "$NEW_SNAPSHOT_ID" ] || [ "$NEW_SNAPSHOT_ID" = "null" ]; then
    echo "Error: Failed to take a fresh snapshot after restore. Please check Anvil."
    exit 1
  fi

  echo "$NEW_SNAPSHOT_ID" > "$SNAPSHOT_FILE"
  echo "New snapshot ID: $NEW_SNAPSHOT_ID"
}

run_e2e_tests() {
  check_anvil_running

  echo "=== Running E2E Tests ==="
  time FOUNDRY_PROFILE=devchain forge test \
    -vvv \
    --match-path "*test-sol/devchain/e2e/*" \
    --isolate \
    --fork-url "$ANVIL_RPC_URL"
}

stop_devchain() {
  if ! curl -s "$ANVIL_RPC_URL" > /dev/null; then
    echo "Warning: Anvil does not appear to be running. Nothing to stop."
    return
  fi
  echo "Stopping devchain..."
  source "$PWD/scripts/foundry/stop_anvil.sh"
}

if [ "$CREATE" = true ]; then
  create_devchain
fi

if [ "$SNAPSHOT" = true ]; then
  create_snapshot
fi

if [ "$RUN" = true ]; then
  run_e2e_tests
fi

if [ "$RESTORE" = true ]; then
  restore_devchain
fi

if [ "$STOP" = true ]; then
  stop_devchain
fi
