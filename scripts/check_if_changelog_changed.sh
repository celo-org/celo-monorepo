#!/usr/bin/env bash
set -euo pipefail

checkIfChangedChangelog() {
  # get package to check 
  PACKAGE=${1}

  # latest commit
  LATEST_COMMIT=$(git rev-parse HEAD)

  # latest commit where path/to/PACKAGE was changed
  CHANGE_COMMIT=$(git log -1 --format=format:%H --full-diff ${PACKAGE}/CHANGELOG.md)

  if [[ $CHANGE_COMMIT != $LATEST_COMMIT ]]; then
    echo "Please commit to the ${PACKAGE}/CHANGELOG.md file"
    exit 1
  fi
}

