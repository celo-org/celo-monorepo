#!/usr/bin/env python3
"""Fetch the USA₮ per-account rewards ledger from Dune and write recipients.json.

Triggers a FRESH execution of Dune query 7506058 ("USA₮ Launch — Per-Account
Rewards Ledger", P2P 0.20 + hold 0.30) — never cached results — and writes the
wallets still owed rewards into the JSON consumed by DistributeUsatRewards.s.sol:

  { "recipients": [...], "amounts": [...], "generated_at": "..." }

Reconciliation contract with the forge script:
  * Dune's owed is already net of every on-chain payment it has indexed from the
    distributor wallet (so a wallet paid 0.30 in the past is owed only the rest).
  * The local paid ledger may know about broadcasts Dune has not indexed yet.
    Per wallet, the surplus max(0, local_paid − dune_paid) is subtracted from
    owed here, and the ledger's amounts are then CLEARED (tx hashes kept for the
    recorder's dedupe). After a fetch the ledger only ever accumulates payments
    made after it — which the forge script subtracts in full. Every payment is
    counted exactly once: by Dune once indexed, by the ledger until then.

Usage:
  DUNE_API_KEY=... ./fetch-recipients.py --distributor 0x... \
      [--out recipients.json] [--ledger paid-ledger.json]

--distributor is required: without it the Dune ledger cannot net out past
payments and every reward would look unpaid forever. Pass --allow-no-distributor
only for the very first round, before any payout has ever been made.
"""

import argparse
import datetime
import json
import os
import sys
import time
import urllib.request

QUERY_ID = 7506058
API = "https://api.dune.com/api/v1"
ZERO = "0x0000000000000000000000000000000000000000"


def api(path: str, key: str, body: dict | None = None) -> dict:
    req = urllib.request.Request(
        f"{API}{path}",
        headers={"X-Dune-API-Key": key, "Content-Type": "application/json"},
        data=json.dumps(body).encode() if body is not None else None,
        method="POST" if body is not None else "GET",
    )
    with urllib.request.urlopen(req) as resp:
        return json.load(resp)


def reconcile(
    dune_rows: list[dict], ledger: dict
) -> tuple[dict[str, int], dict]:
    """Net Dune's owed against the local ledger surplus; return (owed, new_ledger).

    dune_rows: rows with wallet / owed_usat / paid_out_usat.
    ledger:    {"recipients": [...], "amounts": [...], "recorded_tx_hashes": [...]}.
    """
    local_paid = dict(zip((w.lower() for w in ledger.get("recipients", [])), ledger.get("amounts", [])))
    dune_paid_by_wallet = {
        row["wallet"].lower(): round(float(row.get("paid_out_usat") or 0) * 1_000_000)
        for row in dune_rows
    }
    owed_out: dict[str, int] = {}
    for row in dune_rows:
        wallet = row["wallet"].lower()
        owed = round(float(row["owed_usat"]) * 1_000_000)
        surplus = max(0, local_paid.get(wallet, 0) - dune_paid_by_wallet[wallet])
        remaining = owed - surplus
        if remaining > 0:
            owed_out[wallet] = remaining
    # Keep only the surplus Dune has not indexed yet, so a payment stays
    # protected for as many runs as it takes Dune to index it.
    kept = {
        w: a - dune_paid_by_wallet.get(w, 0)
        for w, a in local_paid.items()
        if a - dune_paid_by_wallet.get(w, 0) > 0
    }
    new_ledger = {
        "recipients": sorted(kept),
        "amounts": [kept[w] for w in sorted(kept)],
        "recorded_tx_hashes": sorted(ledger.get("recorded_tx_hashes", [])),
    }
    return owed_out, new_ledger


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--distributor", default=None, help="hot wallet address that pays rewards")
    parser.add_argument("--allow-no-distributor", action="store_true",
                        help="permit running without --distributor (first round only)")
    parser.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "recipients.json"))
    parser.add_argument("--ledger", default=os.path.join(os.path.dirname(__file__), "paid-ledger.json"))
    args = parser.parse_args()

    if not args.distributor:
        if not args.allow_no_distributor:
            print("--distributor is required so already-paid rewards are netted out; "
                  "use --allow-no-distributor only for the very first round.", file=sys.stderr)
            return 1
        args.distributor = ZERO

    key = os.environ.get("DUNE_API_KEY")
    if not key:
        print("DUNE_API_KEY not set", file=sys.stderr)
        return 1

    execution = api(
        f"/query/{QUERY_ID}/execute",
        key,
        {"query_parameters": {"distributor_address": args.distributor}},
    )
    execution_id = execution["execution_id"]
    print(f"fresh execution {execution_id} started (distributor {args.distributor})", file=sys.stderr)

    while True:
        status = api(f"/execution/{execution_id}/status", key)
        state = status["state"]
        if state == "QUERY_STATE_COMPLETED":
            break
        if state in ("QUERY_STATE_FAILED", "QUERY_STATE_CANCELLED", "QUERY_STATE_EXPIRED"):
            print(f"execution ended in {state}", file=sys.stderr)
            return 1
        time.sleep(5)

    rows = api(f"/execution/{execution_id}/results?limit=32000", key)["result"]["rows"]

    ledger = {}
    if os.path.exists(args.ledger):
        with open(args.ledger) as f:
            ledger = json.load(f)

    owed, new_ledger = reconcile(rows, ledger)

    recipients = sorted(owed)
    payload = {
        "recipients": recipients,
        "amounts": [owed[w] for w in recipients],
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }
    with open(args.out, "w") as f:
        json.dump(payload, f, indent=2)
    with open(args.ledger, "w") as f:
        json.dump(new_ledger, f, indent=2)

    total = sum(payload["amounts"])
    print(f"{len(recipients)} wallets owed {total / 1_000_000:.2f} USAT -> {args.out} "
          f"(ledger reconciled and cleared)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
