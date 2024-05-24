#!/usr/bin/env bash
set -euo pipefail

# Name of temporary directory
TEMP_DIR_NAME=".tmp/libraries"
TEMP_DIR="$PWD/$TEMP_DIR_NAME"

# Create a temporary directory or remove it first it if exists
if [ -d "$TEMP_DIR" ]; then
    echo "Removing existing temporary folder..."
    rm -rf $TEMP_DIR
fi
mkdir $TEMP_DIR

# Copy libraries to the directory
LIBRARIES_PATH=("contracts/common/linkedlists/AddressSortedLinkedListWithMedian.sol:AddressSortedLinkedListWithMedian"
                "contracts/common/Signatures.sol:Signatures"
                "contracts/common/linkedlists/AddressLinkedList.sol:AddressLinkedList"
                "contracts/common/linkedlists/AddressSortedLinkedList.sol:AddressSortedLinkedList"
                "contracts/common/linkedlists/IntegerSortedLinkedList.sol:IntegerSortedLinkedList"
                "contracts/governance/Proposals.sol:Proposals"
)

for LIB_PATH in "${LIBRARIES_PATH[@]}"; do
    IFS=":" read -r SOURCE DEST <<< "$LIB_PATH"
    DEST_FILE="$TEMP_DIR/$SOURCE"
    DEST_DIR=$(dirname "$DEST_FILE")
    mkdir -p "$DEST_DIR"
    echo "Copying file $SOURCE to $DEST_FILE"
    cp "$SOURCE" "$DEST_FILE"
done

# Copy dependencies of the libraries to the directory
LIBRARY_DEPENDENCIES_PATH=(
    "contracts/common/FixidityLib.sol"
    "contracts/common/linkedlists/LinkedList.sol"
    "contracts/common/linkedlists/SortedLinkedList.sol"
    "contracts/common/linkedlists/SortedLinkedListWithMedian.sol"
    "lib/openzeppelin-contracts/contracts/math/SafeMath.sol"
    "lib/openzeppelin-contracts/contracts/math/Math.sol"
    "lib/openzeppelin-contracts/contracts/cryptography/ECDSA.sol"   
    "lib/openzeppelin-contracts/contracts/utils/Address.sol"
    "lib/solidity-bytes-utils/contracts/BytesLib.sol"
)

# Creating two variables for better readability
SOURCE_DIR=$PWD
DEST_DIR=$TEMP_DIR

for LIB_PATH in "${LIBRARY_DEPENDENCIES_PATH[@]}"; do
    # Creates directory for the dependency, including any necessary parent directories
    mkdir -p $DEST_DIR/$(dirname $LIB_PATH)
    # Copies dependency to the newly created directory
    cp $SOURCE_DIR/$LIB_PATH $DEST_DIR/$LIB_PATH
done

# Copy foundry config to the temporary directory
cp $SOURCE_DIR/foundry.toml $DEST_DIR/foundry.toml

# Move into the temporary directory
pushd $TEMP_DIR

# Build libraries
echo "Building libraries..."
forge build

# Deploy libraries and building library flag
echo "Deploying libraries..."
export LIBRARY_FLAGS=""
for LIB_PATH in "${LIBRARIES_PATH[@]}"; do
    LIB_NAME="${LIB_PATH#*:}" 
    # For example:
    # LIB_PATH = "contracts/common/linkedlists/AddressSortedLinkedListWithMedian.sol:AddressSortedLinkedListWithMedian"
    # LIB_NAME = AddressSortedLinkedListWithMedian
    echo "Deploying library: $LIB_NAME"
    create_library_out=`forge create $LIB_PATH --from $FROM_ACCOUNT --rpc-url http://127.0.0.1:$ANVIL_PORT --unlocked --json`
    LIB_ADDRESS=`echo $create_library_out | jq -r '.deployedTo'`
    # Constructing library flag so the remaining contracts can be built and linkeded to these libraries
    LIBRARY_FLAGS="$LIBRARY_FLAGS --libraries $LIB_PATH:$LIB_ADDRESS"
done

# Move out of the temporary directory
popd

# Remove the temporary directory
rm -rf $TEMP_DIR

