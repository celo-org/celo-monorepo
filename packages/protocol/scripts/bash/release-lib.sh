#!/usr/bin/env bash

function build_tag() {
  BRANCH="$1"
  LOG_FILE="$2"

  echo " - Checkout contracts source code at $BRANCH"
  BUILD_DIR=$(echo build/$(echo $BRANCH | sed -e 's/\//_/g'))
  git checkout --no-overlay $BRANCH -- contracts 2>>$LOG_FILE >> $LOG_FILE

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

  git checkout - -- contracts 2>>$LOG_FILE >> $LOG_FILE
}
