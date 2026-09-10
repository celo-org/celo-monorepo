#!/usr/bin/env bash
set -euo pipefail

source ./scripts/bash/utils.sh
source ./scripts/foundry/constants.sh
source ./scripts/bash/validate-libraries-filename.sh
source ./scripts/bash/extract-release-version.sh

# Simulates the next core-contracts release on a local devchain. The devchain holds
# the contracts of the released tag given by -b (the baseline); the release itself is
# built from HEAD, so the job exercises the contracts under review, not the baseline.
#
# The release tooling derives the release number from the name of the ref it builds,
# so HEAD is tagged locally as the release after the baseline (core-contracts.v17 ->
# core-contracts.v18-head). The suffix keeps the local tag from ever colliding with a
# real release tag; the tag is removed again on exit.
#
# Flags:
# -b: Tag of the release deployed on the devchain (the baseline)
# -d: Accepted for the CI invocation, unused

BRANCH=""

while getopts 'b:l:d:' flag; do
  case "${flag}" in
    b) BRANCH="${OPTARG}" ;;
    d) ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$BRANCH" ] && echo "Need to set the branch via the -b flag" && exit 1;

extract_release_version "$BRANCH"
NEXT_BRANCH="core-contracts.v$((RELEASE_VERSION + 1))-head"
BASELINE_LIBRARIES=$(get_libraries_filename "anvil" "$BRANCH")
# make-release expects the libraries file to be named for the release before the one
# it builds, which for the -head tag differs from the name verify-deployed produces.
RELEASE_LIBRARIES=$(get_previous_libraries_filename "anvil" "$NEXT_BRANCH")
REPORT="report-$BRANCH-$NEXT_BRANCH.json"
PROPOSAL="proposal-anvil-$NEXT_BRANCH.json"
ANVIL_PID=""

cleanup() {
  if [[ -n "$ANVIL_PID" ]]; then
    kill "$ANVIL_PID" 2>/dev/null || true
  fi
  git tag -d "$NEXT_BRANCH" >/dev/null 2>&1 || true
}
trap cleanup EXIT

# Reused runners keep files from earlier runs. Start clean so verify-deployed never
# hits its interactive "libraries file exists" prompt and no stale report is reused.
rm -f "$BASELINE_LIBRARIES" "$RELEASE_LIBRARIES" "$REPORT" "$PROPOSAL"
git tag -f "$NEXT_BRANCH" HEAD >/dev/null

echo "- Run local network"
./scripts/foundry/start_anvil.sh -p $ANVIL_PORT -l .tmp/devchain/l2-devchain.json

if command -v lsof; then
    ANVIL_PID=`lsof -i tcp:$ANVIL_PORT | tail -n 1 | awk '{print $2}'`
    echo "Network started with PID $ANVIL_PID, if exit 1, you will need to manually stop the process"
fi

echo "- Verify bytecode of the network against $BRANCH"
yarn release:verify-deployed:foundry -n anvil -b $BRANCH
mv "$BASELINE_LIBRARIES" "$RELEASE_LIBRARIES"

echo "- Check versions of HEAD ($NEXT_BRANCH) against $BRANCH"
yarn release:check-versions:foundry -a $BRANCH -b $NEXT_BRANCH

echo "- Deploy release of HEAD ($NEXT_BRANCH)"
INITIALIZATION_FILE=`ls releaseData/initializationData/release*.json | sort -V | tail -n 1 | xargs realpath`

ANVIL_DEVNET_PRIVATE_KEY='0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
yarn release:make:foundry \
  -b "$NEXT_BRANCH" \
  -k "$ANVIL_DEVNET_PRIVATE_KEY" \
  -i "$INITIALIZATION_FILE" \
  -l "$RELEASE_LIBRARIES" \
  -n anvil \
  -r "$REPORT" \
  -u "http://localhost:$ANVIL_PORT"

echo "- Verify release of HEAD ($NEXT_BRANCH) on the network"
yarn release:verify-deployed:foundry -n anvil -b $NEXT_BRANCH -p "$PROPOSAL"
