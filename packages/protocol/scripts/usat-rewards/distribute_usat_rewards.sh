#!/bin/bash
# Simulate or broadcast the USA₮ rewards distribution.
#
#   ./distribute_usat_rewards.sh              # simulation only (default)
#   ./distribute_usat_rewards.sh --broadcast  # sign and send for real
#
# The hot wallet key comes from $PRIVATE_KEY (or a .env file next to this
# script). Alternatively omit PRIVATE_KEY and append forge signer flags
# (--account <name> / --ledger) after --broadcast.
#
# Idempotency: after a successful broadcast this wrapper records every confirmed
# transfer into the paid ledger (record-payments.py). The forge script subtracts
# the ledger from the owed amounts, so re-running never double-pays — a repeat
# run sends only what is still outstanding (or nothing).
set -euo pipefail

cd "$(dirname "$0")/../.."

RPC_URL="${RPC_URL:-https://forno.celo.org}"
PAID_LEDGER_FILE="${PAID_LEDGER_FILE:-scripts/usat-rewards/paid-ledger.json}"
export PAID_LEDGER_FILE

if [ -f "scripts/usat-rewards/.env" ]; then
    export $(grep -v '^#' scripts/usat-rewards/.env | xargs)
fi

if ! command -v forge &> /dev/null; then
    echo "forge could not be found, please install foundry." >&2
    exit 1
fi

RECIPIENTS_FILE="${RECIPIENTS_FILE:-scripts/usat-rewards/recipients.json}"
export RECIPIENTS_FILE

# Always distribute from a FRESH Dune snapshot: re-run the ledger query before
# every run when credentials are available, otherwise refuse stale data.
if [ "${SKIP_FETCH:-0}" != "1" ] && [ -n "${DUNE_API_KEY:-}" ] && [ -n "${DISTRIBUTOR_ADDRESS:-}" ]; then
    echo "=== Refreshing recipients from Dune (query 7506058) ==="
    ./scripts/usat-rewards/fetch-recipients.py --distributor "$DISTRIBUTOR_ADDRESS" \
        --out "$RECIPIENTS_FILE" --ledger "$PAID_LEDGER_FILE"
elif [ "${1:-}" = "--broadcast" ] && [ "${ALLOW_STALE:-0}" != "1" ]; then
    echo "refusing to broadcast without a fresh Dune fetch." >&2
    echo "set DUNE_API_KEY and DISTRIBUTOR_ADDRESS to auto-refresh, or ALLOW_STALE=1 to override." >&2
    exit 1
fi

if [ ! -f "$RECIPIENTS_FILE" ]; then
    echo "recipients file missing — run fetch-recipients.py first." >&2
    exit 1
fi

if [ "$(python3 -c "import json;print(len(json.load(open('$RECIPIENTS_FILE'))['recipients']))")" = "0" ]; then
    echo "Nothing owed — recipients list is empty after reconciliation. Skipping."
    exit 0
fi

if [ "${1:-}" != "--broadcast" ]; then
    echo "=== SIMULATION ONLY (pass --broadcast to send) ==="
fi

# Resolve the chain id before broadcasting: if the RPC dies mid-run we must
# still be able to locate the broadcast file and record what was sent.
CHAIN_ID=$(cast chain-id --rpc-url "$RPC_URL")

# Record confirmed transfers even if forge fails mid-broadcast — that partial
# run is exactly the case the paid ledger must capture to prevent double-pays.
FORGE_STATUS=0
forge script scripts/usat-rewards/DistributeUsatRewards.s.sol:DistributeUsatRewards \
    --rpc-url "$RPC_URL" \
    --legacy \
    "$@" || FORGE_STATUS=$?

if [ "${1:-}" = "--broadcast" ]; then
    BROADCAST_FILE="broadcast/DistributeUsatRewards.s.sol/${CHAIN_ID}/run-latest.json"
    if [ -f "$BROADCAST_FILE" ]; then
        ./scripts/usat-rewards/record-payments.py --broadcast "$BROADCAST_FILE" --ledger "$PAID_LEDGER_FILE"
    else
        echo "warning: no broadcast file at $BROADCAST_FILE — paid ledger NOT updated." >&2
    fi
fi

if [ "$FORGE_STATUS" -ne 0 ]; then
    echo "forge exited with status $FORGE_STATUS — after fixing the issue, simply re-run this" >&2
    echo "script: the paid ledger ensures only the outstanding remainder is sent." >&2
    exit "$FORGE_STATUS"
fi
