#!/usr/bin/env bash
set -euo pipefail

# Deploys new contract implementations and generates governance proposal.
#
# Flags:
# -b: Branch to build contracts from (must be core-contracts.vX or release/core-contracts/X format).
# -k: Private key to sign transactions from.
# -i: Path to the data needed to initialize contracts.
# -l: Path to the canonical library mapping.
# -n: The network to deploy to.
# -p: Path that the governance proposal should be written to.
# -r: Path to the contract compatibility report.
# -u: Custom RPC URL (optional, overrides network default).
# -s: Skip contract verification (optional).
# -a: Celoscan API key for verification (optional, can also use CELOSCAN_API_KEY env var).

BRANCH=""
PRIVATE_KEY=""
INITIALIZE_DATA=""
LIBRARIES=""
NETWORK=""
PROPOSAL=""
REPORT=""
RPC_URL=""
SKIP_VERIFICATION=""
CELOSCAN_API_KEY_ARG=""

while getopts 'b:k:i:l:n:p:r:u:sa:' flag; do
  case "${flag}" in
    b) BRANCH="${OPTARG}" ;;
    k) PRIVATE_KEY="${OPTARG}" ;;
    i) INITIALIZE_DATA="${OPTARG}" ;;
    l) LIBRARIES="${OPTARG}" ;;
    n) NETWORK="${OPTARG}" ;;
    p) PROPOSAL="${OPTARG}" ;;
    r) REPORT="${OPTARG}" ;;
    u) RPC_URL="${OPTARG}" ;;
    s) SKIP_VERIFICATION="true" ;;
    a) CELOSCAN_API_KEY_ARG="${OPTARG}" ;;
    *)
      echo "Unexpected option ${flag}" >&2
      exit 1
      ;;
  esac
done

[ -z "$BRANCH" ] && echo "Need to set the build branch via the -b flag" && exit 1;
[ -z "$PRIVATE_KEY" ] && echo "Need to set the private key for signing via the -k flag" && exit 1;
[ -z "$INITIALIZE_DATA" ] && echo "Need to set the initialization data via the -i flag" && exit 1;
[ -z "$LIBRARIES" ] && echo "Need to set the library mapping input via the -l flag" && exit 1;
[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;
[ -z "$PROPOSAL" ] && echo "Need to set the proposal outfile via the -p flag" && exit 1;
[ -z "$REPORT" ] && echo "Need to set the compatibility report input via the -r flag" && exit 1;

source scripts/bash/validate-libraries-filename.sh
validate_libraries_filename "$LIBRARIES" "$NETWORK" "$BRANCH"

source scripts/bash/validate-libraries-bytecode.sh
VALIDATION_RPC_URL="${RPC_URL:-$(get_forno_url "$NETWORK")}"
validate_libraries_bytecode "$LIBRARIES" "$VALIDATION_RPC_URL"

BUILD_DIR="./out/"

# Build the command with optional flags
OPTIONAL_FLAGS=""
if [ -n "$RPC_URL" ]; then
  OPTIONAL_FLAGS="$OPTIONAL_FLAGS --rpcUrl $RPC_URL"
fi
if [ -n "$SKIP_VERIFICATION" ]; then
  OPTIONAL_FLAGS="$OPTIONAL_FLAGS --skipVerification"
fi
if [ -n "$CELOSCAN_API_KEY_ARG" ]; then
  OPTIONAL_FLAGS="$OPTIONAL_FLAGS --celoscanApiKey $CELOSCAN_API_KEY_ARG"
fi

yarn ts-node --transpile-only ./scripts/foundry/make-release.ts \
  --branch "$BRANCH" \
  --privateKey "$PRIVATE_KEY" \
  --initializeData "$INITIALIZE_DATA" \
  --librariesFile "$LIBRARIES" \
  --network "$NETWORK" \
  --proposal "$PROPOSAL" \
  --report "$REPORT" \
  --buildDirectory "$BUILD_DIR" \
  $OPTIONAL_FLAGS
