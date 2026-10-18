#!/usr/bin/env bash
set -euo pipefail

# Regenerates the committed version reports in releaseData/versionReports so CI can
# diff them against the checked-in snapshots and catch regressions in the report
# tooling. A release is regenerated when it has a committed snapshot and both of its
# tags can be built by the Foundry tooling. Tags up to core-contracts.v12 cannot: the
# Truffle-era ones have no Foundry config at all, and v12's config predates the
# optimizer setting its own 0.5 test suite needs, so the pinned solc fails on it with
# a stack-too-deep error.
#
# RELEASE_TAG names the newest release to consider, e.g. core-contracts.v17.

source scripts/bash/extract-release-version.sh
extract_release_version "$RELEASE_TAG"
LATEST=$RELEASE_VERSION
FIRST_BUILDABLE_TAG=13

can_build() {
  [[ "$1" -ge "$FIRST_BUILDABLE_TAG" ]]
}

for i in $(seq 1 "$LATEST"); do
  SNAPSHOT="releaseData/versionReports/release$i-report.json"
  OLD="core-contracts.v$((i - 1))"
  NEW="core-contracts.v$i"

  if [[ ! -f "$SNAPSHOT" ]]; then
    echo "release $i: no committed snapshot, skipping"
    continue
  fi
  if ! can_build $((i - 1)); then
    echo "release $i: $OLD cannot be built by the Foundry tooling, skipping"
    continue
  fi

  echo "release $i: regenerating $SNAPSHOT from $OLD -> $NEW"
  yarn release:check-versions:foundry -a "$OLD" -b "$NEW"
  # check-versions-foundry.sh names its report report-<old>-<new>.json; move it to the
  # snapshot location the versionReports diff gate expects.
  mv "report-$OLD-$NEW.json" "$SNAPSHOT"
done
