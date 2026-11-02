#!/bin/bash
# Shared helpers for the fee-currency scripts. Source this, do not execute it.

# SequencerFeeVault is an OP predeploy, so the address is the same on every chain.
# On Celo this is CeloSequencerFeeVault, which adds withdrawToken() for ERC20 fee currencies.
FEE_VAULT=${FEE_VAULT:-0x4200000000000000000000000000000000000011}

# FeeCurrencyDirectory holds the set of tokens accepted as gas. Verified at this address on
# Havoc; override for chains that deploy it elsewhere.
DIRECTORY=${DIRECTORY:-0x15F344b9E6c3Cb6F0376A36A64928b13F62C6276}

# Resolves the fee currencies to operate on, one address per line.
# Uses FEE_CURRENCIES (comma-separated) when set, otherwise asks the directory.
resolve_fee_currencies() {
  if [ -n "${FEE_CURRENCIES:-}" ]; then
    echo "$FEE_CURRENCIES" | tr ',' '\n' | tr -d ' ' | grep -v '^$'
    return
  fi
  cast call "$DIRECTORY" "getCurrencies()(address[])" --rpc-url "$L2_RPC_URL" \
    | tr -d '[]' | tr ',' '\n' | tr -d ' ' | grep -v '^$'
}

# Best-effort ERC20 symbol, falling back to a truncated address for tokens without one.
token_symbol() {
  cast call "$1" "symbol()(string)" --rpc-url "$L2_RPC_URL" 2>/dev/null | tr -d '"' \
    || echo "${1:0:10}"
}

token_balance() {
  cast call "$1" "balanceOf(address)(uint256)" --rpc-url "$L2_RPC_URL" "$2" 2>/dev/null \
    | sed 's/ .*//'
}

# Decimal, not float: floats lose precision on 256-bit balances and round fee dust to zero.
format_units() {
  local decimals
  decimals=$(cast call "$2" "decimals()(uint8)" --rpc-url "$L2_RPC_URL" 2>/dev/null | sed 's/ .*//')
  python3 -c '
import sys
from decimal import Decimal, getcontext
getcontext().prec = 80
raw, dec = int(sys.argv[1]), int(sys.argv[2])
value = Decimal(raw).scaleb(-dec)
text = format(value, "f")
if "." in text:
    text = text.rstrip("0").rstrip(".")
print(text or "0")
' "$1" "${decimals:-18}"
}
