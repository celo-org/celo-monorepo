#!/bin/bash
: '
  Uses Celo CLI ("network:contracts") to get all core contracts and their implementation addresses.
  Uses Foundry ("cast code") to get the bytecode deployed at each core contract implementation address.

  Requirements:
  1. Have Foundry installed
  2. Have celocli installed
  '

# Get the current date and time for the filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Get the directory where the script is located, assuming the script is in the root or a subdirectory of the repo
BASE_DIRECTORY="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Create the output directory if it doesn't exist
OUTPUT_DIRECTORY="$BASE_DIRECTORY/out"
mkdir -p "$OUTPUT_DIRECTORY"
OUTPUT_FILE="$OUTPUT_DIRECTORY/onchain_bytecode_sizes_$TIMESTAMP.csv"
TEMP_FILE="temp_$TIMESTAMP.txt"

# Set the RPC URL using environment variable or fallback to the default value
RPC_URL="${RPC_URL:-https://forno.celo.org}"
if [ "$RPC_URL" == "https://forno.celo.org" ]; then
  echo "No custom RPC URL provided. Using default RPC URL: $RPC_URL."
else
  echo "Using custom RPC URL: $RPC_URL"
fi

# Initialize the temporary file
echo "" > $TEMP_FILE

# Initialize the CSV output file with headers
echo "Contract,Implementation Address,Size (KB)" > $OUTPUT_FILE

# Fetch contract information from celocli and process the output
celocli network:contracts --node $RPC_URL | grep -E '0x[a-fA-F0-9]{40}' | while IFS=" " read -ra line
do
  # Extract contract name and implementation address from the output
  contract="${line[0]}"
  implementation_address="${line[2]}"

  # Ensure address is not empty or undefined
  if [ -z "$implementation_address" ] || [ "$implementation_address" == "NONE" ]; then
    echo "No implementation address available for $contract"
    echo "$contract,NONE,0" >> $TEMP_FILE
    echo "$contract,NONE,0"
    continue
  fi

  # Fetch bytecode using cast with the specified flag order
  bytecode=$(cast code $implementation_address --rpc-url $RPC_URL 2>/dev/null) # Redirect stderr to null to handle any errors gracefully

  # Check if bytecode was successfully fetched; handle cases where the contract might not have bytecode (e.g., non-contract addresses)
  if [[ -z "$bytecode" || "$bytecode" == "0x" ]]; then
    echo "No bytecode found for $contract at $implementation_address"
    echo "$contract,$implementation_address,0" >> $TEMP_FILE
    echo "$contract,$implementation_address,0"
    continue
  fi

  : '
    Converts the hexadecimal string to bytes, to measure the size in kilobytes.
    The size can be calculated by counting the number of characters, dividing by two 
    (since each byte is represented by two characters), and then converting to kilobytes.
    Subtracts 2 characters to account for the "0x" prefix.
    '
  # Calculate size in bytes (hex chars / 2)
  size_bytes=$(((${#bytecode} - 2) / 2))

  # Calculate size in kilobytes
  size_kb=$(echo "scale=3; $size_bytes / 1024" | bc)

  # Output to the temporary file and console
  echo "$contract,$implementation_address,$size_kb" >> $TEMP_FILE
  echo "$contract,$implementation_address,$size_kb"
done

# Sort the temporary file by size in descending order and append to the final CSV
sort -t, -k3,3nr $TEMP_FILE >> $OUTPUT_FILE

# Cleanup temporary file
rm $TEMP_FILE


# Output completion message
echo "Data extraction complete. Results saved to $OUTPUT_FILE"