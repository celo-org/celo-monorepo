#!/bin/bash
: '
  Uses:
    1. Truffle build artifacts located in the packages/protocol/build/ directory

  Requirements:
  1. Have the Truffle build artifacts in the packages/protocol/build/ directory
  '

# Get the current date and time for the filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Get the directory where the script is located, assuming the script is in the root or a subdirectory of the repo
BASE_DIRECTORY="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Get the root of the repo based on the known structure
REPO_ROOT_DIRECTORY="$BASE_DIRECTORY/../../../"

# Get the directory with build artifacts
BUILD_ARTIFACT_DIRECTORY="${REPO_ROOT_DIRECTORY}protocol/build/contracts"

# Create the output directory if it doesn't exist
OUTPUT_DIRECTORY="$BASE_DIRECTORY/out"
mkdir -p "$OUTPUT_DIRECTORY"
OUTPUT_FILE="$OUTPUT_DIRECTORY/build_artefact_bytecode_sizes_$TIMESTAMP.csv"

# Temporary file to collect data before sorting
TEMP_FILE=$(mktemp)

# Write the header to the output file
echo "Contract,Size (KB)" > "$OUTPUT_FILE"

# Find all JSON files in the subdirectories and process them
find "$BUILD_ARTIFACT_DIRECTORY" \
     "${BUILD_ARTIFACT_DIRECTORY}-0.8" \
     "${BUILD_ARTIFACT_DIRECTORY}-mento" -name '*.json' | while read -r file
do
    # Extract the contract name and bytecode using jq
    contract=$(jq -r '.contractName' "$file")
    bytecode=$(jq -r '.deployedBytecode' "$file")
    
    : '
      Converts the hexadecimal string to bytes, to measure the size in kilobytes.
      The size can be calculated by counting the number of characters, dividing by two 
      (since each byte is represented by two characters), and then converting to kilobytes.
      Subtracts 2 characters to account for the "0x" prefix.
      '
    # Calculate the size in bytes (hex chars / 2)
    size_bytes=$(((${#bytecode} - 2) / 2))

    # Calculate size in kilobytes with scale 3 precision
    size_kb=$(echo "scale=3; $size_bytes / 1024" | bc)

    # Append the data to the temporary file
    echo "$contract,$size_kb" >> "$TEMP_FILE"

    # Print progress to the console
    echo "$contract,$size_kb"
done

# Sort the temporary file by size in descending order and append to the output file
sort -t',' -k2,2nr "$TEMP_FILE" >> "$OUTPUT_FILE"

# Clean up the temporary file
rm "$TEMP_FILE"

# Output completion message
echo "Data extraction complete. Results saved to $OUTPUT_FILE"
