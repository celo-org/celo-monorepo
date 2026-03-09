#!/bin/sh
#
# Migrates OP Stack L1 contract ownership from an EOA to a Gnosis Safe.
# Performs: ProxyAdmin, SystemConfig, DisputeGameFactory ownership transfers
#           + SuperchainConfig proxy admin migration.
#
# Required env vars (set externally):
#   L1_RPC_URL  - L1 RPC endpoint
#   OP_DIR      - Path to optimism repository root
#   PK          - Private key of the current owner EOA
#   NEW_SAFE    - Address of the target Gnosis Safe

set -euo pipefail

check_env_var() {
    local var_name=$1
    local var_value=${!var_name:-}

    if [ -z "$var_value" ]; then
        echo "ERROR: $var_name is not set"
        echo "Please export $var_name before running this script"
        exit 1
    fi
}

echo "=== Migrate Ownership to Safe ==="
echo ""
echo "Checking environment variables..."
check_env_var "L1_RPC_URL"
check_env_var "OP_DIR"
check_env_var "PK"
check_env_var "NEW_SAFE"

# ── Chaos Network Contract Addresses ──────────────────────────
export PROXY_ADMIN="0xb2a0c2b49cdc2d3f0a0a291be0a6c20559ec053e"
export ADDRESS_MANAGER="0xe79a9c96f2ea3340add851f83dbfdc2ff4ceb838"
export SC_OLD_PROXY_ADMIN="0xb35eb9f48732f18049ff77abc5147a0fe3c76a47"

export SYSTEM_CONFIG="0x6baf5959cc06a39793c338e6586f49473c731b4c"
export OPTIMISM_PORTAL="0x101f7d8038beb55d92919e9f944feb0faf211a9b"
export L1_STANDARD_BRIDGE="0x95f39a9dd86e4c777fd6dc4404d94fd32c23ea30"
export L1_ERC721_BRIDGE="0x493ec8a8956d1239d01450a6adb6f7f091d2a81f"
export OPTIMISM_MINTABLE_ERC20_FACTORY="0x92fa5b9a26580b7ecc495ffab4cbc0d995be5b5a"
export DISPUTE_GAME_FACTORY="0x338ac809e6a045cfc8aeb16ff8a4329147b61afb"
export ANCHOR_STATE_REGISTRY="0x7a7d0d1b0114e8a5a489f488b9ccab0611333687"
export DELAYED_WETH="0x9a95f7f7cdbb5195674a32d1579504e8fd302cc9"
export PROTOCOL_VERSIONS="0x433a83893DDA68B941D4aefA908DED9c599522ad"
export CELO_SUPERCHAIN_CONFIG="0xc731e02cb012e8d6e6f36cffb05d300e262d34bf"
export SUPERCHAIN_CONFIG="0x7801D0a005d13CB66f8113BC28cb2640D8f44A6F"

echo "  New Safe: $NEW_SAFE"
echo "  RPC URL:  $L1_RPC_URL"
echo ""

forge script MigrateOwnershipToSafe.s.sol \
  --rpc-url "$L1_RPC_URL" \
  --root "$OP_DIR/packages/contracts-bedrock" \
  --private-key "$PK" \
  --broadcast
