#!/usr/bin/env bash
# Validates that a report file follows the expected naming convention.
# Expected: report-<old_branch>-<new_branch>.json
# where old_branch contains version N-1 and new_branch contains version N.
# The old branch may or may not have a network suffix (contracts are chain agnostic
# for version checking), so we only validate the version numbers, not the exact name.
#
# Usage: validate_report_filename <report_path> <branch>

validate_report_filename() {
  local REPORT="$1"
  local BRANCH="$2"

  source scripts/bash/extract-release-version.sh
  extract_release_version "$BRANCH"
  local VERSION_NUMBER=$RELEASE_VERSION

  local PREVIOUS_VERSION=$((VERSION_NUMBER - 1))
  local ACTUAL
  ACTUAL=$(basename "$REPORT")

  # Check that the filename starts with "report-", ends with ".json",
  # contains vN-1 (old branch) before vN (new branch).
  if ! echo "$ACTUAL" | grep -qE "^report-.*v${PREVIOUS_VERSION}.*-.*v${VERSION_NUMBER}.*\.json$"; then
    echo "Error: Report file name '$ACTUAL' does not match expected format." >&2
    echo "Expected: report-<old_branch_v${PREVIOUS_VERSION}>-<new_branch_v${VERSION_NUMBER}>.json" >&2
    echo "Example: report-core-contracts.v${PREVIOUS_VERSION}-core-contracts.v${VERSION_NUMBER}.json" >&2
    exit 1
  fi

  echo "Report filename validated: $ACTUAL"
}
