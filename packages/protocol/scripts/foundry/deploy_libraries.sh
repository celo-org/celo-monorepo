#!/usr/bin/env bash
set -euo pipefail

# Read environment variables and constants
source $PWD/scripts/foundry/constants.sh

# Create a temporary directory or remove it first it if exists
if [ -d "$TEMP_DIR" ]; then
    echo "Removing existing temporary folder..."
    rm -rf $TEMP_DIR
fi

mkdir $TEMP_DIR

# Copy libraries to the directory
for LIB_PATH in "${LIBRARIES_PATH[@]}"; do
    IFS=":" read -r SOURCE DEST <<< "$LIB_PATH"
    echo "SOURCE: $SOURCE"
    echo "DEST: $DEST"
    DEST_FILE="$TEMP_DIR/$SOURCE"
    DEST_DIR=$(dirname "$DEST_FILE")
    mkdir -p "$DEST_DIR"
    echo "Copying file $SOURCE to $DEST_FILE"
    cp "$SOURCE" "$DEST_FILE"
done

for LIB_PATH in "${LIBRARIES_PATH_08[@]}"; do
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
echo "Building with 0.5 libraries..."
time FOUNDRY_PROFILE=profile.truffle-compat forge build

# Deploy libraries and building library flag
echo "Deploying libraries 0.5..."
export LIBRARY_FLAGS=""
for LIB_PATH in "${LIBRARIES_PATH[@]}"; do
    LIB_NAME="${LIB_PATH#*:}" 
    # For example:
    # LIB_PATH = "contracts/common/linkedlists/AddressSortedLinkedListWithMedian.sol:AddressSortedLinkedListWithMedian"
    # LIB_NAME = AddressSortedLinkedListWithMedian
    echo "Deploying library: $LIB_NAME"
    create_library_out=`FOUNDRY_PROFILE=profile.truffle-compat forge create $LIB_PATH --from $FROM_ACCOUNT --rpc-url $ANVIL_RPC_URL --unlocked --broadcast --json`
    LIB_ADDRESS=`echo $create_library_out | jq -r '.deployedTo'`
    # Constructing library flag so the remaining contracts can be built and linkeded to these libraries
    LIBRARY_FLAGS="$LIBRARY_FLAGS --libraries $LIB_PATH:$LIB_ADDRESS"
done

# TODO remove duplicated code
export LIBRARY_FLAGS_08=""
echo "Deploying libraries 0.8..."
for LIB_PATH in "${LIBRARIES_PATH_08[@]}"; do
    LIB_NAME="${LIB_PATH#*:}" 
    # For example:
    # LIB_PATH = "contracts/common/linkedlists/AddressSortedLinkedListWithMedian.sol:AddressSortedLinkedListWithMedian"
    # LIB_NAME = AddressSortedLinkedListWithMedian
    echo "Deploying library: $LIB_NAME"
    create_library_out=`FOUNDRY_PROFILE=profile.truffle-compat8 forge create $LIB_PATH --from $FROM_ACCOUNT --rpc-url $ANVIL_RPC_URL --unlocked --broadcast --json`
    LIB_ADDRESS=`echo $create_library_out | jq -r '.deployedTo'`
    # Constructing library flag so the remaining contracts can be built and linkeded to these libraries
    LIBRARY_FLAGS_08="$LIBRARY_FLAGS_08 --libraries $LIB_PATH:$LIB_ADDRESS"
done


# Move out of the temporary directory
popd

# Remove the temporary directory
rm -rf $TEMP_DIR

