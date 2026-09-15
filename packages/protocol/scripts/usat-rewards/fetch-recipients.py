#!/usr/bin/env python3
"""Fetch the USA₮ per-account rewards ledger from Dune and write recipients.json.

Triggers a FRESH execution of Dune query 7506058 ("USA₮ Launch — Per-Account
Rewards Ledger", P2P + hold milestones) — never cached results — and writes the
wallets still owed rewards into the JSON consumed by DistributeUsatRewards.s.sol:

  { "recipients": [...], "amounts": [...], "generated_at": "..." }

Reconciliation contract with the forge script:
  * Dune's owed is already net of every on-chain payment it has indexed from the
    distributor wallet (so a wallet paid 0.30 in the past is owed only the rest).
  * Dune indexes with a lag, so the local ledger has to carry our own payment
    record until Dune catches up. Dune's `paid_out_usat` is cumulative while the
    ledger only accumulates payments made since the last fetch, so the two are
    only comparable through a stored baseline. The ledger therefore keeps:
      - "dune_paid_baseline": Dune's cumulative paid per wallet at the previous
        fetch, so `dune_paid_now − baseline` is what Dune indexed since then;
      - "unindexed": our payments Dune had still not indexed at that fetch.
    Per wallet the surplus Dune still does not know about is
        unindexed' = max(0, unindexed + paid_since_fetch − newly_indexed)
    and that is what gets subtracted from Dune's owed here. A payment is counted
    exactly once however many fetches Dune takes to index it.
  * The forge-visible "recipients"/"amounts" pair is emptied afterwards:
    recipients.json already has the surplus subtracted, so the forge script must
    not subtract it a second time. It refills from the next broadcast receipts.

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
PAGE_LIMIT = 32000


def api(path: str, key: str, body: dict | None = None) -> dict:
    req = urllib.request.Request(
        f"{API}{path}",
        headers={"X-Dune-API-Key": key, "Content-Type": "application/json"},
        data=json.dumps(body).encode() if body is not None else None,
        method="POST" if body is not None else "GET",
    )
    with urllib.request.urlopen(req) as resp:
        return json.load(resp)


def fetch_all_rows(execution_id: str, key: str) -> list[dict]:
    """Read every result page: a truncated ledger would silently drop wallets."""
    rows: list[dict] = []
    offset = 0
    while True:
        page = api(f"/execution/{execution_id}/results?limit={PAGE_LIMIT}&offset={offset}", key)
        batch = page["result"]["rows"]
        rows.extend(batch)
        next_offset = page.get("next_offset")
        if not batch or next_offset is None:
            return rows
        offset = next_offset


def micro(value) -> int:
    return round(float(value or 0) * 1_000_000)


def reconcile(dune_rows: list[dict], ledger: dict) -> tuple[dict[str, int], dict]:
    """Net Dune's owed against the payments Dune has not indexed yet.

    dune_rows: rows with wallet / owed_usat / paid_out_usat.
    ledger:    {"recipients", "amounts", "unindexed", "dune_paid_baseline",
                "recorded_tx_hashes"}.
    Returns (owed per wallet in micro-USA₮, the ledger to persist).
    """
    since_fetch = {
        w.lower(): a
        for w, a in zip(ledger.get("recipients", []), ledger.get("amounts", []))
    }
    carried = {w.lower(): a for w, a in (ledger.get("unindexed") or {}).items()}
    baseline = {w.lower(): a for w, a in (ledger.get("dune_paid_baseline") or {}).items()}
    dune_paid = {row["wallet"].lower(): micro(row.get("paid_out_usat")) for row in dune_rows}

    unindexed: dict[str, int] = {}
    for wallet in set(carried) | set(since_fetch):
        newly_indexed = max(0, dune_paid.get(wallet, 0) - baseline.get(wallet, 0))
        surplus = carried.get(wallet, 0) + since_fetch.get(wallet, 0) - newly_indexed
        if surplus > 0:
            unindexed[wallet] = surplus

    owed_out: dict[str, int] = {}
    for row in dune_rows:
        wallet = row["wallet"].lower()
        remaining = micro(row["owed_usat"]) - unindexed.get(wallet, 0)
        if remaining > 0:
            owed_out[wallet] = remaining

    # Carry the baseline of wallets missing from this snapshot: dropping it would
    # make their whole cumulative paid look "newly indexed" on the next fetch.
    new_baseline = {**baseline, **dune_paid}
    new_ledger = {
        "recipients": [],
        "amounts": [],
        "unindexed": {w: unindexed[w] for w in sorted(unindexed)},
        "dune_paid_baseline": {w: new_baseline[w] for w in sorted(new_baseline) if new_baseline[w] > 0},
        "recorded_tx_hashes": sorted(ledger.get("recorded_tx_hashes", [])),
    }
    # Keep the chain/token the recorder stamped, so the scoping survives a fetch.
    for field in ("token", "chain_id"):
        if ledger.get(field) is not None:
            new_ledger[field] = ledger[field]
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

    rows = fetch_all_rows(execution_id, key)

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
    carried = sum(new_ledger["unindexed"].values())
    print(f"{len(recipients)} wallets owed {total / 1_000_000:.2f} USAT -> {args.out} "
          f"({len(rows)} ledger rows; {carried / 1_000_000:.2f} USAT still unindexed by Dune)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
