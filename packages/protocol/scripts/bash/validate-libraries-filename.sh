#!/usr/bin/env bash
# Validates that a libraries file follows the naming convention: $NETWORK-$BRANCH-libraries.json
#
# Usage: validate_libraries_filename <libraries_path> <network> <branch>

validate_libraries_filename() {
  local LIBRARIES="$1"
  local NETWORK="$2"
  local BRANCH="$3"

  local EXPECTED="$NETWORK-$BRANCH-libraries.json"
  local ACTUAL
  ACTUAL=$(basename "$LIBRARIES")

  if [ "$ACTUAL" != "$EXPECTED" ]; then
    echo "Error: Libraries file name '$ACTUAL' does not match expected format '$EXPECTED'." >&2
    echo "The libraries file must be named \$NETWORK-\$BRANCH-libraries.json" >&2
    exit 1
  fi

}
