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

  echo " - Checkout contracts source code at $BRANCH"
  BUILD_DIR=$(echo build/$(echo $BRANCH | sed -e 's/\//_/g'))
  [ -d contracts ] && rm -r contracts
  git checkout $BRANCH -- contracts 2>>$LOG_FILE >> $LOG_FILE

  [ -d "build/contracts" ] && mv build/contracts build/contracts_tmp
  if [ ! -d $BUILD_DIR ]; then
    echo " - Build contract artifacts at $BUILD_DIR"
    yarn build:sol >> $LOG_FILE
    rm -rf $BUILD_DIR && mkdir -p $BUILD_DIR
    mv build/contracts $BUILD_DIR
  else
    echo " - Contract artifacts already built at $BUILD_DIR"
  fi
  [ -d "build/contracts_tmp" ] && mv build/contracts_tmp build/contracts

  [ -d contracts ] && rm -r contracts
  git checkout - -- contracts 2>>$LOG_FILE >> $LOG_FILE
}
