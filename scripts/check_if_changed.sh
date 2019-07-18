#!/usr/bin/env bash
set -euo pipefail

checkIfChangedFolder() {
  # latest commit
  LATEST_COMMIT=$(git rev-parse HEAD)

  # latest commit where path/to/folder1 was changed
  CHANGE_COMMIT=$(git log -1 --format=format:%H --full-diff .)
  YARN_COMMIT=$(git log -1 --format=format:%H --full-diff ../../yarn.lock)
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  STAGING_OR_PROD="^[a-z]*(production|staging)$"

  if [[ $CHANGE_COMMIT == $LATEST_COMMIT || $YARN_COMMIT == $LATEST_COMMIT || $CURRENT_BRANCH =~ $STAGING_OR_PROD ]]; then
    echo true
  else
    echo false
  fi
}

