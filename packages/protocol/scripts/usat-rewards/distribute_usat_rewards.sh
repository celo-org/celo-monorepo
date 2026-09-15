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

# Celo mainnet is the only chain these rewards are paid on, and its endpoint is
# the only one whose payments belong in the production ledger.
MAINNET_RPC_URL="https://forno.celo.org"
DEFAULT_PAID_LEDGER_FILE="scripts/usat-rewards/paid-ledger.json"

RPC_URL="${RPC_URL:-$MAINNET_RPC_URL}"
EXPECTED_CHAIN_ID="${EXPECTED_CHAIN_ID:-42220}"
PAID_LEDGER_FILE="${PAID_LEDGER_FILE:-$DEFAULT_PAID_LEDGER_FILE}"
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

# Chain id and token address cannot tell a fork from mainnet — `anvil --celo`
# serves chain 42220 and the real USA₮ contract — so the chain guard alone can
# never keep a rehearsal out of the production payment record. Any endpoint but
# the known mainnet one therefore has to use its own ledger file.
if [ "$RPC_URL" != "$MAINNET_RPC_URL" ] && [ "$PAID_LEDGER_FILE" = "$DEFAULT_PAID_LEDGER_FILE" ] \
    && [ "${ALLOW_PRODUCTION_LEDGER:-0}" != "1" ]; then
    echo "RPC_URL is $RPC_URL, not the mainnet endpoint $MAINNET_RPC_URL, yet the run would" >&2
    echo "write the production ledger $PAID_LEDGER_FILE — a rehearsal recorded there marks" >&2
    echo "real rewards as paid and they are never sent. Point PAID_LEDGER_FILE at a separate" >&2
    echo "file, or set ALLOW_PRODUCTION_LEDGER=1 if this really is mainnet through another" >&2
    echo "endpoint." >&2
    exit 1
fi

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

# A round marked "completed" is a record of what was already paid, not work to
# do. Its paid ledger nets it out, but this refuses outright rather than trust
# that the ledger is still there — and it refuses before the Dune refresh, which
# would otherwise overwrite the archived recipients with a fresh snapshot.
if [ "$BROADCAST" = "1" ] && [ -f "$RECIPIENTS_FILE" ] && [ "$(python3 -c \
    "import json,sys;print(int(bool(json.load(open(sys.argv[1])).get('completed'))))" \
    "$RECIPIENTS_FILE")" = "1" ]; then
    echo "$RECIPIENTS_FILE is marked completed: that round has already been paid in full and is" >&2
    echo "kept only as a record. Remove the marker only to deliberately re-open the round." >&2
    exit 1
fi

# One run at a time: two overlapping runs would both fetch the same pre-payment
# snapshot and could pay the same wallets twice at different nonces.
LOCK_DIR="scripts/usat-rewards/.run-lock"
# A run killed at the wrong moment used to leave this directory behind forever,
# and every later run then refused to start. The lock carries its own start time
# so it can be taken over once it is older than any plausible run.
LOCK_STALE_SECONDS="${LOCK_STALE_SECONDS:-7200}"
if ! mkdir "$LOCK_DIR" 2> /dev/null; then
    lock_started_at=$(cat "$LOCK_DIR/started-at" 2> /dev/null || echo 0)
    case "$lock_started_at" in
        '' | *[!0-9]*) lock_started_at=0 ;;
    esac
    if [ "$(($(date +%s) - lock_started_at))" -le "$LOCK_STALE_SECONDS" ]; then
        echo "another payout run holds $LOCK_DIR — wait for it to finish, or remove that" >&2
        echo "directory if you are certain no run is in progress." >&2
        exit 1
    fi
    echo "warning: $LOCK_DIR has been held for over ${LOCK_STALE_SECONDS}s — assuming the run" >&2
    echo "that created it died, and taking it over." >&2
    rm -f "$LOCK_DIR/started-at"
    rmdir "$LOCK_DIR" 2> /dev/null || true
    if ! mkdir "$LOCK_DIR" 2> /dev/null; then
        echo "another run claimed $LOCK_DIR first — aborting." >&2
        exit 1
    fi
fi
date +%s > "$LOCK_DIR/started-at"

# Pinned, never read back from the endpoint under test: deriving the expected
# chain from the RPC being validated makes the guard unfalsifiable.
CHAIN_ID="$EXPECTED_CHAIN_ID"

broadcast_file() {
    echo "broadcast/DistributeUsatRewards.s.sol/${CHAIN_ID}/run-latest.json"
}

record_payments() {
    local file
    file=$(broadcast_file)
    if [ -f "$file" ]; then
        ./scripts/usat-rewards/record-payments.py --broadcast "$file" \
            --ledger "$PAID_LEDGER_FILE" --chain-id "$CHAIN_ID" --rpc-url "$RPC_URL"
    else
        echo "warning: no broadcast file at $file — paid ledger NOT updated." >&2
    fi
}

# Record on every exit path, signals included: a confirmed transfer that never
# reaches the ledger is exactly what makes the next run pay it again. A failure
# to record is therefore fatal rather than a warning — the transfers are on
# chain but invisible to the ledger, so finishing with status 0 would let the
# next run send them all over again.
cleanup() {
    local status=$?
    if [ "$BROADCAST" = "1" ]; then
        if ! record_payments; then
            echo >&2
            echo "FATAL: the paid ledger could NOT be fully recorded after broadcasting." >&2
            echo "transfers are missing from $PAID_LEDGER_FILE, so the next run would pay them a" >&2
            echo "second time. Fix the cause (a transfer that is neither mined nor dropped yet, a" >&2
            echo "token/chain/distributor stamp mismatch, a corrupt ledger) and record them" >&2
            echo "before re-running:" >&2
            echo "  ./scripts/usat-rewards/record-payments.py --broadcast $(broadcast_file) \\" >&2
            echo "      --ledger $PAID_LEDGER_FILE --chain-id $CHAIN_ID --rpc-url $RPC_URL" >&2
            if [ "$status" -eq 0 ]; then
                status=1
            fi
        fi
    fi
    rm -f "$LOCK_DIR/started-at"
    rmdir "$LOCK_DIR" 2> /dev/null || true
    exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# Replay whatever the previous run left behind BEFORE the Dune fetch reads the
# ledger: if recording failed last time, those payments are missing from the
# payment memory and this run would send them again. record-payments.py is
# deduped by transaction hash, so replaying an already-recorded file is a no-op.
if [ "$BROADCAST" = "1" ] && [ -f "$(broadcast_file)" ]; then
    echo "=== Replaying the previous broadcast file into the paid ledger ==="
    if ! record_payments; then
        echo "refusing to run: $(broadcast_file) could not be recorded into" >&2
        echo "$PAID_LEDGER_FILE, and its payments would be sent a second time." >&2
        exit 1
    fi
fi

# The Dune snapshot nets out payments made by DISTRIBUTOR_ADDRESS while forge
# signs with PRIVATE_KEY; if they differ the snapshot describes another wallet's
# history and rewards this wallet already paid look unpaid again.
#
# The key reaches `cast` as an argument because it is the only form it accepts:
# there is no env var for --private-key and --interactive needs a terminal. On a
# host where other users can read process arguments, sign through a keystore
# (--account) or a hardware wallet instead and set DISTRIBUTOR_ADDRESS by hand.
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
        --out "$RECIPIENTS_FILE" --ledger "$PAID_LEDGER_FILE" --chain-id "$CHAIN_ID"
elif [ "$BROADCAST" = "1" ] && [ "${ALLOW_STALE:-0}" != "1" ]; then
    echo "refusing to broadcast without a fresh Dune fetch." >&2
    echo "set DUNE_API_KEY and DISTRIBUTOR_ADDRESS to auto-refresh, or ALLOW_STALE=1 to override." >&2
    exit 1
fi

if [ ! -f "$RECIPIENTS_FILE" ]; then
    echo "recipients file missing — run fetch-recipients.py first." >&2
    exit 1
fi

# The path goes in as an argument, never interpolated into the program text: a
# file name is data, and inside the source it would be executable code.
RECIPIENT_COUNT=$(python3 -c \
    "import json,sys;print(len(json.load(open(sys.argv[1]))['recipients']))" "$RECIPIENTS_FILE")
if [ "$RECIPIENT_COUNT" = "0" ]; then
    echo "Nothing owed — recipients list is empty after reconciliation. Skipping."
    exit 0
fi

if [ "$BROADCAST" != "1" ]; then
    echo "=== SIMULATION ONLY (pass --broadcast to send) ==="
fi

# Confirm the endpoint really serves the pinned chain before anything is signed.
# The expectation must not come from the endpoint itself — that is what let a
# mainnet fork write the production ledger.
RPC_CHAIN_ID=$(cast chain-id --rpc-url "$RPC_URL")
if [ "$RPC_CHAIN_ID" != "$EXPECTED_CHAIN_ID" ]; then
    echo "the RPC at $RPC_URL serves chain $RPC_CHAIN_ID, expected $EXPECTED_CHAIN_ID." >&2
    echo "set EXPECTED_CHAIN_ID, with a PAID_LEDGER_FILE of its own, to run on another chain." >&2
    exit 1
fi

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
