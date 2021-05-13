#!/usr/bin/env bash

# USAGE: checkout_tag <branch> <log file>
# This function:
# 1. checks out the given branch's contracts
# piping output of any commands to the specified log file.
function checkout_tag() {
  local BRANCH="$1"
  local LOG_FILE="$2"

  echo " - Checkout contracts source code at $BRANCH"
  [ -d contracts ] && rm -r contracts
  git checkout $BRANCH -- contracts >> $LOG_FILE
}

# USAGE: build_tag <branch> <log file>
# This function:
# 1. checks out the given branch's contracts
# 2. builds contracts
# 3. restores to original branch's contracts
# piping output of any commands to the specified log file.
# Sets $BUILD_DIR to the directory where resulting build artifacts may be found.
function build_tag() {
  local BRANCH="$1"
  local LOG_FILE="$2"

  checkout_tag $BRANCH $LOG_FILE

  BUILD_DIR=$(echo build/$(echo $BRANCH | sed -e 's/\//_/g'))

  [ -d "build/contracts" ] && mv build/contracts build/contracts_tmp
  if [ ! -d $BUILD_DIR ]; then
    echo " - Build contract artifacts at $BUILD_DIR"
    yarn build:sol >> $LOG_FILE
    rm -rf $BUILD_DIR/contracts && mkdir -p $BUILD_DIR/contracts
    mv build/contracts $BUILD_DIR
  else
    echo " - Contract artifacts already built at $BUILD_DIR"
  fi
  [ -d "build/contracts_tmp" ] && mv build/contracts_tmp build/contracts

  checkout_tag - $LOG_FILE
}
