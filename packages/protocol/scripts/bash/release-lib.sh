#!/usr/bin/env bash

function build_tag() {
  BRANCH="$1"
  LOG_FILE="$2"

  echo " - Checkout contracts source code at $BRANCH"
  BUILD_DIR=$(echo build/$(echo $BRANCH | sed -e 's/\//_/g'))
  rm -r contracts
  git checkout $BRANCH -- contracts 2>>$LOG_FILE >> $LOG_FILE

  echo " - Build contract artifacts at $BUILD_DIR"
  mv build/contracts build/contracts_tmp
  yarn build:sol >> $LOG_FILE
  rm -rf $BUILD_DIR && mkdir -p $BUILD_DIR
  mv build/contracts $BUILD_DIR
  mv build/contracts_tmp build/contracts

  rm -r contracts
  git checkout - -- contracts 2>>$LOG_FILE >> $LOG_FILE
}
