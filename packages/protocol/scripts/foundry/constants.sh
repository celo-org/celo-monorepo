# Anvil accounts
export FROM_ACCOUNT_NO_ZERO="f39Fd6e51aad88F6F4ce6aB8827279cffFb92266" # Anvil default account (1)
export FROM_ACCOUNT="0x$FROM_ACCOUNT_NO_ZERO" # Anvil default account (1)

# Anvil configurations (Source: https://book.getfoundry.sh/reference/anvil/)
export ANVIL_PORT=8546
export ANVIL_RPC_URL_BASE="http://127.0.0.1"

export ANVIL_RPC_URL="$ANVIL_RPC_URL_BASE:$ANVIL_PORT" # TODO deprecate this variable in favor of the function below

get_anvil_rpc_url() {
  echo "$ANVIL_RPC_URL_BASE:$ANVIL_PORT"
}

# Anvil logging
export ANVIL_LOGGING_ENABLED=${ANVIL_LOGGING:=false} # Flag to enable or disable logging. Useful for local development
export GAS_LIMIT=50000000
export CODE_SIZE_LIMIT=245760 # EIP-170: Contract code size limit in bytes. Useful to increase for tests. [default: 0x6000 (~25kb)]
export BALANCE=60000 # Set the balance of the accounts. [default: 10000]
export STATE_INTERVAL=1 # Interval in seconds at which the state and block environment is to be dumped to disk.
export STEPS_TRACING="--steps-tracing" #  Steps tracing used for debug calls returning geth-style traces. Enable: "--steps-tracing" / Disable: ""

# Forge migration script configurations (Source: https://book.getfoundry.sh/reference/forge/forge-script)
export MIGRATION_SCRIPT_PATH="migrations_sol/Migration.s.sol" # Path to migration script
export MIGRATION_L2_SCRIPT_PATH="migrations_sol/MigrationL2.s.sol" # Path to L2 migration script
export MIGRATION_TARGET_CONTRACT="Migration" #  The name of the contract you want to run.
export MIGRATION_L2_TARGET_CONTRACT="MigrationL2" #  The name of the contract you want to run.
export BROADCAST="--broadcast" # Broadcasts the transactions. Enable: "--broadcast" / Disable: ""
export SKIP_SIMULATION="" # Skips on-chain simulation. Enable: "--skip-simulation" / Disable: ""
export NON_INTERACTIVE="--non-interactive" # Remove interactive prompts which appear if the contract is near the EIP-170 size limit.
export TIMEOUT=30000 # set a timeout for the avil node
export VERBOSITY_LEVEL="-vvv" # Pass multiple times to increase the verbosity (e.g. -v, -vv, -vvv).
export REGISTRY_OWNER_ADDRESS=$FROM_ACCOUNT_NO_ZERO

# Foundry directories and file names
export L1_DEVCHAIN_FILE_NAME="devchain.json" # Name of the file that will be published to NPM
export L2_DEVCHAIN_FILE_NAME="l2-devchain.json" # Name of the file that will be published to NPM
export TMP_FOLDER="$PWD/.tmp"
export TEMP_DIR="$PWD/.tmp/libraries"
export ANVIL_FOLDER="$TMP_FOLDER/devchain"
export SLEEP_DURATION=20

# Contract addresses
export REGISTRY_ADDRESS="0x000000000000000000000000000000000000ce10"
export PROXY_ADMIN_ADDRESS='0x4200000000000000000000000000000000000018' # This address is defined in `IsL2Check.sol`

# Contract configurations
export COMMUNITY_REWARD_FRACTION="100000000000000000000" # 0.01 in fixidity format
export CARBON_OFFSETTING_PARTNER="0x22579CA45eE22E2E16dDF72D955D6cf4c767B0eF"
export CARBON_OFFSETTING_FRACTION="10000000000000000000" # 0.001 in fixidity format
export REGISTRY_STORAGE_LOCATION="0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103" # Position is bytes32(uint256(keccak256("eip1967.proxy.admin")) - 1);
GOLD_TOKEN_CELO_SUPPLY_CAP=1000000000 # `GoldToken.CELO_SUPPLY_CAP()`
GOLD_TOKEN_TOTAL_SUPPLY=700000000 # Arbitrary amount chosen to be approximately equal to `GoldToken.totalSupply()` on the L1 Mainnet (695,313,643 CELO as of this commit).
export CELO_UNRELEASED_TREASURY_INITIAL_BALANCE="$(($GOLD_TOKEN_CELO_SUPPLY_CAP - $GOLD_TOKEN_TOTAL_SUPPLY))" # During the real L2 genesis, the VM will calculate and set an appropriate balance.
export RESERVE_INITIAL_BALANCE="5000000" # setting this here because it gets overwritten in the L2 migration script

# Contract libraries
export LIBRARIES_PATH=(
  "contracts/common/linkedlists/AddressSortedLinkedListWithMedian.sol:AddressSortedLinkedListWithMedian"
  "contracts/common/Signatures.sol:Signatures"
  "contracts-0.8/common/linkedlists/AddressLinkedList.sol:AddressLinkedList"
  "contracts/common/linkedlists/AddressSortedLinkedList.sol:AddressSortedLinkedList"
  "contracts/common/linkedlists/IntegerSortedLinkedList.sol:IntegerSortedLinkedList"
  "contracts/governance/Proposals.sol:Proposals"
)
export LIBRARY_DEPENDENCIES_PATH=(
  "contracts/common/FixidityLib.sol"
  "contracts/common/linkedlists/LinkedList.sol"
  "contracts-0.8/common/linkedlists/LinkedList.sol"
  "contracts/common/linkedlists/SortedLinkedList.sol"
  "contracts/common/linkedlists/SortedLinkedListWithMedian.sol"
  "lib/openzeppelin-contracts/contracts/math/SafeMath.sol"
  "lib/openzeppelin-contracts8/contracts/utils/math/SafeMath.sol"
  "lib/openzeppelin-contracts/contracts/math/Math.sol"
  "lib/openzeppelin-contracts/contracts/cryptography/ECDSA.sol"
  "lib/openzeppelin-contracts/contracts/utils/Address.sol"
  "lib/solidity-bytes-utils/contracts/BytesLib.sol"
  "lib/celo-foundry/lib/forge-std/src/console.sol"
)
