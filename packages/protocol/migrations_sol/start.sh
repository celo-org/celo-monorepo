#!/usr/bin/env bash
set -euo pipefail

# TODO move me to another folder

# Compile everything
export ANVIL_PORT=8546
# TODO make this configurable
FROM_ACCOUNT=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266


source $PWD/migrations_sol/start_anvil.sh

# forge build
source $PWD/migrations_sol/deploy_precompiles.sh


# cast rpc eth_getStorageAt --rpc-url http://127.0.0.1:8545 0x037A5D00E894d857Dd4eE9500ABa00032B5669BE
# cast rpc anvil_impersonateAccount --rpc-url http://127.0.0.1:8545 0x0000000000000000000000000000000000000000
# Set's the bytecode of a Poxy to the registry address
echo "Setting Registry Proxy"
REGISTRY_ADDRESS="0x000000000000000000000000000000000000ce10"
PROXY_BYTECODE=`cat ./out/Proxy.sol/Proxy.json | jq -r '.deployedBytecode.object'`
cast rpc anvil_setCode --rpc-url http://127.0.0.1:$ANVIL_PORT $REGISTRY_ADDRESS $PROXY_BYTECODE
REGISTRY_OWNER_ADDRESS="f39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
# pasition is bytes32(uint256(keccak256("eip1967.proxy.admin")) - 1);
echo "Setting Registry owner"
# Sets the storage of the registry so that it has an owner we control
cast rpc anvil_setStorageAt --rpc-url http://127.0.0.1:$ANVIL_PORT $REGISTRY_ADDRESS 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103 "0x000000000000000000000000$REGISTRY_OWNER_ADDRESS"


echo "Deploying libraries"
LIBRARIES_PATH=("contracts/common/linkedlist/AddressSortedLinkedListWithMedian.sol:AddressSortedLinkedListWithMedian"
                "contracts/common/Signatures.sol:Signatures"
                "contracts/common/linkedlist/AddressLinkedList.sol:AddressLinkedList"
                "contracts/common/linkedlists/AddressSortedLinkedList.sol:AddressSortedLinkedList"
                "contracts/common/linkedlists/IntegerSortedLinkedList.sol:IntegerSortedLinkedList"
                "contracts/governance/Proposals.sol:Proposals"
)

LIBRARIES=""
for library in "${LIBRARIES_PATH[@]}"; do
    library_name="${library#*:}" 
    echo "Deploying library: $library_name"
    create_library_out=`forge create $library_name --from $FROM_ACCOUNT --rpc-url http://127.0.0.1:$ANVIL_PORT --unlocked --json`
    library_address=`echo $create_library_out | jq -r '.deployedTo'`
    
    LIBRARIES="$LIBRARIES --libraries $library:$library_address"
done

echo "Library flags are: $LIBRARIES"

# run migrations
BROADCAST="--broadcast"
SKIP_SUMULATION=""
# --skip-simulation
# BROADCAST=""

echo "Compiling with libraries... "
time forge build $LIBRARIES
exit 1
#--skip-simulation
# TODO for some reason the flag --unlocked is not working for all the anvil keys, so pk is given
time forge script migrations_sol/Migration.s.sol --rpc-url http://127.0.0.1:$ANVIL_PORT -vvv $BROADCAST $SKIP_SUMULATION --non-interactive -- $LIBRARIES --revert-strings || echo "Migration script failed"

# Run integration tests
source $PWD/migrations_sol/integration_tests.sh


# helper kill anvil
# kill $(lsof -i tcp:8545 | tail -n 1 | awk '{print $2}')

echo "Killing Anvil"
if [[ -n $ANVIL_PID ]]; then
    kill $ANVIL_PID
fi

# TODO dump state to temp folder
