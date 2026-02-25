#!/usr/bin/env bash
# Validates that all addresses in a libraries JSON file have deployed bytecode.
#
# Usage: validate_libraries_bytecode <libraries_path> <rpc_url>

# Extracts the forno URL for a network from truffle-config-parent.js
get_forno_url() {
  local NETWORK="$1"
  local URL
  URL=$(yarn --silent ts-node scripts/bash/network-info.ts "$NETWORK" | jq -r '.rpcUrl')

  if [ $? -ne 0 ] || [ -z "$URL" ]; then
    echo "Error: Could not resolve forno URL for network '$NETWORK'" >&2
    exit 1
  fi

  echo "$URL"
}

validate_libraries_bytecode() {
  local LIBRARIES="$1"
  local RPC_URL="$2"

  if [ ! -f "$LIBRARIES" ]; then
    echo "Error: Libraries file '$LIBRARIES' not found." >&2
    exit 1
  fi

  if ! command -v cast &> /dev/null; then
    echo "Error: 'cast' command not found. Please install Foundry." >&2
    exit 1
  fi

  echo "Validating bytecode for libraries in $LIBRARIES using RPC $RPC_URL..."

  local HAS_ERROR=false

  for NAME in $(jq -r 'keys[]' "$LIBRARIES"); do
    local ADDRESS
    ADDRESS="0x$(jq -r --arg name "$NAME" '.[$name]' "$LIBRARIES")"

    local CODE
    CODE=$(cast code "$ADDRESS" --rpc-url "$RPC_URL" 2>/dev/null)

    if [ "$CODE" = "0x" ] || [ -z "$CODE" ]; then
      echo "Error: Library '$NAME' at $ADDRESS has no bytecode." >&2
      HAS_ERROR=true
    else
      echo "  $NAME ($ADDRESS): OK"
    fi
  done

  if [ "$HAS_ERROR" = true ]; then
    echo "Error: One or more libraries have no deployed bytecode. Aborting." >&2
    exit 1
  fi

  echo "All libraries have deployed bytecode."
}
