#!/usr/bin/env bash
# Validates that a libraries file is from the previous release.
# Expected naming convention: $NETWORK-$PREVIOUS_BRANCH-libraries.json
# where PREVIOUS_BRANCH has version number N-1 relative to the current branch.
#
# Usage: validate_libraries_filename <libraries_path> <network> <branch>

validate_libraries_filename() {
  local LIBRARIES="$1"
  local NETWORK="$2"
  local BRANCH="$3"

  source scripts/bash/extract-release-version.sh
  extract_release_version "$BRANCH"
  local VERSION_NUMBER=$RELEASE_VERSION

  local PREVIOUS_VERSION=$((VERSION_NUMBER - 1))
  local PREVIOUS_BRANCH
  PREVIOUS_BRANCH=$(echo "$BRANCH" | sed "s/v${VERSION_NUMBER}/v${PREVIOUS_VERSION}/")

  local EXPECTED="$NETWORK-$PREVIOUS_BRANCH-libraries.json"
  local ACTUAL
  ACTUAL=$(basename "$LIBRARIES")

  if [ "$ACTUAL" != "$EXPECTED" ]; then
    echo "Error: Libraries file name '$ACTUAL' does not match expected format '$EXPECTED'." >&2
    echo "The libraries file must be from the previous release (v$PREVIOUS_VERSION), not the current one (v$VERSION_NUMBER)." >&2
    exit 1
  fi

}
