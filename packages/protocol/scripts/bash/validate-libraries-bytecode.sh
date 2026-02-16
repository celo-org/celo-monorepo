#!/usr/bin/env bash
# Validates that all addresses in a libraries JSON file have deployed bytecode.
#
# Usage: validate_libraries_bytecode <libraries_path> <rpc_url>

# Extracts the forno URL for a network from truffle-config-parent.js
get_forno_url() {
  local NETWORK="$1"
  local CONFIG_FILE="truffle-config-parent.js"

  if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: $CONFIG_FILE not found." >&2
    exit 1
  fi

  local URL
  URL=$(node -e "
    const fs = require('fs');
    const src = fs.readFileSync('$CONFIG_FILE', 'utf8');
    const match = src.match(/const fornoUrls\s*=\s*(\{[^}]+\})/s);
    if (!match) { process.exit(1); }
    const urls = eval('(' + match[1] + ')');
    const url = urls['$NETWORK'];
    if (!url) { process.stderr.write('No forno URL for network $NETWORK\n'); process.exit(1); }
    process.stdout.write(url);
  ")

  if [ $? -ne 0 ] || [ -z "$URL" ]; then
    echo "Error: Could not resolve forno URL for network '$NETWORK' from $CONFIG_FILE" >&2
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
