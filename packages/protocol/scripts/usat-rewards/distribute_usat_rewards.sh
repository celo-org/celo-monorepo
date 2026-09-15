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
USAT_MAINNET="0xd2ab3c9a02dbbab236bfec45d1d755df4267f771"
TOKEN_ADDRESS="${USAT_ADDRESS:-$USAT_MAINNET}"
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
#
# The lock is a symlink at a fixed path pointing at a directory named after the
# run that owns it. That indirection is what makes a takeover safe: the thing
# renamed away is the specific stale directory that was inspected, a name no
# other run shares, so a contender that judged the same directory stale finds it
# gone and loses, and one that arrives later judges a different directory and
# cannot touch this claim. Renaming the shared path itself — as this did before
# — bound the rename to nothing: a delayed contender could move the live lock a
# new owner had just created and both would believe they held it.
LOCK_LINK="scripts/usat-rewards/.run-lock"
LOCK_STALE_SECONDS="${LOCK_STALE_SECONDS:-7200}"
LOCK_STALE_MINUTES=$((LOCK_STALE_SECONDS / 60))
if [ "$LOCK_STALE_MINUTES" -lt 1 ]; then
    LOCK_STALE_MINUTES=1
fi
LOCK_TOKEN="$$-$(date +%s)-${RANDOM}"
LOCK_TARGET_NAME="$(basename "$LOCK_LINK").$LOCK_TOKEN"
LOCK_TARGET="$(dirname "$LOCK_LINK")/$LOCK_TARGET_NAME"

# Age comes from the directory's own mtime, set atomically by mkdir, read with
# `find -mmin` (portable, and nothing written after the claim that a contender
# could read before it exists and mistake a new lock for an abandoned one).
lock_is_stale() {
    [ -n "$(find "$1" -maxdepth 0 -mmin "+$LOCK_STALE_MINUTES" 2> /dev/null)" ]
}

lock_owner_name() {
    readlink "$LOCK_LINK" 2> /dev/null || true
}

_claim_lock() {
    mkdir -p "$(dirname "$LOCK_LINK")"
    mkdir "$LOCK_TARGET" || return 1

    # A plain directory at the lock path is a lock from the older layout, and it
    # has to be ruled out before `ln` is asked anything: given a directory, ln
    # creates a file inside it and reports success instead of refusing. Taking
    # such a lock over could only work by renaming the shared path, which is the
    # one thing that cannot be done safely, so it is left for a human to clear.
    if [ -e "$LOCK_LINK" ] && [ ! -L "$LOCK_LINK" ]; then
        echo "$LOCK_LINK is a lock from the older directory layout, not the expected" >&2
        echo "symlink. If no payout run is in progress, remove it and re-run:" >&2
        echo "  rm -rf $LOCK_LINK" >&2
        return 1
    fi

    # `ln -sn` is the atomic exclusive claim: -n keeps it from following an
    # existing link, so it fails outright instead of quietly creating a file
    # inside whatever the lock points at.
    if ln -sn "$LOCK_TARGET_NAME" "$LOCK_LINK" 2> /dev/null; then
        return 0
    fi

    local held held_dir
    held=$(lock_owner_name)
    held_dir="$(dirname "$LOCK_LINK")/$held"
    if [ -z "$held" ] || [ ! -d "$held_dir" ]; then
        echo "$LOCK_LINK points at no lock directory — another run is claiming it right" >&2
        echo "now, or one died mid-takeover. Re-run; if it persists, remove $LOCK_LINK." >&2
        return 1
    fi
    if ! lock_is_stale "$held_dir"; then
        echo "another payout run holds $LOCK_LINK — wait for it to finish, or remove that" >&2
        echo "link if you are certain no run is in progress." >&2
        return 1
    fi
    echo "warning: $LOCK_LINK has been held for over ${LOCK_STALE_MINUTES}m — assuming the run" >&2
    echo "that created it died, and taking it over." >&2
    # Exactly one contender can rename this particular directory away.
    if ! mv "$held_dir" "$held_dir.stale.$LOCK_TOKEN" 2> /dev/null; then
        echo "another run took over $LOCK_LINK first — aborting." >&2
        return 1
    fi
    rm -rf "$held_dir.stale.$LOCK_TOKEN"
    # Only that winner gets here, and the link now dangles, so repointing it is
    # uncontended: a fresh contender's `ln -sn` still fails on the existing link
    # and every other takeover lost the rename above. `-f -n` replaces the link
    # itself rather than following it.
    ln -sfn "$LOCK_TARGET_NAME" "$LOCK_LINK" || return 1
    if [ "$(lock_owner_name)" != "$LOCK_TARGET_NAME" ]; then
        echo "lost $LOCK_LINK to another run after claiming it — aborting." >&2
        return 1
    fi
    return 0
}

claim_lock() {
    if _claim_lock; then
        return 0
    fi
    rmdir "$LOCK_TARGET" 2> /dev/null || true
    return 1
}

release_lock() {
    # Only the owner clears the shared link; a run whose stale lock was taken
    # over still cleans up its own directory, never the new owner's lock.
    if [ "$(lock_owner_name)" = "$LOCK_TARGET_NAME" ]; then
        rm -f "$LOCK_LINK"
    fi
    rm -rf "$LOCK_TARGET"
}

claim_lock || exit 1

# Pinned, never read back from the endpoint under test: deriving the expected
# chain from the RPC being validated makes the guard unfalsifiable.
CHAIN_ID="$EXPECTED_CHAIN_ID"

broadcast_file() {
    echo "broadcast/DistributeUsatRewards.s.sol/${CHAIN_ID}/run-latest.json"
}

# forge names its artifact after the script and the chain, so every round in a
# checkout writes the SAME run-latest.json. A sidecar therefore records which
# round produced it — replaying the top-off round's artifact into the campaign
# ledger stamps that ledger for the wrong wallet and then every fetch aborts.
round_marker_file() {
    echo "broadcast/DistributeUsatRewards.s.sol/${CHAIN_ID}/usat-round.json"
}

write_round_marker() {
    mkdir -p "$(dirname "$(round_marker_file)")"
    python3 -c "
import json, sys
ledger, recipients, distributor, chain_id, token, out = sys.argv[1:7]
json.dump({'ledger': ledger, 'recipients': recipients,
           'distributor': distributor.lower(), 'chain_id': int(chain_id),
           'token': token.lower()}, open(out, 'w'), indent=2)
" "$PAID_LEDGER_FILE" "$RECIPIENTS_FILE" "${DISTRIBUTOR_ADDRESS:-}" "$CHAIN_ID" \
        "$TOKEN_ADDRESS" "$(round_marker_file)"
}

# match | foreign | unmarked
round_marker_state() {
    python3 -c "
import json, os, sys
path, ledger, distributor, chain_id, token = sys.argv[1:6]
if not os.path.exists(path):
    print('unmarked')
    raise SystemExit(0)
try:
    marker = json.load(open(path))
except Exception:
    print('foreign')
    raise SystemExit(0)
same = (marker.get('ledger') == ledger
        and str(marker.get('chain_id')) == chain_id
        and (marker.get('token') or '').lower() == token.lower())
# The distributor only decides when both sides know it; signing through forge
# flags leaves it unset, and that must not make an own artifact look foreign.
if same and distributor and marker.get('distributor'):
    same = marker['distributor'].lower() == distributor.lower()
print('match' if same else 'foreign')
" "$(round_marker_file)" "$PAID_LEDGER_FILE" "${DISTRIBUTOR_ADDRESS:-}" "$CHAIN_ID" \
        "$TOKEN_ADDRESS"
}

archive_foreign_broadcast() {
    local archive
    archive="$(broadcast_file).foreign-$(date +%Y%m%dT%H%M%S)"
    mv "$(broadcast_file)" "$archive"
    if [ -f "$(round_marker_file)" ]; then
        mv "$(round_marker_file)" "$archive.round.json"
    fi
    echo "$archive"
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

# Recording may only happen once the artifact at that path is known to belong to
# this round — which is decided further down, after the signer is derived. An
# exit before that point (a rejected key, a signer that is not the declared
# distributor) must not have this trap record someone else's artifact into the
# ledger this run selected, which for a fresh ledger would even be accepted and
# stamp it for the wrong wallet.
ARTIFACT_IS_OURS=0

# Record on every exit path, signals included: a confirmed transfer that never
# reaches the ledger is exactly what makes the next run pay it again. A failure
# to record is therefore fatal rather than a warning — the transfers are on
# chain but invisible to the ledger, so finishing with status 0 would let the
# next run send them all over again.
cleanup() {
    local status=$?
    if [ "$BROADCAST" = "1" ] && [ "$ARTIFACT_IS_OURS" = "0" ] \
        && [ -f "$(broadcast_file)" ]; then
        echo "note: exiting before the broadcast artifact could be attributed to this round," >&2
        echo "so nothing was recorded into $PAID_LEDGER_FILE." >&2
    fi
    if [ "$BROADCAST" = "1" ] && [ "$ARTIFACT_IS_OURS" = "1" ]; then
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
    release_lock
    exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

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

# Replay whatever the previous run left behind BEFORE the Dune fetch reads the
# ledger: if recording failed last time, those payments are missing from the
# payment memory and this run would send them again. record-payments.py is
# deduped by transaction hash, so replaying an already-recorded file is a no-op.
# This sits after the signer is known, because whether the artifact belongs to
# this round is partly a question about the distributor.
if [ "$BROADCAST" = "1" ] && [ -f "$(broadcast_file)" ]; then
    MARKER_STATE=$(round_marker_state)
    if [ "${ARCHIVE_FOREIGN_BROADCAST:-0}" = "1" ] || [ "$MARKER_STATE" = "foreign" ]; then
        # Another round's artifact. Recording it here would write that round's
        # payments into this ledger and stamp it for the wrong wallet, and
        # refusing to run would block this round indefinitely — so set it aside,
        # say so, and continue. It must not stay in place either: this run's own
        # recording step would pick it up if forge failed before writing a new one.
        ARCHIVED=$(archive_foreign_broadcast)
        echo "warning: the broadcast artifact in this checkout belongs to a different payout" >&2
        echo "round, so it was NOT recorded into $PAID_LEDGER_FILE. It is archived as" >&2
        echo "  $ARCHIVED" >&2
        echo "along with the sidecar naming its round. If its payments are still missing from" >&2
        echo "that round's ledger, record it there by hand:" >&2
        echo "  ./scripts/usat-rewards/record-payments.py --broadcast $ARCHIVED \\" >&2
        echo "      --ledger <that round's ledger> --chain-id $CHAIN_ID --rpc-url $RPC_URL" >&2
    else
        echo "=== Replaying the previous broadcast file into the paid ledger ==="
        if ! record_payments; then
            echo "refusing to run: $(broadcast_file) could not be recorded into" >&2
            echo "$PAID_LEDGER_FILE, and its payments would be sent a second time." >&2
            echo "if that artifact belongs to another round, re-run with" >&2
            echo "ARCHIVE_FOREIGN_BROADCAST=1 to set it aside instead." >&2
            exit 1
        fi
    fi
fi

# From here on whatever sits at that path is this round's: either it was just
# validated or archived above, or forge is about to write it. Only now may the
# exit trap record it.
if [ "$BROADCAST" = "1" ]; then
    ARTIFACT_IS_OURS=1
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

# Stamp the round before forge can write anything, so even a crashed run leaves
# an artifact whose provenance is known.
if [ "$BROADCAST" = "1" ]; then
    write_round_marker
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
