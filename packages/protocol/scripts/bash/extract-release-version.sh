#!/usr/bin/env bash
# Extracts the release version number from a ref name.
# Usage: extract_release_version <ref>
# Sets RELEASE_VERSION to the numeric version, accepting both ref forms the release
# tooling uses: a tag such as core-contracts.v16 (also core-contracts.v16-sepolia-head)
# and a branch such as release/core-contracts/16.

extract_release_version() {
  local REF="$1"
  RELEASE_VERSION=$(echo "$REF" | grep -oE 'core-contracts\.v[0-9]+' | head -1 | grep -oE '[0-9]+$' || true)
  if [ -z "$RELEASE_VERSION" ]; then
    RELEASE_VERSION=$(echo "$REF" | grep -oE 'release/core-contracts/[0-9]+' | head -1 | grep -oE '[0-9]+$' || true)
  fi

  if [ -z "$RELEASE_VERSION" ] || [ "$RELEASE_VERSION" -lt 1 ]; then
    echo "Error: Could not extract a valid version number from ref '$REF'." >&2
    echo "Use core-contracts.vN or release/core-contracts/N." >&2
    exit 1
  fi
}
