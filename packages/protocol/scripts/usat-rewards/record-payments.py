#!/usr/bin/env python3
"""Record confirmed USA₮ reward payouts into the local paid ledger.

Reads a forge broadcast file (run-latest.json) produced by
DistributeUsatRewards.s.sol, extracts every successful ERC-20 transfer, and adds
the amounts to the paid ledger consumed by the script's idempotency check.

Usage:
  ./record-payments.py --broadcast <run-latest.json> [--ledger paid-ledger.json]

Safe to run repeatedly on DIFFERENT broadcast files; running it twice on the
same file would double-count, so it refuses hashes it has already recorded.
"""

import argparse
import json
import os
import sys

TRANSFER_SELECTOR = "0xa9059cbb"


def load_ledger(path: str) -> tuple[dict[str, int], set[str]]:
    if not os.path.exists(path):
        return {}, set()
    with open(path) as f:
        data = json.load(f)
    paid = dict(zip((w.lower() for w in data["recipients"]), data["amounts"]))
    return paid, set(data.get("recorded_tx_hashes", []))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--broadcast", required=True, help="forge broadcast run-latest.json")
    parser.add_argument("--ledger", default=os.path.join(os.path.dirname(__file__), "paid-ledger.json"))
    args = parser.parse_args()

    with open(args.broadcast) as f:
        run = json.load(f)

    statuses = {r["transactionHash"].lower(): r.get("status") for r in run.get("receipts", [])}
    paid, seen_hashes = load_ledger(args.ledger)

    recorded = skipped_failed = skipped_seen = 0
    for tx in run.get("transactions", []):
        tx_hash = (tx.get("hash") or "").lower()
        data = tx.get("transaction", {}).get("input") or tx.get("transaction", {}).get("data") or ""
        if not data.startswith(TRANSFER_SELECTOR):
            continue
        if tx_hash in seen_hashes:
            skipped_seen += 1
            continue
        if statuses.get(tx_hash) not in ("0x1", 1):
            skipped_failed += 1
            continue
        recipient = "0x" + data[10 + 24 : 10 + 64]
        amount = int(data[10 + 64 : 10 + 128], 16)
        paid[recipient] = paid.get(recipient, 0) + amount
        seen_hashes.add(tx_hash)
        recorded += 1

    wallets = sorted(paid)
    with open(args.ledger, "w") as f:
        json.dump(
            {
                "recipients": wallets,
                "amounts": [paid[w] for w in wallets],
                "recorded_tx_hashes": sorted(seen_hashes),
            },
            f,
            indent=2,
        )

    total = sum(paid.values())
    print(
        f"recorded {recorded} transfers ({skipped_failed} failed, {skipped_seen} already recorded); "
        f"ledger now {len(wallets)} wallets, {total / 1_000_000:.2f} USAT -> {args.ledger}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
