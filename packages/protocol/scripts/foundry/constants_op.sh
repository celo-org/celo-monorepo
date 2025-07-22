# Source original constants for anvil
source ./constants.sh

# Modify constants for OP Geth
export ANVIL_PORT=9545 # Port for op-geth
export ANVIL_RPC_URL="http://127.0.0.1:$ANVIL_PORT"
