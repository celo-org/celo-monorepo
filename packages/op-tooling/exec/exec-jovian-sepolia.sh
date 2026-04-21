#!/usr/bin/env bash
set -euo pipefail

# ─── Args ────────────────────────────────────────────────────
VERSION=${1:?Usage: $0 <v4|v5|succ-v2>}
case $VERSION in
  v4|v5|succ-v2) ;;
  *) echo "Usage: $0 <v4|v5|succ-v2>" && exit 1 ;;
esac

# ─── Required env ────────────────────────────────────────────
[ -z "${PK:-}" ] && echo "PK env is required" && exit 1
echo "Logged in as wallet: $(cast wallet address --private-key $PK)"

# ─── Optional env ────────────────────────────────────────────
RPC_URL=${RPC_URL:-"http://127.0.0.1:8545"}
NETWORK=${NETWORK:-"sepolia"}

case $NETWORK in
  sepolia|chaos) ;;
  *) echo "Unsupported NETWORK=$NETWORK (expected: sepolia or chaos)" && exit 1 ;;
esac

# ─── Safe tx defaults (shared across all networks) ──────────
VALUE=0
OP_CALL=0
OP_DELEGATECALL=1
SAFE_TX_GAS=0
BASE_GAS=0
GAS_PRICE=0
GAS_TOKEN=0x0000000000000000000000000000000000000000
MULTICALL3=0xcA11bde05977b3631167028862bE2a173976CA11

# ─── Helpers ─────────────────────────────────────────────────
# Compute Safe getTransactionHash for the given params.
# Usage: safe_tx_hash <safe> <to> <data> <operation> <nonce>
safe_tx_hash() {
  cast call "$1" \
    "getTransactionHash(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,uint256)(bytes32)" \
    "$2" $VALUE "$3" "$4" $SAFE_TX_GAS $BASE_GAS $GAS_PRICE $GAS_TOKEN $REFUND_RECEIVER "$5" \
    -r $RPC_URL
}

# Execute Safe transaction.
# Usage: safe_exec <safe> <to> <data> <operation> <sig> [--gas-limit N]
safe_exec() {
  local safe=$1 to=$2 data=$3 op=$4 sig=$5; shift 5
  cast send "$safe" \
    "execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)" \
    "$to" $VALUE "$data" "$op" $SAFE_TX_GAS $BASE_GAS $GAS_PRICE $GAS_TOKEN $REFUND_RECEIVER "$sig" \
    --private-key $PK \
    -r $RPC_URL \
    "$@"
}

# ─── Banner ──────────────────────────────────────────────────
echo "--------- ${VERSION^^} ${NETWORK^^} ---------"

# ─────────────────────────────────────────────────────────────
#  CHAOS — flat Safe (single owner, threshold 1)
#  Calldata generated dynamically. No nested approval chain.
# ─────────────────────────────────────────────────────────────
if [ "$NETWORK" = "chaos" ]; then
  SAFE_ADDRESS=0x6F8DB5374003c9ffa7084d8b65c57655963766a9
  REFUND_RECEIVER=0xa3A3a43E2de78070129C697A5CdCa0618B1f574d

  # chaos contract addresses
  CHAOS_SYSTEM_CONFIG=0x6baf5959cc06a39793c338e6586f49473c731b4c
  CHAOS_PROXY_ADMIN=0xb2a0c2b49cdc2d3f0a0a291be0a6c20559ec053e
  CHAOS_DGF=0x338ac809e6a045cfc8aeb16ff8a4329147b61afb
  CHAOS_PRESTATE_V4=0x03eb07101fbdeaf3f04d9fb76526362c1eea2824e4c6e970bdb19675b72e4fc8
  CHAOS_PRESTATE_V5=0x03caa1871bb9fe7f9b11217c245c16e4ded33367df5b3ccb2c6d0a847a217d1b

  case $VERSION in
    v4|v5)
      [ -z "${OPCM_ADDRESS:-}" ] && echo "OPCM_ADDRESS env is required for chaos $VERSION" && exit 1
      TARGET_ADDRESS=$OPCM_ADDRESS
      PRESTATE=$( [ "$VERSION" = "v4" ] && echo "$CHAOS_PRESTATE_V4" || echo "$CHAOS_PRESTATE_V5" )
      CALLDATA=$(cast calldata 'upgrade((address,address,bytes32)[],bool)' \
        "[($CHAOS_SYSTEM_CONFIG,$CHAOS_PROXY_ADMIN,$PRESTATE)]" true)
      ;;
    succ-v2)
      [ -z "${SUCCINCT_IMPL:-}" ] && echo "SUCCINCT_IMPL env is required for chaos succ-v2" && exit 1
      SC_OWNER_TARGET=${SC_OWNER_TARGET:-$SAFE_ADDRESS}
      TARGET_ADDRESS=$MULTICALL3
      # aggregate3: setImplementation(42, succinctImpl) + transferOwnership(newOwner)
      SET_IMPL=$(cast calldata 'setImplementation(uint32,address)' 42 $SUCCINCT_IMPL)
      XFER_OWN=$(cast calldata 'transferOwnership(address)' $SC_OWNER_TARGET)
      CALLDATA=$(cast calldata 'aggregate3((address,bool,bytes)[])' \
        "[($CHAOS_DGF,false,$SET_IMPL),($CHAOS_SYSTEM_CONFIG,false,$XFER_OWN)]")
      ;;
  esac

  # read current nonce from chain
  SAFE_NONCE=$(cast call $SAFE_ADDRESS "nonce()(uint256)" -r $RPC_URL)
  echo "Safe nonce: $SAFE_NONCE"
  echo "Target: $TARGET_ADDRESS"
  echo "Calldata: ${CALLDATA:0:74}..."

  # compute tx hash & sign
  TX_HASH=$(safe_tx_hash $SAFE_ADDRESS $TARGET_ADDRESS "$CALLDATA" $OP_DELEGATECALL $SAFE_NONCE)
  echo "Tx hash: $TX_HASH"

  SIGNATURE=$(cast wallet sign --no-hash $TX_HASH --private-key $PK)
  echo "Signature: ${SIGNATURE:0:20}..."

  # execute directly on the flat Safe
  echo "Executing..."
  safe_exec $SAFE_ADDRESS $TARGET_ADDRESS "$CALLDATA" $OP_DELEGATECALL "$SIGNATURE" --gas-limit 16000000
  echo "Upgrade executed"
  echo "--------- EOF ---------"
  exit 0
fi

# ─────────────────────────────────────────────────────────────
#  SEPOLIA — nested Safes (2-of-2: Council + cLabs → Parent)
#  Pre-signed signatures and hardcoded calldata per version.
# ─────────────────────────────────────────────────────────────

# sepolia safes
PARENT_SAFE_ADDRESS=0x009A6Ac23EeBe98488ED28A52af69Bf46F1C18cb
CLABS_SAFE_ADDRESS=0x769b480A8036873a2a5EB01FE39278e5Ab78Bb27
COUNCIL_SAFE_ADDRESS=0x3b00043E8C82006fbE5f56b47F9889a04c20c5d6
REFUND_RECEIVER=0x5e60d897Cd62588291656b54655e98ee73f0aabF

# per-version: signatures, nonces, target, calldata
# @dev v4/v5: OPCM upgrade — selector 0xa4589780
# @dev succ-v2: Multicall3 aggregate3 — selector 0x82ad56cb
case $VERSION in
  v4)
    CLABS_SIG=0x2bbadce4c0cf2b419f837775faf30d652b82ee412e2216b2be4dbb7020533c902186a2f47a4f06d9454c2fdf06bb6f168b086299015908412da1a484793220011b
    COUNCIL_SIG=0xf1952a51f845e35e2916c947efb77e680d2e8fa75248db610ea5f930956e46044c6cb98ba55cf147ce40565b2317ab30bde2fa8c0eb5ad0201652fb0ad02f3121c
    PARENT_SAFE_NONCE=0
    CLABS_SAFE_NONCE=0
    COUNCIL_SAFE_NONCE=0
    TARGET_ADDRESS=0xdd1937e6c12c78b4330e341930f555ad706eddae
    CALLDATA=0xa4589780000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001000000000000000000000000760a5f022c9940f4a074e0030be682f560d29818000000000000000000000000f7d7a3d3bb8abb6829249b3d3ad3d525d052027e03eb07101fbdeaf3f04d9fb76526362c1eea2824e4c6e970bdb19675b72e4fc8
    ;;
  v5)
    CLABS_SIG=0x433278a2081ba1bb6f2a65cd879b7a12247b2564c1d043c05e6fbfd11bc3d8d003c06714377e9ace23e02f039b1dbca1671013548ae8821f92f12221f00233e81b
    COUNCIL_SIG=0x67dd24cf60558ee88ce4bd34225b94a45c132eb32270c0694fec30d832f95af1454b55d2bb92d331b0e5e4205da538b2cb5fc22a321e19dbcef94dd4826026d91c
    PARENT_SAFE_NONCE=1
    CLABS_SAFE_NONCE=1
    COUNCIL_SAFE_NONCE=1
    TARGET_ADDRESS=0x4da4f6bb1ce1d840c5bc2a0fb5e6998efb97b876
    CALLDATA=0xa4589780000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001000000000000000000000000760a5f022c9940f4a074e0030be682f560d29818000000000000000000000000f7d7a3d3bb8abb6829249b3d3ad3d525d052027e03caa1871bb9fe7f9b11217c245c16e4ded33367df5b3ccb2c6d0a847a217d1b
    ;;
  succ-v2)
    CLABS_SIG=0x3291a01906a4abfd2358ca9fcab7f010d48e0babd8728729837b482fb844c50603a739a21d5a07e014009e3f3b2b4ee14b278bbeebaf2ace23c0494408039ac71c
    COUNCIL_SIG=0x73a04bab1dd2a4cfdffb47f2d47b80af0c62d578a2c21852e8ec4eb5963f0b9268780a211b76fe112ca68299b2b988d0a7b554755304fd922a43749a27aeaad11b
    PARENT_SAFE_NONCE=2
    CLABS_SAFE_NONCE=2
    COUNCIL_SAFE_NONCE=2
    TARGET_ADDRESS=$MULTICALL3
    CALLDATA=0x82ad56cb000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000012000000000000000000000000057c45d82d1a995f1e135b8d7edc0a6bb5211cfaa00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000004414f6b1a3000000000000000000000000000000000000000000000000000000000000002a00000000000000000000000067cd626e1c2534cd5a129ba9208de69b305ffbd300000000000000000000000000000000000000000000000000000000000000000000000000000000760a5f022c9940f4a074e0030be682f560d29818000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000024f2fde38b000000000000000000000000769b480a8036873a2a5eb01fe39278e5ab78bb2700000000000000000000000000000000000000000000000000000000
    ;;
esac

# ─── Sepolia execution: Council → cLabs → Parent ─────────────

echo "--- Parent prep ---"
PARENT_TX_HASH=$(safe_tx_hash $PARENT_SAFE_ADDRESS $TARGET_ADDRESS "$CALLDATA" $OP_DELEGATECALL $PARENT_SAFE_NONCE)
echo "Parent hash: $PARENT_TX_HASH"

APPROVE_PARENT=$(cast calldata 'approveHash(bytes32)' $PARENT_TX_HASH)

# Council: approve parent hash
echo "--- Council ---"
COUNCIL_TX_HASH=$(safe_tx_hash $COUNCIL_SAFE_ADDRESS $PARENT_SAFE_ADDRESS "$APPROVE_PARENT" $OP_CALL $COUNCIL_SAFE_NONCE)
echo "Council hash: $COUNCIL_TX_HASH"
echo "Council sig:  ${COUNCIL_SIG:0:20}..."
safe_exec $COUNCIL_SAFE_ADDRESS $PARENT_SAFE_ADDRESS "$APPROVE_PARENT" $OP_CALL "$COUNCIL_SIG"
echo "Council executed"

# cLabs: approve parent hash
echo "--- cLabs ---"
CLABS_TX_HASH=$(safe_tx_hash $CLABS_SAFE_ADDRESS $PARENT_SAFE_ADDRESS "$APPROVE_PARENT" $OP_CALL $CLABS_SAFE_NONCE)
echo "cLabs hash: $CLABS_TX_HASH"
echo "cLabs sig:  ${CLABS_SIG:0:20}..."
safe_exec $CLABS_SAFE_ADDRESS $PARENT_SAFE_ADDRESS "$APPROVE_PARENT" $OP_CALL "$CLABS_SIG"
echo "cLabs executed"

# Parent: execute upgrade via delegatecall
# Signature format: nested-safe approval markers, sorted by address
# Council (0x3b00...) < cLabs (0x769b...) — ascending
echo "--- Parent exec ---"
PARENT_SIG=0x000000000000000000000000${COUNCIL_SAFE_ADDRESS:2}000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000${CLABS_SAFE_ADDRESS:2}000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000
echo "Parent sig: ${PARENT_SIG:0:40}..."
safe_exec $PARENT_SAFE_ADDRESS $TARGET_ADDRESS "$CALLDATA" $OP_DELEGATECALL "$PARENT_SIG" --gas-limit 16000000
echo "Upgrade executed"

echo "--------- EOF ---------"
