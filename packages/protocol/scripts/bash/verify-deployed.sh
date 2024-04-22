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

BRANCH=""
NETWORK=""
FORNO=""
LOG_FILE="/dev/stdout"

while getopts 'b:n:fl:' flag; do
  case "${flag}" in
    b) BRANCH="${OPTARG}" ;;
    n) NETWORK="${OPTARG}" ;;
    f) FORNO="--forno" ;;
    l) LOG_FILE="${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$BRANCH" ] && echo "Need to set the branch via the -b flag" && exit 1;
[ -z "$NETWORK" ] && echo "Need to set the NETWORK via the -n flag" && exit 1;

source scripts/bash/release-lib.sh
build_tag $BRANCH $LOG_FILE

if [ "$BRANCH" = "core-contracts.v10" ]; then
  if [ ! -d "build/mento" ]; then
    mkdir -p build/mento
    cd build/mento
    git clone --depth 1 --branch v2.2.1 https://github.com/mento-protocol/mento-core.git
    cd mento-core
    yarn 
    forge install
    forge build
  else 
    cd build/mento/mento-core
  fi

  # Replace the bytecode of the SortedOracles contracts with the bytecode from Mento core v2.2.1
  orig_value_SortedOracles=$(jq -r '.deployedBytecode.object' out/SortedOracles.sol/SortedOracles.json)
  substring_to_replace='__$e9f4a9f9de32ce6d7070252f1b707ecbd2$__' # Foundry artifact bytecode differs for linked libraries, instead of library name it inserts a hashed value of library name in-place
  replacement='__AddressSortedLinkedListWithMedian_____' # Replace with Truffle specific library placeholder
  value_SortedOracles="${orig_value_SortedOracles//$substring_to_replace/$replacement}"
  jq --arg value "$value_SortedOracles" '.deployedBytecode = $value' ../../../$BUILD_DIR/contracts/SortedOracles.json > "temp.json" && mv "temp.json" ../../../$BUILD_DIR/contracts/SortedOracles.json

  # Replace the bytecode of the AddressSortedLinkedListWithMedian contract with the bytecode from Mento core v2.2.1
  value_AddressSortedLinkedListWithMedian=$(jq -r '.deployedBytecode.object' out/AddressSortedLinkedListWithMedian.sol/AddressSortedLinkedListWithMedian.json)
  jq --arg value "$value_AddressSortedLinkedListWithMedian" '.deployedBytecode = $value' ../../../$BUILD_DIR/contracts/AddressSortedLinkedListWithMedian.json > temp.json && mv temp.json ../../../$BUILD_DIR/contracts/AddressSortedLinkedListWithMedian.json

  cd ../../../
fi

yarn run truffle exec ./scripts/truffle/verify-bytecode.js --network $NETWORK --build_artifacts $BUILD_DIR/contracts  --branch $BRANCH --librariesFile "libraries.json" $FORNO
