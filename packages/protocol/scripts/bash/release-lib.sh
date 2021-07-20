#!/usr/bin/env bash

# USAGE: build_tag <branch> <log file>
# This function:
# 1. checks out the given branch
# 2. builds contracts
# 3. returns to original branch
# piping output of any commands to the specified log file.
# Sets $BUILD_DIR to the directory where resulting build artifacts may be found.
function build_tag() {
  local BRANCH="$1"
  local LOG_FILE="$2"

  git fetch origin +'refs/tags/core-contracts.v*:refs/tags/core-contracts.v*' >> $LOG_FILE

  echo " - Checkout contracts source code at $BRANCH"
  BUILD_DIR=$(echo build/$(echo $BRANCH | sed -e 's/\//_/g'))
  [ -d contracts ] && rm -r contracts
  git checkout $BRANCH -- contracts 2>>$LOG_FILE >> $LOG_FILE

  if [ ! -d $BUILD_DIR ]; then
    echo " - Build contract artifacts at $BUILD_DIR"
    BUILD_DIR=$BUILD_DIR yarn build:sol >> $LOG_FILE
  else
    echo " - Contract artifacts already built at $BUILD_DIR"
  fi

  [ -d contracts ] && rm -r contracts
  git checkout - -- contracts 2>>$LOG_FILE >> $LOG_FILE
}
