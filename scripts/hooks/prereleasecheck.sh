#!/usr/bin/env bash

BRANCH="$(git rev-parse --abbrev-ref HEAD)"

# Ensure that its not possible to commit to a prerelease branch without a pre.json file
if  [[ $BRANCH == prerelease* ]]; then
	echo "checking for  pre.json"
  PRE_FILE=.changeset/pre.json
  if test -f "$PRE_FILE"; then
    echo "$PRE_FILE exists."
  else
    echo "$PRE_FILE does not exist. Run yarn beta-enter to create it."
    exit 1
  fi
fi