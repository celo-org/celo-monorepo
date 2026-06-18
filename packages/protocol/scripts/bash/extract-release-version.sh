#!/usr/bin/env bash
# Extracts the release version number from a branch name.
# Usage: extract_release_version <branch>
# Sets RELEASE_VERSION to the numeric version (e.g., 16 from core-contracts.v16-sepolia).

extract_release_version() {
  local BRANCH="$1"
  RELEASE_VERSION=$(echo "$BRANCH" | grep -o 'v[0-9]\+' | tr -dc '0-9')

  if [ -z "$RELEASE_VERSION" ] || [ "$RELEASE_VERSION" -lt 1 ]; then
    echo "Error: Could not extract a valid version number from branch '$BRANCH'." >&2
    echo "Branch must match the pattern *vN (e.g., core-contracts.v16)." >&2
    exit 1
  fi
}
