#!/usr/bin/env bash
# Utilities for libraries file naming convention: $NETWORK-$BRANCH-libraries.json

get_libraries_filename() {
  local NETWORK="$1"
  local BRANCH="$2"
  echo "$NETWORK-$BRANCH-libraries.json"
}

get_previous_libraries_filename() {
  local NETWORK="$1"
  local BRANCH="$2"
  local VERSION_NUMBER
  VERSION_NUMBER=$(echo "$BRANCH" | grep -o 'v[0-9]\+' | tr -dc '0-9')

  if [ -z "$VERSION_NUMBER" ] || [ "$VERSION_NUMBER" -lt 1 ]; then
    echo "Error: Could not extract a valid version number from branch '$BRANCH'." >&2
    echo "Branch must match the pattern *vN (e.g., core-contracts.v15)." >&2
    return 1
  fi

  local PREVIOUS_VERSION=$((VERSION_NUMBER - 1))
  local PREVIOUS_BRANCH
  PREVIOUS_BRANCH=$(echo "$BRANCH" | sed "s/v${VERSION_NUMBER}/v${PREVIOUS_VERSION}/")

  get_libraries_filename "$NETWORK" "$PREVIOUS_BRANCH"
}

validate_libraries_filename() {
  local LIBRARIES="$1"
  local NETWORK="$2"
  local BRANCH="$3"

  local EXPECTED
  EXPECTED=$(get_previous_libraries_filename "$NETWORK" "$BRANCH") || exit 1

  local ACTUAL
  ACTUAL=$(basename "$LIBRARIES")

  if [ "$ACTUAL" != "$EXPECTED" ]; then
    local VERSION_NUMBER
    VERSION_NUMBER=$(echo "$BRANCH" | grep -o 'v[0-9]\+' | tr -dc '0-9')
    local PREVIOUS_VERSION=$((VERSION_NUMBER - 1))
    echo "Error: Libraries file name '$ACTUAL' does not match expected format '$EXPECTED'." >&2
    echo "The libraries file must be from the previous release (v$PREVIOUS_VERSION), not the current one (v$VERSION_NUMBER)." >&2
    exit 1
  fi
}
