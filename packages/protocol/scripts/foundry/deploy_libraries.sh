#!/usr/bin/env bash
set -euo pipefail

# The array to iterate is passed by name; expanding it through eval keeps the scripts
# usable on the bash 3.2 that macOS ships (namerefs need bash 4.3).
array_by_name() {
    eval "printf '%s\n' \"\${$1[@]}\""
}

# Function to copy libraries to temporary directory
copy_libraries() {
    local lib_array=($(array_by_name "$1"))
    for LIB_PATH in "${lib_array[@]}"; do
        IFS=":" read -r SOURCE DEST <<< "$LIB_PATH"
        echo "SOURCE: $SOURCE"
        echo "DEST: $DEST"
        DEST_FILE="$TEMP_DIR/$SOURCE"
        DEST_DIR=$(dirname "$DEST_FILE")
        mkdir -p "$DEST_DIR"
        echo "Copying file $SOURCE to $DEST_FILE"
        cp "$SOURCE" "$DEST_FILE"
    done
}

# Function to deploy libraries
deploy_libraries() {
    local lib_array=($(array_by_name "$1"))
    local profile=$2
    local flags_var=$3
    local version=$4
    
    echo "Deploying libraries $version..."
    for LIB_PATH in "${lib_array[@]}"; do
        LIB_NAME="${LIB_PATH#*:}" 
        echo "Deploying library: $LIB_NAME"
        create_library_out=`FOUNDRY_PROFILE=$profile $FORGE create $LIB_PATH --from $FROM_ACCOUNT --rpc-url $ANVIL_RPC_URL --unlocked --broadcast --json`
        LIB_ADDRESS=`echo $create_library_out | jq -r '.deployedTo'`
        # Constructing library flag so the remaining contracts can be built and linkeded to these libraries
        eval "$flags_var=\"\$$flags_var --libraries $LIB_PATH:$LIB_ADDRESS\""
    done
}

# Create a temporary directory or remove it first it if exists
if [ -d "$TEMP_DIR" ]; then
    echo "Removing existing temporary folder..."
    rm -rf $TEMP_DIR
fi

mkdir $TEMP_DIR

# Copy libraries to the directory
copy_libraries LIBRARIES_PATH_08

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

# Deploy libraries and build the library flag
export LIBRARY_FLAGS_08=""
deploy_libraries LIBRARIES_PATH_08 "truffle-compat8" "LIBRARY_FLAGS_08" "0.8"


# Move out of the temporary directory
popd

# Remove the temporary directory
rm -rf $TEMP_DIR
