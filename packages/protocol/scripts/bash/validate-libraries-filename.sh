#!/usr/bin/env bash
# Utilities for the libraries file naming convention: $NETWORK-$REF-libraries.json, where
# $REF is the ref the file was produced for with slashes replaced by underscores.
#
# make-release links the libraries of the release before the one it builds, and
# verify-deployed writes that file under the name of whichever ref of that release was
# verified: the release tag (core-contracts.v17), a variant of it
# (core-contracts.v17.post-audit, core-contracts.v17-sepolia-head) or the release branch
# (release/core-contracts/17). The validation therefore pins the network and the release
# the file belongs to, not one exact ref name, so that the file verify-deployed just wrote
# is accepted without an operator renaming it.

source "$(dirname "${BASH_SOURCE[0]}")/extract-release-version.sh"

get_libraries_filename() {
  local NETWORK="$1"
  local REF="$2"
  echo "$NETWORK-$(echo "$REF" | sed -e 's#/#_#g')-libraries.json"
}

# Sets PREVIOUS_RELEASE_VERSION to the version of the release that precedes $REF.
extract_previous_release_version() {
  local REF="$1"
  extract_release_version "$REF"
  PREVIOUS_RELEASE_VERSION=$((RELEASE_VERSION - 1))
  if [ "$PREVIOUS_RELEASE_VERSION" -lt 1 ]; then
    echo "Error: no release precedes '$REF'." >&2
    return 1
  fi
}

# The canonical name of the previous release's libraries file, i.e. the one written for
# its release tag.
get_previous_libraries_filename() {
  local NETWORK="$1"
  local REF="$2"
  extract_previous_release_version "$REF" || return 1
  get_libraries_filename "$NETWORK" "core-contracts.v$PREVIOUS_RELEASE_VERSION"
}

# Prints the ref a $NETWORK-$REF-libraries.json name was produced for, with the
# underscores turned back into the slashes of a branch ref. Fails if the name does not
# follow the convention.
extract_libraries_ref() {
  local FILENAME="$1"
  local NETWORK="$2"
  case "$FILENAME" in
    "$NETWORK"-?*-libraries.json) ;;
    *) return 1 ;;
  esac
  local REF="${FILENAME#"$NETWORK"-}"
  echo "${REF%-libraries.json}" | sed -e 's#_#/#g'
}

# Succeeds if $REF names release $VERSION, in any of the forms the release tooling uses.
libraries_ref_names_release() {
  local REF="$1"
  local VERSION="$2"
  case "$REF" in
    "core-contracts.v$VERSION" | "core-contracts.v$VERSION"[!0-9]*) return 0 ;;
    "release/core-contracts/$VERSION" | "release/core-contracts/$VERSION"[!0-9]*) return 0 ;;
    *) return 1 ;;
  esac
}

validate_libraries_filename() {
  local LIBRARIES="$1"
  local NETWORK="$2"
  local REF="$3"

  extract_previous_release_version "$REF" || exit 1

  local ACTUAL
  ACTUAL=$(basename "$LIBRARIES")

  local ACTUAL_REF
  ACTUAL_REF=$(extract_libraries_ref "$ACTUAL" "$NETWORK") || ACTUAL_REF=""

  if ! libraries_ref_names_release "$ACTUAL_REF" "$PREVIOUS_RELEASE_VERSION"; then
    echo "Error: Libraries file name '$ACTUAL' was not produced for release $PREVIOUS_RELEASE_VERSION on '$NETWORK'." >&2
    echo "Expected '$(get_libraries_filename "$NETWORK" "core-contracts.v$PREVIOUS_RELEASE_VERSION")', or the same file named after another ref of that release." >&2
    echo "The libraries file must be the one verify-deployed produced for the previous release." >&2
    exit 1
  fi
}
