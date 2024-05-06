#!/usr/bin/env bash
set -euo pipefail

# TODO move me to another folder

# Compile everything
export ANVIL_PORT=8546
# TODO make this configurable
FROM_ACCOUNT_NO_ZERO="f39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
FROM_ACCOUNT="0x$FROM_ACCOUNT_NO_ZERO"
TEMP_FOLDER="$PWD/.tmp"

source $PWD/migrations_sol/start_anvil.sh

# forge build
source $PWD/migrations_sol/deploy_precompiles.sh


echo "Setting Registry Proxy"
REGISTRY_ADDRESS="0x000000000000000000000000000000000000ce10"
PROXY_BYTECODE=`cat ./out/Proxy.sol/Proxy.json | jq -r '.deployedBytecode.object'`
cast rpc anvil_setCode --rpc-url http://127.0.0.1:$ANVIL_PORT $REGISTRY_ADDRESS $PROXY_BYTECODE
REGISTRY_OWNER_ADDRESS=$FROM_ACCOUNT_NO_ZERO

echo "Setting Registry owner"
# Sets the storage of the registry so that it has an owner we control
# pasition is bytes32(uint256(keccak256("eip1967.proxy.admin")) - 1);
cast rpc anvil_setStorageAt --rpc-url http://127.0.0.1:$ANVIL_PORT $REGISTRY_ADDRESS 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103 "0x000000000000000000000000$REGISTRY_OWNER_ADDRESS"


echo "Deploying libraries"
LIBRARIES_PATH=("contracts/common/linkedlists/AddressSortedLinkedListWithMedian.sol:AddressSortedLinkedListWithMedian"
                "contracts/common/Signatures.sol:Signatures"
                "contracts/common/linkedlists/AddressLinkedList.sol:AddressLinkedList"
                "contracts/common/linkedlists/AddressSortedLinkedList.sol:AddressSortedLinkedList"
                "contracts/common/linkedlists/IntegerSortedLinkedList.sol:IntegerSortedLinkedList"
                "contracts/governance/Proposals.sol:Proposals"
)

LIBRARIES=""

for library in "${LIBRARIES_PATH[@]}"; do
    library_name="${library#*:}" 
    echo "Deploying library: $library_name"
    create_library_out=`forge create $library --from $FROM_ACCOUNT --rpc-url http://127.0.0.1:$ANVIL_PORT --unlocked --json`
    library_address=`echo $create_library_out | jq -r '.deployedTo'`
    
    LIBRARIES="$LIBRARIES --libraries $library:$library_address"
done

echo "Library flags are: $LIBRARIES"
echo "Backing up libraries"

mkdir -p $TEMP_FOLDER

LIBRARIES_FILE="$TEMP_FOLDER/libraries.tx"
rm -f $LIBRARIES_FILE
touch $LIBRARIES_FILE

echo "$LIBRARIES" > $LIBRARIES_FILE

# run migrations
BROADCAST="--broadcast"
SKIP_SUMULATION=""
# SKIP_SUMULATION="--skip-simulation" 
# BROADCAST=""

echo "Compiling with libraries... "
time forge build $LIBRARIES

time forge script migrations_sol/Migration.s.sol --tc Migration --rpc-url http://127.0.0.1:$ANVIL_PORT -vvv $BROADCAST --non-interactive --sender $FROM_ACCOUNT --unlocked -- $LIBRARIES --revert-strings || echo "Migration script failed"

# Run integration tests
source $PWD/migrations_sol/integration_tests.sh


# helper kill anvil
# kill $(lsof -i tcp:$ANVIL_PORT | tail -n 1 | awk '{print $2}')

echo "Killing Anvil"
if [[ -n $ANVIL_PID ]]; then
    kill $ANVIL_PID
fi
