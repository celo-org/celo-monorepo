#!/usr/bin/env bash
# Utilities for the libraries file naming convention: $NETWORK-$REF-libraries.json, where
# $REF is the ref the file was produced for with slashes replaced by underscores.
#
# make-release links the libraries of the release before the one it builds, and that
# release is always a tag, so the file it expects is the one verify-deployed writes for
# core-contracts.v(N-1) whatever form the new ref takes (core-contracts.vN,
# core-contracts.vN-<suffix> for a rehearsal, or release/core-contracts/N).

source "$(dirname "${BASH_SOURCE[0]}")/extract-release-version.sh"

get_libraries_filename() {
  local NETWORK="$1"
  local REF="$2"
  echo "$NETWORK-$(echo "$REF" | sed -e 's#/#_#g')-libraries.json"
}

get_previous_libraries_filename() {
  local NETWORK="$1"
  local REF="$2"
  extract_release_version "$REF"
  if [ "$RELEASE_VERSION" -lt 2 ]; then
    echo "Error: no release precedes '$REF'." >&2
    return 1
  fi
  get_libraries_filename "$NETWORK" "core-contracts.v$((RELEASE_VERSION - 1))"
}

validate_libraries_filename() {
  local LIBRARIES="$1"
  local NETWORK="$2"
  local REF="$3"

  local EXPECTED
  EXPECTED=$(get_previous_libraries_filename "$NETWORK" "$REF") || exit 1

  local ACTUAL
  ACTUAL=$(basename "$LIBRARIES")

  if [ "$ACTUAL" != "$EXPECTED" ]; then
    echo "Error: Libraries file name '$ACTUAL' does not match expected format '$EXPECTED'." >&2
    echo "The libraries file must be the one verify-deployed produced for the previous release." >&2
    exit 1
  fi
}
