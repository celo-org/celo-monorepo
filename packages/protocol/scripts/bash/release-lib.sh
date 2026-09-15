#!/usr/bin/env bash


function checkout_build_sources() {
  # Every source tree any supported ref may carry: pre-migration tags have contracts
  # (0.5) and contracts-0.8, the single-tree layout has contracts (0.8) and
  # contracts-0.5. Only the paths present in the ref are restored; the rest are removed.
  local BUILD_SOURCES="contracts contracts-0.8 contracts-0.5 test-sol migrations_sol foundry.toml remappings.txt"
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

  local PREFIX=$(git rev-parse --show-prefix)
  local PRESENT=""
  for SOURCE in $BUILD_SOURCES; do
    if git cat-file -e "$FROM:$PREFIX$SOURCE" 2>/dev/null; then
      PRESENT="$PRESENT $SOURCE"
    fi
  done

  rm -rf $BUILD_SOURCES
  git restore --source $FROM $FLAGS $PRESENT 2>>$LOG_FILE >> $LOG_FILE
}

# Whether the checked-out foundry.toml defines the given profile. The single-tree
# layout has no Solidity 0.5 profile any more (the proxies are frozen artifacts), while
# pre-migration tags still build their 0.5 implementations with one.
function has_foundry_profile() {
  grep -q "^\[profile\.$1\]" foundry.toml
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
  # Temporarily allow unset variables to handle optional parameters.
  set +u
  local PROFILE="$3"
  local CONFIG="$4"
  set -u

  local RELEASE_NUMBER=$(echo "$BRANCH" | grep -o 'v[0-9]\+' | tr -dc '0-9')

  echo "Writing logs to $LOG_FILE"

  local CURRENT_HASH=`git log -n 1 --oneline | cut -c 1-9`

  git fetch origin +'refs/tags/core-contracts.v*:refs/tags/core-contracts.v*' >> $LOG_FILE
  echo " - Checkout contracts source code at $BRANCH"
  BUILD_DIR=$(echo out-$(echo $BRANCH | sed -e 's/\//_/g'))
  if [[ -n "$PROFILE" ]]; then
    BUILD_DIR=${BUILD_DIR}-$PROFILE
  fi

  checkout_build_sources $BRANCH $LOG_FILE

  if [[ -n "$CONFIG" ]]; then
    cp "$CONFIG" foundry.toml
  fi

  if [[ -n "$PROFILE" ]] && ! has_foundry_profile "$PROFILE"; then
    echo " - $BRANCH defines no $PROFILE profile, nothing to build for it"
    # A build of the same ref name from before the profile was removed must not linger:
    # the release tooling picks its artifact directories by existence.
    rm -rf $BUILD_DIR
    BUILD_DIR=""
    checkout_build_sources $CURRENT_HASH $LOG_FILE -s
    return 0
  fi

  # Always rebuild from scratch. On reused (self-hosted) runners a previously-built
  # $BUILD_DIR for the same tag persists across runs; reusing it can compare against a
  # stale baseline and produce phantom storage diffs (e.g. a spurious change attributed
  # to Governance, which then trips the no-new-proxy guard). Removing it forces a fresh,
  # deterministic build of the checked-out sources.
  echo " - Build contract artifacts at $BUILD_DIR (fresh)"
  rm -rf $BUILD_DIR
  export FOUNDRY_PROFILE=$PROFILE
  # Put the working tree back even when the build fails; otherwise the caller (and a
  # reused CI runner) is left with the tag's sources checked out over the branch.
  if ! forge build --out $BUILD_DIR --ast >> $LOG_FILE; then
    echo " - Build of $BRANCH failed, restoring sources at $CURRENT_HASH (see $LOG_FILE)" >&2
    checkout_build_sources $CURRENT_HASH $LOG_FILE -s
    return 1
  fi

  checkout_build_sources $CURRENT_HASH $LOG_FILE -s
}
