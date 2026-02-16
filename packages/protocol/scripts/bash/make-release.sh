#!/usr/bin/env bash
set -euo pipefail

# Checks that the contract version numbers in a provided branch are as expected given
# a released branch.
#
# Flags:
# -n: The network to deploy to.
# -b: Branch to build contracts from.
# -p: (Optional) Deprecated. Proposal path is auto-generated as proposal-$NETWORK-$BRANCH.json.
# -i: Path to the data needed to initialize contracts.
# -r: Path to the contract compatibility report.
# -d: Whether to dry-run this deploy
# -f: Address to sign transactions from.
# -l: Path to the canonical library mapping.
# -F: Whether to use the forno endpoint

NETWORK=""
PROPOSAL=""
BRANCH=""
INITIALIZE_DATA=""
REPORT=""
DRYRUN=""
FROM=""
LIBRARIES=""
FORNO=""

while getopts 'b:n:p:i:r:df:l:F' flag; do
  case "${flag}" in
    b) BRANCH="${OPTARG}" ;;
    n) NETWORK="${OPTARG}" ;;
    p) PROPOSAL="${OPTARG}" ;;
    i) INITIALIZE_DATA="${OPTARG}" ;;
    r) REPORT="${OPTARG}" ;;
    d) DRYRUN="--dry_run" ;;
    F) FORNO="--forno" ;;
    f) FROM="${OPTARG}" ;;
    l) LIBRARIES="${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;
[ -z "$BRANCH" ] && echo "Need to set the build branch via the -b flag" && exit 1;
[ -z "$INITIALIZE_DATA" ] && echo "Need to set the initialization data via the -i flag" && exit 1;
[ -z "$REPORT" ] && echo "Need to set the compatibility report input via the -r flag" && exit 1;
[ -z "$LIBRARIES" ] && echo "Need to set the library mapping input via the -l flag" && exit 1;

if [ -n "$PROPOSAL" ]; then
  echo "Error: -p no longer accepts a path. Proposal name is now generated automatically as proposal-\$NETWORK-\$BRANCH.json." >&2
  echo "See: https://github.com/celo-org/celo-monorepo/pull/11651" >&2
  exit 1
fi
PROPOSAL="proposal-$NETWORK-$BRANCH.json"

source scripts/bash/validate-libraries-filename.sh
validate_libraries_filename "$LIBRARIES" "$NETWORK" "$BRANCH"

source scripts/bash/validate-libraries-bytecode.sh
validate_libraries_bytecode "$LIBRARIES" "$(get_forno_url "$NETWORK")"

source scripts/bash/release-lib.sh
build_tag $BRANCH "/dev/stdout"


yarn run truffle exec ./scripts/truffle/make-release.js \
  --network $NETWORK \
  --build_directory $BUILD_DIR \
  --report $REPORT \
  --librariesFile $LIBRARIES \
  --proposal $PROPOSAL \
  --from $FROM \
  --branch $BRANCH \
  --initialize_data $INITIALIZE_DATA $DRYRUN $FORNO