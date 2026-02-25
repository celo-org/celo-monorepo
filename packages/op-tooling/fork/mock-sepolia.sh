#!/bin/sh
RPC_URL=http://127.0.0.1:8545

# ── Network Selection ───────────────────────────────────────
[ -z "${NETWORK:-}" ] && echo "Need to set the NETWORK via env" && exit 1;
case "$NETWORK" in
  sepolia)
    SUPERCHAIN_CONFIG_PROXY=0x31bEef32135c90AE8E56Fb071B3587de289Aaf77
    PROXY_ADMIN=0xF7d7A3d3bb8aBb6829249B3D3aD3d525D052027e
    PROXY_ADMIN_OWNER=0x5e60d897Cd62588291656b54655e98ee73f0aabF
    NETWORK_LABEL="Celo Sepolia"
    ;;
  chaos)
    SUPERCHAIN_CONFIG_PROXY=0x852A5763dA3Fdf51a8b816E02b91A054904Bd8B0
    PROXY_ADMIN=0x6151d1cc7724ee7594f414c152320757c9c5844e
    PROXY_ADMIN_OWNER=0xa3A3a43E2de78070129C697A5CdCa0618B1f574d
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
# 2. Convert ProxyAdminOwner EOA into a Gnosis Safe
# ============================================================
# ProxyAdminOwner is an EOA. The superchain-ops simulation framework expects a Gnosis Safe.
# We plant GnosisSafeProxy bytecode and configure storage to make it a valid Safe.
SAFE_SINGLETON=0xfb1bffc9d739b8d520daf37df666da4c687191ea
SENTINEL=0x0000000000000000000000000000000000000001
MOCK_OWNER=${MOCK_OWNER:-0x2529fcD95f714af9031d70ff02B196704B65FD27}  # Must be a pure EOA (no code) on Sepolia

echo "Converting ProxyAdminOwner EOA into Gnosis Safe..."

# 2a. Plant GnosisSafeProxy bytecode (same as OP Sepolia ProxyAdminOwner 0x1Eb2fFc903729a0F03966B917003800b145F56E2)
cast rpc anvil_setCode \
  $PROXY_ADMIN_OWNER \
  0x608060405273ffffffffffffffffffffffffffffffffffffffff600054167fa619486e0000000000000000000000000000000000000000000000000000000060003514156050578060005260206000f35b3660008037600080366000845af43d6000803e60008114156070573d6000fd5b3d6000f3fea2646970667358221220d1429297349653a4918076d650332de1a1068c5f3e07c5c82360c277770b955264736f6c63430007060033 \
  -r $RPC_URL

# 2b. Slot 0: singleton (Safe implementation)
cast rpc anvil_setStorageAt \
  $PROXY_ADMIN_OWNER \
  0x0000000000000000000000000000000000000000000000000000000000000000 \
  0x000000000000000000000000${SAFE_SINGLETON#0x} \
  -r $RPC_URL

# 2c. Slot 3: ownerCount = 1
cast rpc anvil_setStorageAt \
  $PROXY_ADMIN_OWNER \
  0x0000000000000000000000000000000000000000000000000000000000000003 \
  0x0000000000000000000000000000000000000000000000000000000000000001 \
  -r $RPC_URL

# 2d. Slot 4: threshold = 1
cast rpc anvil_setStorageAt \
  $PROXY_ADMIN_OWNER \
  0x0000000000000000000000000000000000000000000000000000000000000004 \
  0x0000000000000000000000000000000000000000000000000000000000000001 \
  -r $RPC_URL

# 2e. Owners linked list: SENTINEL → MOCK_OWNER → SENTINEL
#      owners mapping is at slot 2: mapping(address => address)
SENTINEL_SLOT=$(cast index address $SENTINEL 2)
OWNER_SLOT=$(cast index address $MOCK_OWNER 2)

# SENTINEL → MOCK_OWNER
cast rpc anvil_setStorageAt \
  $PROXY_ADMIN_OWNER \
  $SENTINEL_SLOT \
  0x000000000000000000000000${MOCK_OWNER#0x} \
  -r $RPC_URL

# MOCK_OWNER → SENTINEL
cast rpc anvil_setStorageAt \
  $PROXY_ADMIN_OWNER \
  $OWNER_SLOT \
  0x000000000000000000000000${SENTINEL#0x} \
  -r $RPC_URL


echo "Funding mock owner with 10 ETH..."
cast rpc anvil_setBalance $MOCK_OWNER 0x8AC7230489E80000 -r $RPC_URL

# ============================================================
# 3. Validation
# ============================================================
echo ""
echo "=== Validation ==="
echo "--- SuperchainConfig Proxy ($SUPERCHAIN_CONFIG_PROXY) ---"
echo "Admin: $(cast storage $SUPERCHAIN_CONFIG_PROXY 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103 -r $RPC_URL)"
echo "--- ProxyAdminOwner (mocked Safe) ---"
echo "Code exists: $(cast code $PROXY_ADMIN_OWNER -r $RPC_URL | head -c 20)..."
echo "Threshold: $(cast call $PROXY_ADMIN_OWNER 'getThreshold()(uint256)' -r $RPC_URL)"
echo "Owners: $(cast call $PROXY_ADMIN_OWNER 'getOwners()(address[])' -r $RPC_URL)"
echo "Is owner ($MOCK_OWNER): $(cast call $PROXY_ADMIN_OWNER 'isOwner(address)(bool)' $MOCK_OWNER -r $RPC_URL)"
echo "Mock owner balance: $(cast balance $MOCK_OWNER -r $RPC_URL -e) ETH"
