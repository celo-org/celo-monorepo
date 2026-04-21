#!/bin/sh
RPC_URL="${RPC_URL:-http://127.0.0.1:8545}"

# ── Network Selection ───────────────────────────────────────
[ -z "${NETWORK:-}" ] && echo "Need to set the NETWORK via env" && exit 1;
case "$NETWORK" in
  sepolia)
    SAFE=0x009A6Ac23EeBe98488ED28A52af69Bf46F1C18cb
    SUPERCHAIN_CONFIG_PROXY=0x31bEef32135c90AE8E56Fb071B3587de289Aaf77
    PROXY_ADMIN=0xF7d7A3d3bb8aBb6829249B3D3aD3d525D052027e
    SYSTEM_CONFIG_PROXY=0x760a5F022C9940f4A074e0030be682F560d29818
    DISPUTE_GAME_FACTORY_PROXY=0x57C45d82D1a995F1e135B8D7EDc0a6BB5211cfAA
    DELAYED_WETH_PROXY=0x082F5f58B664CD1d51F9845fEE322aBA2cED9CbA
    PROTOCOL_VERSIONS_PROXY=0x0e2d45F3393C3A02ebf285F998c5bF990A1541cd
    NETWORK_LABEL="Celo Sepolia"
    ;;
  chaos)
    SAFE=0x6F8DB5374003c9ffa7084d8b65c57655963766a9
    SUPERCHAIN_CONFIG_PROXY=0x7801D0a005d13CB66f8113BC28cb2640D8f44A6F
    PROXY_ADMIN=0xb2a0c2b49cdc2d3f0a0a291be0a6c20559ec053e
    SYSTEM_CONFIG_PROXY=0x6baf5959cc06a39793c338e6586f49473c731b4c
    DISPUTE_GAME_FACTORY_PROXY=0x338ac809e6a045cfc8aeb16ff8a4329147b61afb
    DELAYED_WETH_PROXY=0x9a95f7f7cdbb5195674a32d1579504e8fd302cc9
    PROTOCOL_VERSIONS_PROXY=0x433a83893DDA68B941D4aefA908DED9c599522ad
    NETWORK_LABEL="Celo Chaos"
    ;;
  *)
    echo "Usage: NETWORK=[sepolia|chaos] $0"
    echo "  sepolia  — Celo Sepolia Testnet"
    echo "  chaos    — Celo Chaos Testnet"
    exit 1
    ;;
esac

PROXY_ADMIN_LOWER=$(echo "${PROXY_ADMIN#0x}" | tr '[:upper:]' '[:lower:]')

echo "Network: $NETWORK_LABEL"
echo "Target Safe: $SAFE"
echo ""

# ============================================================
# 1. Fix SuperchainConfig proxy admin → ProxyAdmin
# ============================================================
# EIP-1967 admin slot → ProxyAdmin
echo "Setting SuperchainConfig proxy admin..."
cast rpc anvil_setStorageAt \
  $SUPERCHAIN_CONFIG_PROXY \
  0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103 \
  0x000000000000000000000000${PROXY_ADMIN_LOWER} \
  -r $RPC_URL

# ============================================================
# 2. Transfer ownership of contracts to Safe
# ============================================================
# For each contract, read the current owner, impersonate it,
# and call transferOwnership() to the target Safe.
transfer_ownership() {
  CONTRACT=$1
  NAME=$2

  CURRENT_OWNER=$(cast call $CONTRACT "owner()(address)" -r $RPC_URL)
  if [ "$CURRENT_OWNER" = "$SAFE" ]; then
    echo "  $NAME: already owned by Safe, skipping"
    return
  fi

  echo "  $NAME: $CURRENT_OWNER → $SAFE"
  cast rpc anvil_impersonateAccount $CURRENT_OWNER -r $RPC_URL > /dev/null
  cast rpc anvil_setBalance $CURRENT_OWNER 0x8AC7230489E80000 -r $RPC_URL > /dev/null
  cast send --unlocked --from $CURRENT_OWNER $CONTRACT "transferOwnership(address)" $SAFE -r $RPC_URL > /dev/null
  cast rpc anvil_stopImpersonatingAccount $CURRENT_OWNER -r $RPC_URL > /dev/null
}

echo "Transferring ownership to Safe..."
transfer_ownership $PROXY_ADMIN "ProxyAdmin"
transfer_ownership $SYSTEM_CONFIG_PROXY "SystemConfig"
transfer_ownership $DISPUTE_GAME_FACTORY_PROXY "DisputeGameFactory"
transfer_ownership $DELAYED_WETH_PROXY "DelayedWETH"
transfer_ownership $PROTOCOL_VERSIONS_PROXY "ProtocolVersions"

# ============================================================
# 3. Validation
# ============================================================
echo ""
echo "=== Validation ==="
echo "--- SuperchainConfig Proxy ($SUPERCHAIN_CONFIG_PROXY) ---"
echo "Admin: $(cast storage $SUPERCHAIN_CONFIG_PROXY 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103 -r $RPC_URL)"
echo ""
echo "--- Ownership (expected: $SAFE) ---"
echo "ProxyAdmin owner:          $(cast call $PROXY_ADMIN 'owner()(address)' -r $RPC_URL)"
echo "SystemConfig owner:        $(cast call $SYSTEM_CONFIG_PROXY 'owner()(address)' -r $RPC_URL)"
echo "DisputeGameFactory owner:  $(cast call $DISPUTE_GAME_FACTORY_PROXY 'owner()(address)' -r $RPC_URL)"
echo "DelayedWETH owner:         $(cast call $DELAYED_WETH_PROXY 'owner()(address)' -r $RPC_URL)"
echo "ProtocolVersions owner:    $(cast call $PROTOCOL_VERSIONS_PROXY 'owner()(address)' -r $RPC_URL)"
