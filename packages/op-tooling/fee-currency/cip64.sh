#!/bin/bash
set -euo pipefail

# Sends a single CIP-64 transaction (EIP-2718 type 0x7b), paying gas in an ERC20 fee currency.
#
# cast has no CIP-64 support, so the transaction is assembled, signed and published by hand:
#
#   payload = 0x7b || rlp([chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit,
#                          to, value, data, accessList, feeCurrency, yParity, r, s])
#
# where the signature is over:
#
#   keccak256(0x7b || rlp([chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit,
#                          to, value, data, accessList, feeCurrency]))
#
# See CIP-64: https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0064.md

# RLP encodes integers as minimal big-endian byte strings: 0 -> "0x", 1 -> "0x01", 256 -> "0x0100".
# Leading zero bytes are not allowed, so r/s/nonce/etc. all have to go through this.
minhex() {
  python3 -c '
import sys
v = int(sys.argv[1], 0)
h = format(v, "x")
if len(h) % 2:
    h = "0" + h
print("0x" + (h if v else ""))
' "$1"
}

# Scales a hex quantity by a percentage and returns minimal hex.
scale_hex() {
  python3 -c '
import sys
v = int(sys.argv[1], 0) * int(sys.argv[2]) // 100
h = format(v, "x")
if len(h) % 2:
    h = "0" + h
print("0x" + (h if v else ""))
' "$1" "$2"
}

lower() { echo "$1" | tr 'A-Z' 'a-z'; }

# Required environment variables
PK=${PK:-}; [ -z "${PK:-}" ] && echo "Need to set the PK via env" && exit 1;
L2_RPC_URL=${L2_RPC_URL:-}; [ -z "${L2_RPC_URL:-}" ] && echo "Need to set the L2_RPC_URL via env" && exit 1;
FEE_CURRENCY=${FEE_CURRENCY:-}; [ -z "${FEE_CURRENCY:-}" ] && echo "Need to set the FEE_CURRENCY via env" && exit 1;

# A CIP-64 transaction whose feeCurrency is the zero address is invalid, and so is any block
# containing one. Paying in native CELO means omitting feeCurrency, i.e. a plain type-2 tx.
if [ "$(lower "$FEE_CURRENCY")" = "0x0000000000000000000000000000000000000000" ]; then
  echo "FEE_CURRENCY must not be the zero address (invalid per CIP-64)."
  echo "To pay gas in native CELO, use a normal type-2 transaction via 'cast send'."
  exit 1
fi

# Optional environment variables
VALUE=${VALUE:-0}
DATA=${DATA:-0x}
GAS_MULTIPLIER=${GAS_MULTIPLIER:-120}    # % applied to the eth_estimateGas result
FEE_MULTIPLIER=${FEE_MULTIPLIER:-200}    # % applied to (gasPrice + tip) for maxFeePerGas
QUIET=${QUIET:-false}

log() { [ "$QUIET" = "true" ] || echo "$@"; }

FROM=$(cast wallet address --private-key "$PK")
TO=${TO:-$FROM}

log "Sending CIP-64 transaction"
log "  from         : $FROM"
log "  to           : $TO"
log "  value        : $VALUE"
log "  feeCurrency  : $FEE_CURRENCY"

# 1. Chain id and nonce. Pending, not latest: async sends collide otherwise. Batches should
#    pass NONCE explicitly rather than trust pool visibility.
CHAIN_ID=${CHAIN_ID:-$(cast chain-id --rpc-url "$L2_RPC_URL")}
NONCE=${NONCE:-$(cast nonce "$FROM" --block pending --rpc-url "$L2_RPC_URL")}

# 2. Gas estimate. eth_estimateGas accepts feeCurrency so the estimate covers the extra
#    overhead of debiting/crediting the ERC20, which a native estimate would miss.
VALUE_HEX=$(minhex "$VALUE")
EST=$(cast rpc eth_estimateGas \
  "{\"from\":\"$FROM\",\"to\":\"$TO\",\"value\":\"$VALUE_HEX\",\"data\":\"$DATA\",\"feeCurrency\":\"$FEE_CURRENCY\"}" \
  --rpc-url "$L2_RPC_URL" | tr -d '"')
GAS_LIMIT=${GAS_LIMIT:-$(scale_hex "$EST" "$GAS_MULTIPLIER")}

# 3. Fee currency denominated gas prices. These are NOT comparable to native CELO prices -
#    they are quoted in the fee currency, so they must be fetched per currency.
GAS_PRICE=$(cast rpc eth_gasPrice "$FEE_CURRENCY" --rpc-url "$L2_RPC_URL" | tr -d '"')
TIP=$(cast rpc eth_maxPriorityFeePerGas "$FEE_CURRENCY" --rpc-url "$L2_RPC_URL" | tr -d '"')
MAX_PRIORITY_FEE_PER_GAS=${MAX_PRIORITY_FEE_PER_GAS:-$TIP}
MAX_FEE_PER_GAS=${MAX_FEE_PER_GAS:-$(python3 -c '
import sys
total = (int(sys.argv[1], 0) + int(sys.argv[2], 0)) * int(sys.argv[3]) // 100
h = format(total, "x")
if len(h) % 2:
    h = "0" + h
print("0x" + h)
' "$GAS_PRICE" "$TIP" "$FEE_MULTIPLIER")}

log "  chainId      : $CHAIN_ID"
log "  nonce        : $NONCE"
log "  gasLimit     : $GAS_LIMIT (estimate $EST x ${GAS_MULTIPLIER}%)"
log "  maxFeePerGas : $MAX_FEE_PER_GAS"
log "  priorityFee  : $MAX_PRIORITY_FEE_PER_GAS"

CHAIN_ID_H=$(minhex "$CHAIN_ID")
NONCE_H=$(minhex "$NONCE")
GAS_LIMIT_H=$(minhex "$GAS_LIMIT")
MAX_FEE_H=$(minhex "$MAX_FEE_PER_GAS")
TIP_H=$(minhex "$MAX_PRIORITY_FEE_PER_GAS")

# 4. Unsigned payload and signing hash
UNSIGNED_FIELDS="[\"$CHAIN_ID_H\",\"$NONCE_H\",\"$TIP_H\",\"$MAX_FEE_H\",\"$GAS_LIMIT_H\",\"$TO\",\"$VALUE_HEX\",\"$DATA\",[],\"$FEE_CURRENCY\"]"
UNSIGNED_RLP=$(cast to-rlp "$UNSIGNED_FIELDS")
SIGNING_HASH=$(cast keccak "0x7b${UNSIGNED_RLP#0x}")

# 5. Sign the digest directly - no EIP-191 prefix, hence --no-hash
SIG=$(cast wallet sign --no-hash "$SIGNING_HASH" --private-key "$PK")
R=$(minhex "0x${SIG:2:64}")
S=$(minhex "0x${SIG:66:64}")
V=$((16#${SIG:130:2}))
Y_PARITY=$(minhex "$((V - 27))")

# 6. Signed payload
SIGNED_FIELDS="[\"$CHAIN_ID_H\",\"$NONCE_H\",\"$TIP_H\",\"$MAX_FEE_H\",\"$GAS_LIMIT_H\",\"$TO\",\"$VALUE_HEX\",\"$DATA\",[],\"$FEE_CURRENCY\",\"$Y_PARITY\",\"$R\",\"$S\"]"
SIGNED_RLP=$(cast to-rlp "$SIGNED_FIELDS")
RAW_TX="0x7b${SIGNED_RLP#0x}"

# 7. Publish. The tx hash is the only thing written to stdout when QUIET=true, so callers
#    can capture it directly.
TX_HASH=$(cast publish "$RAW_TX" --rpc-url "$L2_RPC_URL" --async)
log "  >>> sent: $TX_HASH"
[ "$QUIET" = "true" ] && echo "$TX_HASH"
exit 0
