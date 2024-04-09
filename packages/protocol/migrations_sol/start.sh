#!/usr/bin/env bash
set -euo pipefail


# TODO move me to another folder
# Compile everything
export ANVIL_PORT=8546
FROM_ACCOUNT=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266


source $PWD/migrations_sol/start_anvil.sh

# forge build

source $PWD/migrations_sol/deploy_precompiles.sh





# deploy libraries
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
#BROADCAST="--broadcast"
BROADCAST=""

# LIBRARIES="--libraries contracts/common/linkedlist/AddressSortedLinkedListWithMedian.sol:AddressSortedLinkedListWithMedian:$deployed_to --libraries contracts/common/Signatures.sol:Signatures:0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 --libraries contracts/common/linkedlist/AddressLinkedList.sol:AddressLinkedList:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --libraries contracts/common/linkedlists/AddressSortedLinkedList.sol:AddressSortedLinkedList:0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 --libraries contracts/common/linkedlists/IntegerSortedLinkedList.sol:IntegerSortedLinkedList:0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9 --libraries contracts/governance/Proposals.sol:Proposals:0x5FC8d32690cc91D4c39d9d3abcBD16989F875707"
# recomile with the libraries
echo "Compiling..."
time forge build $LIBRARIES

forge script migrations_sol/Migration.s.sol --rpc-url http://127.0.0.1:$ANVIL_PORT -vvv $BROADCAST --skip-simulation --slow -- $LIBRARIES || echo "Migration script failed"

# Run integration tests
# TODO for some reason match path doesn't work
# forge test --fork-url http://127.0.0.1:8545 --match-contract=IntegrationTest -vvv # || echo "Test failed" # TODO for some reason the echo didn't work



echo "Killing Anvil"
if [[ -n $ANVIL_PID ]]; then
    kill $ANVIL_PID
fi

# TODO dump state to temp folder

# helper kill anvil
# kill $(lsof -i tcp:8545 | tail -n 1 | awk '{print $2}')