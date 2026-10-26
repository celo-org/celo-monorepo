#!/bin/bash
set -euo pipefail

# Accrues fee-currency balances in the SequencerFeeVault by sending CIP-64 transactions
# that pay gas in each currency. The vault receives the priority fee portion, so every
# transaction credits it directly.
#
# This is Phase A of the CGT v1 -> v2 migration rehearsal: the vault must hold a non-zero
# balance in each fee currency before the migration can exercise withdrawToken().

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

# Required environment variables
PK=${PK:-}; [ -z "${PK:-}" ] && echo "Need to set the PK via env" && exit 1;
L2_RPC_URL=${L2_RPC_URL:-}; [ -z "${L2_RPC_URL:-}" ] && echo "Need to set the L2_RPC_URL via env" && exit 1;

# Optional environment variables
TX_COUNT=${TX_COUNT:-10}
VALUE=${VALUE:-1000000000000000000}
CONFIRM_EVERY=${CONFIRM_EVERY:-0}   # wait for a receipt every N txs; 0 disables

. "$SCRIPT_DIR/common.sh"

FROM=$(cast wallet address --private-key "$PK")
CURRENCIES=$(resolve_fee_currencies)
[ -z "$CURRENCIES" ] && echo "No fee currencies found. Set FEE_CURRENCIES or check DIRECTORY." && exit 1;
COUNT=$(echo "$CURRENCIES" | wc -l | tr -d ' ')
hash=""

echo "Seeding fee vault $FEE_VAULT"
echo "  sender     : $FROM"
echo "  chain      : $(cast chain-id --rpc-url "$L2_RPC_URL")"
echo "  currencies : $COUNT"
echo "  txs each   : $TX_COUNT"
echo "  value each : $VALUE"
echo

# 1. Precheck. Paying gas in a currency requires holding that currency, and an
#    unregistered currency is rejected from the txpool outright, so fail early
#    rather than halfway through a batch.
echo "1. Checking sender balances..."
for currency in $CURRENCIES; do
  symbol=$(token_symbol "$currency")
  balance=$(token_balance "$currency" "$FROM")
  balance=${balance:-0}
  if [ "$balance" = "0" ]; then
    echo "  >>> $symbol ($currency): sender holds 0 - cannot pay gas in this currency"
    exit 1
  fi
  echo "  >>> $symbol: $(format_units "$balance" "$currency")"
done
echo

# 2. Record the starting point so the delta is attributable to this run.
echo "2. Vault balances before:"
for currency in $CURRENCIES; do
  echo "  >>> $(token_symbol "$currency"): $(token_balance "$currency" "$FEE_VAULT")"
done
echo

# 3. Send. Transactions are published async and nonces are assigned by the node in
#    order, so the batch pipelines instead of waiting a block per transaction.
echo "3. Sending $((TX_COUNT * COUNT)) CIP-64 transactions..."
SENT=0
CHAIN_ID=$(cast chain-id --rpc-url "$L2_RPC_URL")
NONCE=$(cast nonce "$FROM" --block pending --rpc-url "$L2_RPC_URL")
for currency in $CURRENCIES; do
  symbol=$(token_symbol "$currency")
  i=1
  while [ "$i" -le "$TX_COUNT" ]; do
    hash=$(QUIET=true PK="$PK" L2_RPC_URL="$L2_RPC_URL" FEE_CURRENCY="$currency" \
      VALUE="$VALUE" CHAIN_ID="$CHAIN_ID" NONCE="$NONCE" "$SCRIPT_DIR/cip64.sh")
    NONCE=$((NONCE + 1))
    SENT=$((SENT + 1))
    echo "  >>> $symbol $i/$TX_COUNT: $hash"
    if [ "$CONFIRM_EVERY" -gt 0 ] && [ $((SENT % CONFIRM_EVERY)) -eq 0 ]; then
      cast receipt "$hash" --rpc-url "$L2_RPC_URL" >/dev/null
    fi
    i=$((i + 1))
  done
done
echo

# 4. The last transaction has to land before the vault reflects the full batch.
echo "4. Waiting for the final transaction to confirm..."
[ -n "$hash" ] && cast receipt "$hash" --rpc-url "$L2_RPC_URL" >/dev/null
echo "  >>> confirmed"
echo

# 5. Assert the Phase A exit condition.
echo "5. Vault balances after:"
FAILED=0
for currency in $CURRENCIES; do
  symbol=$(token_symbol "$currency")
  raw=$(token_balance "$currency" "$FEE_VAULT")
  raw=${raw:-0}
  echo "  >>> $symbol: $raw ($(format_units "$raw" "$currency"))"
  [ "$raw" = "0" ] && FAILED=$((FAILED + 1))
done
echo

if [ "$FAILED" -ne 0 ]; then
  echo "FAILED: $FAILED fee currencies still have a zero vault balance"
  exit 1
fi
echo "Phase A complete: all $COUNT fee currencies have a non-zero vault balance."
