#!/usr/bin/env python3
"""Record confirmed USA₮ reward payouts into the local paid ledger.

Reads a forge broadcast file (run-latest.json) produced by
DistributeUsatRewards.s.sol, extracts every successful ERC-20 transfer, and adds
the amounts to the paid ledger consumed by the script's idempotency check.

Usage:
  ./record-payments.py --broadcast <run-latest.json> [--ledger paid-ledger.json]
                       [--token 0x...] [--chain-id 42220]

Only transfers of the expected token on the expected chain are recorded, and the
ledger is stamped with that pair: a fork or mock-token rehearsal can therefore
never write into — or be mistaken for — the mainnet payment record, which would
suppress rewards that were never really paid.

Safe to run repeatedly on DIFFERENT broadcast files; running it twice on the
same file would double-count, so it refuses hashes it has already recorded.
"""

import argparse
import json
import os
import sys

TRANSFER_SELECTOR = "0xa9059cbb"
USAT_MAINNET = "0xd2ab3c9a02dbbab236bfec45d1d755df4267f771"
CELO_MAINNET_CHAIN_ID = 42220


def write_json(path: str, payload: dict) -> None:
    """Temp file + rename: a crash mid-write would truncate the ledger, which is
    the only record of the payments Dune has not indexed yet."""
    tmp = f"{path}.tmp"
    with open(tmp, "w") as f:
        json.dump(payload, f, indent=2)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, path)


def load_ledger(path: str, token: str, chain_id: int) -> tuple[dict, dict[str, int], set[str]]:
    if not os.path.exists(path):
        return {}, {}, set()
    with open(path) as f:
        data = json.load(f)
    for field, expected in (("token", token), ("chain_id", chain_id)):
        actual = data.get(field)
        if actual is not None and str(actual).lower() != str(expected).lower():
            raise SystemExit(
                f"ledger {path} is scoped to {field}={actual}, refusing to record {expected}; "
                "use a separate --ledger for a different chain or token."
            )
    paid = {w.lower(): a for w, a in zip(data.get("recipients", []), data.get("amounts", []))}
    return data, paid, set(data.get("recorded_tx_hashes", []))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--broadcast", required=True, help="forge broadcast run-latest.json")
    parser.add_argument("--ledger", default=os.path.join(os.path.dirname(__file__), "paid-ledger.json"))
    parser.add_argument("--token", default=os.environ.get("USAT_ADDRESS", USAT_MAINNET),
                        help="token whose transfers count as reward payments")
    parser.add_argument("--chain-id", type=int,
                        default=int(os.environ.get("EXPECTED_CHAIN_ID", CELO_MAINNET_CHAIN_ID)),
                        help="chain the broadcast must come from")
    args = parser.parse_args()
    token = args.token.lower()

    with open(args.broadcast) as f:
        run = json.load(f)

    broadcast_chain = run.get("chain")
    if broadcast_chain is not None and int(broadcast_chain) != args.chain_id:
        print(f"broadcast is from chain {broadcast_chain}, expected {args.chain_id} — "
              "not recording (pass --chain-id to record another chain).", file=sys.stderr)
        return 1

    statuses = {r["transactionHash"].lower(): r.get("status") for r in run.get("receipts", [])}
    ledger, paid, seen_hashes = load_ledger(args.ledger, token, args.chain_id)

    recorded = skipped_failed = skipped_seen = skipped_other_token = 0
    for tx in run.get("transactions", []):
        tx_hash = (tx.get("hash") or "").lower()
        call = tx.get("transaction", {})
        data = call.get("input") or call.get("data") or ""
        if not data.startswith(TRANSFER_SELECTOR):
            continue
        if (call.get("to") or "").lower() != token:
            skipped_other_token += 1
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
    write_json(
        args.ledger,
        {
            **ledger,
            "recipients": wallets,
            "amounts": [paid[w] for w in wallets],
            "recorded_tx_hashes": sorted(seen_hashes),
            "token": token,
            "chain_id": args.chain_id,
        },
    )

    total = sum(paid.values())
    print(
        f"recorded {recorded} transfers ({skipped_failed} failed, {skipped_seen} already recorded, "
        f"{skipped_other_token} other token); "
        f"ledger now {len(wallets)} wallets, {total / 1_000_000:.2f} USAT -> {args.ledger}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
