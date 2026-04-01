#!/usr/bin/env bash
set -euo pipefail

# get repo root
REPO_ROOT=$(git rev-parse --show-toplevel)

# required decoded signer file
[ ! -f "$REPO_ROOT/secrets/.env.signers.basefee" ] && echo "Need to decode .env.signers.basefee.enc first" && exit 1;

# load decoded signers
source "$REPO_ROOT/secrets/.env.signers.basefee"

# required envs
[ -z "${PK:-}" ] && echo "Need to set the PK via env" && exit 1;
echo "Logged in as wallet: $(cast wallet address --private-key $PK)"

# optional envs
RPC_URL=${RPC_URL:-"http://127.0.0.1:8545"}

# addresses
CLABS_SAFE=0x9Eb44Da23433b5cAA1c87e35594D15FcEb08D34d
MULTISEND=0x9641d764fc13c8B624c04430C7356C1C7C8102e2
SYSTEM_CONFIG=0x89E31965D844a309231B1f17759Ccaf1b7c09861

# cLabs signers (6-of-8, sorted ascending by address)

# 0Bd
CLABS_SIGNER_0Bd=${CLABS_SIGNER_0Bd__ADDRESS}
CLABS_SIGNER_0Bd_SIG=${CLABS_SIGNER_0Bd__SIG}

# 21e
CLABS_SIGNER_21e=${CLABS_SIGNER_21e__ADDRESS}
CLABS_SIGNER_21e_SIG=${CLABS_SIGNER_21e__SIG}

# 4D8
CLABS_SIGNER_4D8=${CLABS_SIGNER_4D8__ADDRESS}
CLABS_SIGNER_4D8_SIG=${CLABS_SIGNER_4D8__SIG}

# 74b
CLABS_SIGNER_74b=${CLABS_SIGNER_74b__ADDRESS}
CLABS_SIGNER_74b_SIG=${CLABS_SIGNER_74b__SIG}

# 8b4
CLABS_SIGNER_8b4=${CLABS_SIGNER_8b4__ADDRESS}
CLABS_SIGNER_8b4_SIG=${CLABS_SIGNER_8b4__SIG}

# E00
CLABS_SIGNER_E00=${CLABS_SIGNER_E00__ADDRESS}
CLABS_SIGNER_E00_SIG=${CLABS_SIGNER_E00__SIG}

# defaults
VALUE=0
TX_DELEGATECALL=1
SAFE_TX_GAS=0
BASE_GAS=0
GAS_PRICE=0
GAS_TOKEN=0x0000000000000000000000000000000000000000
REFUND_RECEIVER=0x95ffac468e37ddeef407ffef18f0cc9e86d8f13b

# base fee parameters
MIN_BASE_FEE_WEI=25000000000
DA_SCALAR=1

# nonce 27: after 05-v4 (nonce 24), 06-v5 (25), 07-succ-v2 (26) execute
NONCE=27

echo "========================================================================="
echo "  BASE FEE UPDATE - EXECUTION"
echo "========================================================================="
echo ""
echo "  Safe:          $CLABS_SAFE"
echo "  MultiSend:     $MULTISEND"
echo "  SystemConfig:  $SYSTEM_CONFIG"
echo "  Min base fee:  ${MIN_BASE_FEE_WEI} wei"
echo "  DA scalar:     $DA_SCALAR"
echo "  Nonce:         $NONCE"
echo ""

# --- Build MultiSend calldata (mirrors sign-basefee.sh) ---

CALL1=$(cast calldata "setMinBaseFee(uint64)" "$MIN_BASE_FEE_WEI")
CALL2=$(cast calldata "setDAFootprintGasScalar(uint16)" "$DA_SCALAR")

# MultiSend packed: uint8 operation | address to | uint256 value | uint256 dataLength | bytes data
SC_NOPFX="${SYSTEM_CONFIG#0x}"

CALL1_NOPFX="${CALL1#0x}"
CALL1_LEN=$(printf '%064x' $((${#CALL1_NOPFX} / 2)))
ENTRY1="00${SC_NOPFX}0000000000000000000000000000000000000000000000000000000000000000${CALL1_LEN}${CALL1_NOPFX}"

CALL2_NOPFX="${CALL2#0x}"
CALL2_LEN=$(printf '%064x' $((${#CALL2_NOPFX} / 2)))
ENTRY2="00${SC_NOPFX}0000000000000000000000000000000000000000000000000000000000000000${CALL2_LEN}${CALL2_NOPFX}"

PACKED="${ENTRY1}${ENTRY2}"
CALLDATA=$(cast calldata "multiSend(bytes)" "0x${PACKED}")

echo "--- Compute Safe tx hash ---"

TX_HASH=$(cast call "$CLABS_SAFE" \
  "getTransactionHash(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,uint256)(bytes32)" \
  "$MULTISEND" "$VALUE" "$CALLDATA" "$TX_DELEGATECALL" "$SAFE_TX_GAS" "$BASE_GAS" "$GAS_PRICE" "$GAS_TOKEN" "$REFUND_RECEIVER" "$NONCE" \
  -r "$RPC_URL"
)
echo "Safe tx hash: $TX_HASH"

echo "--- Assemble signatures ---"

# cLabs sig (6-of-8 ECDSA, sorted ascending by address)
CLABS_SIG=0x${CLABS_SIGNER_0Bd__SIG:2}${CLABS_SIGNER_21e__SIG:2}${CLABS_SIGNER_4D8__SIG:2}${CLABS_SIGNER_74b__SIG:2}${CLABS_SIGNER_8b4__SIG:2}${CLABS_SIGNER_E00__SIG:2}
echo "cLabs sig: $CLABS_SIG"

echo "--- Execute ---"

cast send "$CLABS_SAFE" \
  "execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)" \
  "$MULTISEND" "$VALUE" "$CALLDATA" "$TX_DELEGATECALL" "$SAFE_TX_GAS" "$BASE_GAS" "$GAS_PRICE" "$GAS_TOKEN" "$REFUND_RECEIVER" "$CLABS_SIG" \
  --private-key $PK \
  -r $RPC_URL
echo "Base fee update executed"
