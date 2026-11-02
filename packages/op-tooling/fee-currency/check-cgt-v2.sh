#!/bin/bash
set -euo pipefail

# Read-only. Prints the SequencerFeeVault balance for every fee currency, which is what
# the CGT migration preflight cares about: withdrawToken() reverts on a zero balance,
# so each currency has to be non-zero before the vault can be drained.

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

L2_RPC_URL=${L2_RPC_URL:-}; [ -z "${L2_RPC_URL:-}" ] && echo "Need to set the L2_RPC_URL via env" && exit 1;

. "$SCRIPT_DIR/common.sh"

echo "Fee vault : $FEE_VAULT"
echo "Directory : $DIRECTORY"
echo "Chain     : $(cast chain-id --rpc-url "$L2_RPC_URL")"
echo

printf "%-8s %-44s %-26s %s\n" "SYMBOL" "ADDRESS" "RAW" "FORMATTED"
printf "%-8s %-44s %-26s %s\n" "------" "-------" "---" "---------"

ZEROES=0
TOTAL=0
for currency in $(resolve_fee_currencies); do
  TOTAL=$((TOTAL + 1))
  symbol=$(token_symbol "$currency")
  raw=$(token_balance "$currency" "$FEE_VAULT")
  raw=${raw:-0}
  printf "%-8s %-44s %-26s %s\n" "$symbol" "$currency" "$raw" "$(format_units "$raw" "$currency")"
  [ "$raw" = "0" ] && ZEROES=$((ZEROES + 1))
done

echo
if [ "$ZEROES" -eq 0 ]; then
  echo "  >>> OK: all $TOTAL fee currencies have a non-zero vault balance"
  exit 0
fi
echo "  >>> $ZEROES of $TOTAL fee currencies still have a zero vault balance"
echo "      Run ./seed-cgt-v2.sh to accrue fees in them."
exit 1
