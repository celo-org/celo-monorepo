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
# Idempotency: after a broadcast this wrapper records every confirmed transfer
# into the paid ledger (record-payments.py) — also when forge fails midway or
# the run is interrupted. The forge script subtracts the ledger from the owed
# amounts, so re-running never double-pays: a repeat run sends only what is
# still outstanding (or nothing).
set -euo pipefail

cd "$(dirname "$0")/../.."

RPC_URL="${RPC_URL:-https://forno.celo.org}"
PAID_LEDGER_FILE="${PAID_LEDGER_FILE:-scripts/usat-rewards/paid-ledger.json}"
export PAID_LEDGER_FILE

# Source the env file instead of `export $(...)`: a comment-only or empty .env
# makes that construct run a bare `export`, which prints every exported variable
# — PRIVATE_KEY included — to stdout and into any automation log.
ENV_FILE="scripts/usat-rewards/.env"
if [ -f "$ENV_FILE" ]; then
    set -a
    # shellcheck disable=SC1090
    . "./$ENV_FILE"
    set +a
fi

for tool in forge cast; do
    if ! command -v "$tool" &> /dev/null; then
        echo "$tool could not be found, please install foundry." >&2
        exit 1
    fi
done

# forge honours --broadcast wherever it appears, so the safety branches below
# must detect it the same way rather than only in the first position.
BROADCAST=0
for arg in "$@"; do
    if [ "$arg" = "--broadcast" ]; then
        BROADCAST=1
    fi
done

RECIPIENTS_FILE="${RECIPIENTS_FILE:-scripts/usat-rewards/recipients.json}"
export RECIPIENTS_FILE

# One run at a time: two overlapping runs would both fetch the same pre-payment
# snapshot and could pay the same wallets twice at different nonces.
LOCK_DIR="scripts/usat-rewards/.run-lock"
if ! mkdir "$LOCK_DIR" 2> /dev/null; then
    echo "another payout run holds $LOCK_DIR — wait for it to finish, or remove that" >&2
    echo "directory if you are certain no run is in progress." >&2
    exit 1
fi

CHAIN_ID=""

record_payments() {
    local broadcast_file="broadcast/DistributeUsatRewards.s.sol/${CHAIN_ID}/run-latest.json"
    if [ -f "$broadcast_file" ]; then
        ./scripts/usat-rewards/record-payments.py --broadcast "$broadcast_file" \
            --ledger "$PAID_LEDGER_FILE" --chain-id "$CHAIN_ID"
    else
        echo "warning: no broadcast file at $broadcast_file — paid ledger NOT updated." >&2
    fi
}

# Record on every exit path, signals included: a confirmed transfer that never
# reaches the ledger is exactly what makes the next run pay it again.
cleanup() {
    local status=$?
    if [ "$BROADCAST" = "1" ] && [ -n "$CHAIN_ID" ]; then
        record_payments || echo "warning: recording the paid ledger failed." >&2
    fi
    rmdir "$LOCK_DIR" 2> /dev/null || true
    exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# The Dune snapshot nets out payments made by DISTRIBUTOR_ADDRESS while forge
# signs with PRIVATE_KEY; if they differ the snapshot describes another wallet's
# history and rewards this wallet already paid look unpaid again.
if [ -n "${PRIVATE_KEY:-}" ]; then
    SIGNER=$(cast wallet address --private-key "$PRIVATE_KEY")
    if [ -z "${DISTRIBUTOR_ADDRESS:-}" ]; then
        DISTRIBUTOR_ADDRESS="$SIGNER"
        echo "DISTRIBUTOR_ADDRESS defaulted to the signing wallet $SIGNER"
    elif [ "$(echo "$DISTRIBUTOR_ADDRESS" | tr '[:upper:]' '[:lower:]')" != "$(echo "$SIGNER" | tr '[:upper:]' '[:lower:]')" ]; then
        echo "DISTRIBUTOR_ADDRESS ($DISTRIBUTOR_ADDRESS) is not the signing wallet ($SIGNER)." >&2
        echo "the Dune snapshot would net payments from a different wallet — aborting." >&2
        exit 1
    fi
elif [ "$BROADCAST" = "1" ]; then
    echo "note: signing through forge signer flags, so DISTRIBUTOR_ADDRESS" >&2
    echo "(${DISTRIBUTOR_ADDRESS:-unset}) cannot be verified against the signer — make sure" >&2
    echo "it is the address that will actually send the transfers." >&2
fi

# Always distribute from a FRESH Dune snapshot: re-run the ledger query before
# every run when credentials are available, otherwise refuse stale data.
if [ "${SKIP_FETCH:-0}" != "1" ] && [ -n "${DUNE_API_KEY:-}" ] && [ -n "${DISTRIBUTOR_ADDRESS:-}" ]; then
    echo "=== Refreshing recipients from Dune (query 7506058) ==="
    ./scripts/usat-rewards/fetch-recipients.py --distributor "$DISTRIBUTOR_ADDRESS" \
        --out "$RECIPIENTS_FILE" --ledger "$PAID_LEDGER_FILE"
elif [ "$BROADCAST" = "1" ] && [ "${ALLOW_STALE:-0}" != "1" ]; then
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

if [ "$BROADCAST" != "1" ]; then
    echo "=== SIMULATION ONLY (pass --broadcast to send) ==="
fi

# Resolve the chain id before broadcasting: if the RPC dies mid-run we must
# still be able to locate the broadcast file and record what was sent.
CHAIN_ID=$(cast chain-id --rpc-url "$RPC_URL")

FORGE_STATUS=0
forge script scripts/usat-rewards/DistributeUsatRewards.s.sol:DistributeUsatRewards \
    --rpc-url "$RPC_URL" \
    --legacy \
    "$@" || FORGE_STATUS=$?

if [ "$FORGE_STATUS" -ne 0 ]; then
    echo "forge exited with status $FORGE_STATUS — after fixing the issue, simply re-run this" >&2
    echo "script: the paid ledger ensures only the outstanding remainder is sent." >&2
    exit "$FORGE_STATUS"
fi
