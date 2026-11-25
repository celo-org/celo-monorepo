#!/usr/bin/env bash
set -euo pipefail

# Checks that Solidity sources on a given branch correspond to bytecodes
# deployed to a Celo system deployed to the given network.
#
# Flags:
# -b: Branch containing smart contracts that currently comprise the Celo protocol
# -n: The network to check
# -f: Boolean flag to indicate if the Forno service should be used to connect to
#     the network
# -l: Path to a file to which logs should be appended
# -i: Path to the data needed to initialize contracts (if verifying a smart contracts release).
# -p: Path to an optional proposal file, to verify the bytecodes of the core contracts after a
#     proposed release.
# -u: Custom RPC URL (optional, e.g. a local fork of the network).

BRANCH=""
NETWORK=""
FORNO=""
LOG_FILE="/dev/stdout"
PROPOSAL=""
INITIALIZE_DATA=""
RPC_URL=""

while getopts 'b:n:fl:i:p:u:' flag; do
  case "${flag}" in
    b) BRANCH="${OPTARG}" ;;
    n) NETWORK="${OPTARG}" ;;
    f) FORNO="--forno" ;;
    l) LOG_FILE="${OPTARG}" ;;
    i) INITIALIZE_DATA="--initialize_data $(realpath $OPTARG)" ;;
    p) PROPOSAL="--proposal $(realpath $OPTARG)" ;;
    u) RPC_URL="--rpcUrl ${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$BRANCH" ] && echo "Need to set the branch via the -b flag" && exit 1;
[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;

source scripts/bash/release-lib.sh
source scripts/bash/warn-if-libraries-exist.sh
source scripts/bash/validate-libraries-filename.sh
LIBRARIES_FILE=$(get_libraries_filename "$NETWORK" "$BRANCH")
warn_if_libraries_exist "$LIBRARIES_FILE"

# Each ref builds with its own foundry.toml. Pre-migration tags still define the
# truffle-compat (Solidity 0.5) profile for their implementations; the single-tree layout
# does not and instead builds contracts-0.5 (the proxies) with solc05, which reproduces the
# runtime code of the live mainnet proxies. has_foundry_profile skips whichever profile a
# ref does not define; the 0.8 sources build with truffle-compat8 where a ref still has it,
# else with the default profile.
build_tag_foundry $BRANCH $LOG_FILE truffle-compat
build_tag_foundry $BRANCH $LOG_FILE solc05
build_08_sources $BRANCH $LOG_FILE

# The Celo Sepolia core proxies were created by an optimized solc 0.5.17 build of Proxy.sol.
# Proxy.sol never changes, so that runtime is rebuilt here from the working tree (the ref
# under verification may predate the solc05-optimized profile) and handed to the verifier
# as a known proxy runtime.
echo " - Build the Celo Sepolia proxy runtime (solc05-optimized) from the working tree"
FOUNDRY_PROFILE=solc05-optimized forge build >> $LOG_FILE

# --preferTsExts keeps stale compiled lib/**/*.js from shadowing the TypeScript sources.
yarn ts-node --preferTsExts ./scripts/foundry/verify-bytecode-foundry.ts --network $NETWORK --branch $BRANCH --librariesFile "$LIBRARIES_FILE" $FORNO $PROPOSAL $INITIALIZE_DATA $RPC_URL