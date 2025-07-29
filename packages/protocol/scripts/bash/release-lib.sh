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

  echo "Writing logs to $LOG_FILE"

  local CURRENT_HASH=`git log -n 1 --oneline | cut -c 1-9`

  git fetch origin +'refs/tags/core-contracts.v*:refs/tags/core-contracts.v*' >> $LOG_FILE
  echo " - Checkout contracts source code at $BRANCH"
  BUILD_DIR=$(echo build/$(echo $BRANCH | sed -e 's/\//_/g'))
  [ -d contracts ] && rm -r contracts
  [ -d contracts-0.8 ] && rm -r contracts-0.8

  git restore --source $BRANCH contracts* 2>>$LOG_FILE >> $LOG_FILE

  if [ ! -d $BUILD_DIR ]; then
    echo " - Build contract artifacts at $BUILD_DIR"
    BUILD_DIR=$BUILD_DIR yarn build:truffle-sol >> $LOG_FILE
  else
    echo " - Contract artifacts already built at $BUILD_DIR"
  fi

  [ -d contracts ] && rm -r contracts
  [ -d contracts-0.8 ] && rm -r contracts-0.8
  git restore --source $CURRENT_HASH --staged --worktree contracts* 2>>$LOG_FILE >> $LOG_FILE
}

function checkout_build_sources() {
  local BUILD_SOURCES="contracts contracts-0.8 test-sol foundry.toml remappings.txt"
  local FROM=$1
  local LOG_FILE=$2
  # The third argument is optional. We temporarily allow unset variables.
  set +u
  local STAGE=$3
  set -u
  local FLAGS=

  if [[ $STAGE == "-s" ]]; then
    FLAGS="--staged --worktree"
  fi

  rm -rf $BUILD_SOURCES
  git restore --source $FROM $FLAGS $BUILD_SOURCES 2>>$LOG_FILE >> $LOG_FILE
}

# USAGE: build_tag_foundry <branch> <log file>
# This function:
# 1. checks out the given branch
# 2. builds contracts with Foundry
# 3. returns to original branch
# piping output of any commands to the specified log file.
# Sets $BUILD_DIR to the directory where resulting build artifacts may be found.
function build_tag_foundry() {
  local BRANCH="$1"
  local LOG_FILE="$2"

  # Assuming a `core-contracts.vNN` tag, using 'v' as the delimeter, the second field will be just
  # the release number.
  local RELEASE_NUMBER=`echo $BRANCH | cut -dv -f2`

  echo "Writing logs to $LOG_FILE"

  local CURRENT_HASH=`git log -n 1 --oneline | cut -c 1-9`

  git fetch origin +'refs/tags/core-contracts.v*:refs/tags/core-contracts.v*' >> $LOG_FILE
  echo " - Checkout contracts source code at $BRANCH"
  BUILD_DIR=$(echo out-$(echo $BRANCH | sed -e 's/\//_/g'))

  checkout_build_sources $BRANCH $LOG_FILE

  if [ ! -d $BUILD_DIR ]; then
    if [[ $RELEASE_NUMBER -le 12 ]]; then
        foundryup --install nightly-f625d0fa7c51e65b4bf1e8f7931cd1c6e2e285e9
        create_import
    else
        foundryup --instal 1.0.0
    fi

    echo " - Build contract artifacts at $BUILD_DIR"
    forge build --out $BUILD_DIR --ast >> $LOG_FILE
  else
    echo " - Contract artifacts already built at $BUILD_DIR"
  fi

  checkout_build_sources $CURRENT_HASH $LOG_FILE -s
  cleanup_import
}

IMPORT_EXTRA_FILE=test-sol/devchain/ImportAdditionalDependencies.sol

function cleanup_import() {
  rm -f $IMPORT_EXTRA_FILE
}

IMPORT_EXTRA_FILE_CONTENT='
pragma solidity ^0.5.13;

// this file only exists so that foundry compiles this contracts
import { Proxy } from "@celo-contracts/common/Proxy.sol";
import { GoldToken } from "@celo-contracts/common/GoldToken.sol";
import { Accounts } from "@celo-contracts/common/Accounts.sol";
import { Election } from "@celo-contracts/governance/Election.sol";
import { Governance } from "@celo-contracts/governance/Governance.sol";
import { LockedGold } from "@celo-contracts/governance/LockedGold.sol";
import { GovernanceApproverMultiSig } from "@celo-contracts/governance/GovernanceApproverMultiSig.sol";
import { Escrow } from "@celo-contracts/identity/Escrow.sol";
import { FederatedAttestations } from "@celo-contracts/identity/FederatedAttestations.sol";
import { SortedOracles } from "@celo-contracts/stability/SortedOracles.sol";
import { ReserveSpenderMultiSig } from "@mento-core/contracts/ReserveSpenderMultiSig.sol";
import { Reserve } from "@mento-core/contracts/Reserve.sol";
import { StableToken } from "@mento-core/contracts/StableToken.sol";
import { StableTokenEUR } from "@mento-core/contracts/StableTokenEUR.sol";
import { StableTokenBRL } from "@mento-core/contracts/StableTokenBRL.sol";
import { Exchange } from "@mento-core/contracts/Exchange.sol";

import { IValidators } from "@celo-contracts/governance/interfaces/IValidators.sol";

contract Import05 {}
'

function create_import() {
  mkdir -p "test-sol/devchain"
  touch "$IMPORT_EXTRA_FILE"
  echo "$IMPORT_EXTRA_FILE_CONTENT" > $IMPORT_EXTRA_FILE
  echo >> "remappings.txt"
  echo "@mento-core/=lib/mento-core" >> remappings.txt
}
