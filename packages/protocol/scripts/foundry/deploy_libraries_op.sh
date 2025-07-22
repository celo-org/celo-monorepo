#!/usr/bin/env bash
set -euo pipefail

# Read environment variables and constants
source $PWD/scripts/foundry/constants_op.sh

# Create a temporary directory or remove it first it if exists
if [ -d "$TEMP_DIR" ]; then
    echo "Removing existing temporary folder..."
    rm -rf $TEMP_DIR
fi
mkdir $TEMP_DIR

# Copy libraries to the directory
for LIB_PATH in "${LIBRARIES_PATH[@]}"; do
    IFS=":" read -r SOURCE DEST <<< "$LIB_PATH"
    DEST_FILE="$TEMP_DIR/$SOURCE"
    DEST_DIR=$(dirname "$DEST_FILE")
    mkdir -p "$DEST_DIR"
    echo "Copying file $SOURCE to $DEST_FILE"
    cp "$SOURCE" "$DEST_FILE"
done

# Creating two variables for better readability
SOURCE_DIR=$PWD
DEST_DIR=$TEMP_DIR

# Copy dependencies of the libraries to the directory
for LIB_PATH in "${LIBRARY_DEPENDENCIES_PATH[@]}"; do
    # Creates directory for the dependency, including any necessary parent directories
    mkdir -p $DEST_DIR/$(dirname $LIB_PATH)
    # Copies dependency to the newly created directory
    cp $SOURCE_DIR/$LIB_PATH $DEST_DIR/$LIB_PATH
done

# Copy foundry config and remappings to the temporary directory
cp $SOURCE_DIR/foundry.toml $DEST_DIR/foundry.toml
cp $SOURCE_DIR/remappings.txt $DEST_DIR/remappings.txt

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
    create_library_out=`forge create $LIB_PATH --from 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url $ANVIL_RPC_URL --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast --json`
    LIB_ADDRESS=`echo $create_library_out | jq -r '.deployedTo'`
    # Constructing library flag so the remaining contracts can be built and linkeded to these libraries
    LIBRARY_FLAGS="$LIBRARY_FLAGS --libraries $LIB_PATH:$LIB_ADDRESS"
done

# Move out of the temporary directory
popd

# Remove the temporary directory
rm -rf $TEMP_DIR
