# Foundry accounts
export FROM_ACCOUNT_NO_ZERO="f39Fd6e51aad88F6F4ce6aB8827279cffFb92266" # Anvil default account (1)
export FROM_ACCOUNT="0x$FROM_ACCOUNT_NO_ZERO" # Anvil default account (1)
export FROM_ACCOUNT_PRIVATE_KEY_NO_ZERO="ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" # Anvil default account (1)
export FROM_ACCOUNT_PRIVATE_KEY="0x$FROM_ACCOUNT_PRIVATE_KEY_NO_ZERO" # Anvil default account (1)

# Foundry directories
TMP_FOLDER="$PWD/.tmp"
ANVIL_FOLDER="$TMP_FOLDER/devchain"

# Foundry configurations
export ANVIL_PORT=8546
export REGISTRY_OWNER_ADDRESS=$FROM_ACCOUNT_NO_ZERO

# Foundry migration script configurations
export BROADCAST="--broadcast" # Helper to disable broadcast and simulation. On: BROADCAST="--broadcast" / Off: BROADCAST=""
export SKIP_SIMULATION="--skip-simulation" # Helper to disable simulation. On: SKIP_SIMULATION="--skip-simulation" / Off: SKIP_SIMULATION=""

# Contract addresses
export REGISTRY_ADDRESS="0x000000000000000000000000000000000000ce10"
export PROXY_ADMIN_ADDRESS='0x4200000000000000000000000000000000000018' # This address is defined in `IsL2Check.sol`

# Contract bytecode from the Foundry build artifacts
export PROXY_BYTECODE=`cat ./out/Proxy.sol/Proxy.json | jq -r '.deployedBytecode.object'`
export REGISTRY_BYTECODE=$(jq -r '.bytecode' build/contracts/Registry.json)

# Contract configurations
export COMMUNITY_REWARD_FRACTION="100000000000000000000" # 0.01 in fixidity format
export CARBON_OFFSETTING_PARTNER="0x22579CA45eE22E2E16dDF72D955D6cf4c767B0eF"
export CARBON_OFFSETTING_FRACTION="10000000000000000000" # 0.001 in fixidity format