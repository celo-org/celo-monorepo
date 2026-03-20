#!/bin/sh
#
# Migrates OP Stack L1 contract ownership from an EOA to a Gnosis Safe.
# Performs: ProxyAdmin, SystemConfig, DisputeGameFactory, DelayedWETH,
#           ProtocolVersions ownership transfers + SuperchainConfig proxy
#           admin migration.
#
# Required env vars (set externally):
#   L1_RPC_URL  - L1 RPC endpoint
#   OP_DIR      - Path to optimism repository root
#   PK          - Private key of the current owner EOA
#   NETWORK     - Network identifier (sepolia or chaos)

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
check_env_var "NETWORK"

case "$NETWORK" in
  sepolia)
    export NEW_SAFE="0x009A6Ac23EeBe98488ED28A52af69Bf46F1C18cb"
    export PROXY_ADMIN="0xF7d7A3d3bb8aBb6829249B3D3aD3d525D052027e"
    export ADDRESS_MANAGER="0x8f0c6FC85A53551d87899aC2a5Af2B48C793eB63"
    export SC_OLD_PROXY_ADMIN="0x281e8b80023bd3f7f43a4d7923f5372fc507ff8f"
    export SYSTEM_CONFIG="0x760a5F022C9940f4A074e0030be682F560d29818"
    export OPTIMISM_PORTAL="0x44AE3D41a335a7d05EB533029917aAd35662dcC2"
    export L1_STANDARD_BRIDGE="0xEc18a3c30131A0Db4246e785355fBc16E2eAF408"
    export L1_ERC721_BRIDGE="0xB8c8dCBCCd0f7C5e7a2184b13B85D461d8711e96"
    export OPTIMISM_MINTABLE_ERC20_FACTORY="0x261BE2eD7241feD9c746e0B5DFf3A4a335991377"
    export DISPUTE_GAME_FACTORY="0x57C45d82D1a995F1e135B8D7EDc0a6BB5211cfAA"
    export ANCHOR_STATE_REGISTRY="0xD73BA8168A61F3E917F0930D5C0401aA47e269D6"
    export DELAYED_WETH="0x082F5f58B664CD1d51F9845fEE322aBA2cED9CbA"
    export PROTOCOL_VERSIONS="0x0e2d45F3393C3A02ebf285F998c5bF990A1541cd"
    export CELO_SUPERCHAIN_CONFIG="0x5c34140A1273372211Bd75184ccc9e434B38d86b"
    export SUPERCHAIN_CONFIG="0x31bEef32135c90AE8E56Fb071B3587de289Aaf77"
    ;;
  chaos)
    export NEW_SAFE="0x6F8DB5374003c9ffa7084d8b65c57655963766a9"
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
    ;;
  *)
    echo "Usage: NETWORK=[sepolia|chaos] $0"
    exit 1
    ;;
esac

echo "  Network:  $NETWORK"
echo "  New Safe: $NEW_SAFE"
echo "  RPC URL:  $L1_RPC_URL"
echo ""

forge script MigrateOwnershipToSafe.s.sol \
  --rpc-url "$L1_RPC_URL" \
  --root "$OP_DIR/packages/contracts-bedrock" \
  --private-key "$PK" \
  --broadcast
