#!/usr/bin/env python3
"""Record confirmed USA₮ reward payouts into the local paid ledger.

Reads a forge broadcast file (run-latest.json) produced by
DistributeUsatRewards.s.sol, extracts every successful ERC-20 transfer, and adds
the amounts to the paid ledger consumed by the script's idempotency check.

Usage:
  ./record-payments.py --broadcast <run-latest.json> [--ledger paid-ledger.json]
                       [--token 0x...] [--chain-id 42220]

Only transfers of the expected token on the expected chain are recorded, and the
ledger is stamped with that pair plus the wallet that sent them: a fork or
mock-token rehearsal can therefore never write into — or be mistaken for — the
mainnet payment record, and one wallet's payments can never be subtracted from
another wallet's obligation, either of which would suppress rewards that were
never really paid.

A transaction the broadcast file has no receipt for is NOT treated as failed: a
forge run interrupted between submitting a transfer and serializing its receipt
leaves exactly that, and the transfer may well be on chain. Those are resolved
against the RPC instead — recorded if mined, skipped only if provably dropped,
and otherwise left unresolved with a non-zero exit, which stops the next payout
until a human or a later confirmation settles it.

Safe to run repeatedly on DIFFERENT broadcast files; running it twice on the
same file would double-count, so it refuses hashes it has already recorded.
"""

import argparse
import json
import os
import sys
import urllib.request

TRANSFER_SELECTOR = "0xa9059cbb"
TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
USAT_MAINNET = "0xd2ab3c9a02dbbab236bfec45d1d755df4267f771"
CELO_MAINNET_CHAIN_ID = 42220
RPC_TIMEOUT = 30
# Declaring a submitted transaction dead needs more than one endpoint saying it
# has never heard of the hash: forno load-balances, so a lagging node answers
# "unknown" for a transaction a current node has already mined. Ask several
# times, and only trust a consumed nonce that is already this many blocks deep —
# a node behind by that much cannot serve the historical query at all, so it
# errors out instead of misleading us.
DROP_RECHECKS = int(os.environ.get("DROP_RECHECKS", "3"))
DROP_RECHECK_SECONDS = float(os.environ.get("DROP_RECHECK_SECONDS", "2"))
DROP_CONFIRMATIONS = int(os.environ.get("DROP_CONFIRMATIONS", "32"))


def rpc(url: str, method: str, params: list) -> object:
    request = urllib.request.Request(
        url,
        data=json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=RPC_TIMEOUT) as response:
        payload = json.load(response)
    if payload.get("error"):
        raise RuntimeError(f"{method} failed: {payload['error']}")
    return payload.get("result")


def to_int(value) -> int | None:
    """Broadcast artifacts and RPC results mix hex strings and plain numbers."""
    if isinstance(value, int):
        return value
    if isinstance(value, str) and value:
        return int(value, 16 if value.startswith("0x") else 10)
    return None


def transfer_in_receipt(receipt: dict, token: str, sender: str, recipient: str, amount: int) -> bool:
    """Did this receipt really move `amount` of `token` to `recipient`?

    A status-1 receipt is not proof: a token can return false from transfer
    without reverting, so the Transfer log decides — same rule the cloud
    function applies to its own receipts.
    """
    for log in receipt.get("logs") or []:
        topics = [topic.lower() for topic in log.get("topics") or []]
        if len(topics) < 3 or topics[0] != TRANSFER_TOPIC:
            continue
        if (log.get("address") or "").lower() != token:
            continue
        if sender and topics[1][-40:] != sender.lower()[-40:]:
            continue
        if topics[2][-40:] != recipient.lower()[-40:]:
            continue
        if to_int(log.get("data")) == amount:
            return True
    return False


def resolve_missing_receipt(url: str, tx_hash: str, call: dict, token: str,
                            recipient: str, amount: int) -> str:
    """Classify a transfer the broadcast file holds no receipt for.

    "mined"      — the transfer is on chain and matches; record it.
    "reverted"   — mined but reverted; nothing moved.
    "dropped"    — it provably can never be mined; nothing moved.
    "unresolved" — unknown, so nothing may be assumed either way.

    Everything inconclusive, the RPC being unreachable included, ends up
    "unresolved" on purpose: guessing "failed" is what lets a later Dune refresh
    pay a recipient who was in fact already paid.
    """
    sender = (call.get("from") or "").lower()
    try:
        # Several separate look-ups, so a load balancer is likely to hand at
        # least one of them to a node that is caught up. Any hit at all settles
        # the transfer; only a miss on every single attempt is evidence.
        for attempt in range(max(1, DROP_RECHECKS)):
            if attempt:
                time.sleep(DROP_RECHECK_SECONDS)
            receipt = rpc(url, "eth_getTransactionReceipt", [tx_hash])
            if receipt:
                if to_int(receipt.get("status")) != 1:
                    return "reverted"
                return ("mined" if transfer_in_receipt(receipt, token, sender, recipient, amount)
                        else "unresolved")
            if rpc(url, "eth_getTransactionByHash", [tx_hash]) is not None:
                # Some node still holds it, pending or mining: not dead.
                return "unresolved"

        # Every look-up missed the hash, which on its own proves nothing. A
        # consumed nonce only means something if it was already consumed at a
        # depth no lagging node can explain: asking "latest" of a current node
        # while the receipt queries went to a stale one is exactly how a mined
        # transfer gets mistaken for a dropped one.
        nonce = to_int(call.get("nonce"))
        if nonce is None or not sender:
            return "unresolved"
        latest = to_int(rpc(url, "eth_blockNumber", []))
        if latest is None or latest <= DROP_CONFIRMATIONS:
            return "unresolved"
        confirmed = latest - DROP_CONFIRMATIONS
        used = to_int(rpc(url, "eth_getTransactionCount", [sender, hex(confirmed)]))
        if used is None or used <= nonce:
            return "unresolved"
        return "dropped"
    except Exception as error:  # noqa: BLE001 - any doubt means unresolved
        print(f"could not resolve {tx_hash} against {url}: {error}", file=sys.stderr)
        return "unresolved"


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


def distributor_error(stamped: str | None, senders: set[str]) -> str | None:
    """Refuse a broadcast sent by a wallet other than the ledger's own.

    Dune nets payments per distributor, so two wallets sharing one ledger means
    one wallet's payments are subtracted from the other's obligation — the
    rewards it never received then look paid for good.
    """
    if not stamped:
        return None
    foreign = sorted(sender for sender in senders if sender and sender != stamped.lower())
    if not foreign:
        return None
    if os.environ.get("ALLOW_DISTRIBUTOR_CHANGE") == "1":
        print(f"warning: ledger is scoped to distributor {stamped} but this broadcast was sent "
              f"by {', '.join(foreign)} — ALLOW_DISTRIBUTOR_CHANGE=1 accepts it.",
              file=sys.stderr)
        return None
    return (f"ledger holds payments made by {stamped} but this broadcast was sent by "
            f"{', '.join(foreign)}; recording both in one ledger subtracts one wallet's "
            "payments from the other's obligation. Use a separate --ledger, or set "
            "ALLOW_DISTRIBUTOR_CHANGE=1 once the payment history has been migrated.")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--broadcast", required=True, help="forge broadcast run-latest.json")
    parser.add_argument("--ledger", default=os.path.join(os.path.dirname(__file__), "paid-ledger.json"))
    parser.add_argument("--token", default=os.environ.get("USAT_ADDRESS", USAT_MAINNET),
                        help="token whose transfers count as reward payments")
    parser.add_argument("--chain-id", type=int,
                        default=int(os.environ.get("EXPECTED_CHAIN_ID", CELO_MAINNET_CHAIN_ID)),
                        help="chain the broadcast must come from")
    parser.add_argument("--rpc-url", default=os.environ.get("RPC_URL", "https://forno.celo.org"),
                        help="RPC used to settle transactions the broadcast has no receipt for")
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

    recorded = skipped_failed = skipped_seen = skipped_other_token = skipped_dropped = 0
    unresolved: list[str] = []
    senders: set[str] = set()
    for tx in run.get("transactions", []):
        tx_hash = (tx.get("hash") or "").lower()
        call = tx.get("transaction", {})
        data = call.get("input") or call.get("data") or ""
        if not data.startswith(TRANSFER_SELECTOR):
            continue
        if (call.get("to") or "").lower() != token:
            skipped_other_token += 1
            continue
        # Who sent it decides which ledger it belongs in, whether or not this
        # particular transfer ends up being appended below.
        senders.add((call.get("from") or "").lower())
        if tx_hash in seen_hashes:
            skipped_seen += 1
            continue
        recipient = "0x" + data[10 + 24 : 10 + 64]
        amount = int(data[10 + 64 : 10 + 128], 16)
        status = statuses.get(tx_hash)
        if status is None:
            # Forge never wrote a receipt for this transaction — an interrupted
            # run looks exactly like this — so the transfer may be on chain.
            # Calling that "failed" is what makes the next refresh pay again.
            outcome = resolve_missing_receipt(args.rpc_url, tx_hash, call, token,
                                              recipient, amount)
            if outcome == "reverted":
                skipped_failed += 1
                continue
            if outcome == "dropped":
                skipped_dropped += 1
                continue
            if outcome != "mined":
                unresolved.append(tx_hash)
                continue
        elif to_int(status) != 1:
            skipped_failed += 1
            continue
        paid[recipient] = paid.get(recipient, 0) + amount
        seen_hashes.add(tx_hash)
        recorded += 1

    scope_error = distributor_error(ledger.get("distributor"), senders)
    if scope_error:
        raise SystemExit(scope_error)

    # Stamp the wallet that sent these transfers when the ledger does not name
    # one yet, or when the operator has explicitly accepted a rotation.
    distributor = ledger.get("distributor")
    if len(senders) == 1 and (not distributor
                              or os.environ.get("ALLOW_DISTRIBUTOR_CHANGE") == "1"):
        distributor = next(iter(senders)) or distributor

    wallets = sorted(paid)
    payload = {
        **ledger,
        "recipients": wallets,
        "amounts": [paid[w] for w in wallets],
        "recorded_tx_hashes": sorted(seen_hashes),
        "token": token,
        "chain_id": args.chain_id,
    }
    if distributor:
        payload["distributor"] = distributor
    write_json(args.ledger, payload)

    total = sum(paid.values())
    print(
        f"recorded {recorded} transfers ({skipped_failed} failed, {skipped_seen} already recorded, "
        f"{skipped_other_token} other token, {skipped_dropped} dropped before mining); "
        f"ledger now {len(wallets)} wallets, {total / 1_000_000:.2f} USAT -> {args.ledger}"
    )

    if unresolved:
        # Everything confirmed is already persisted above; this exit is what
        # stops the next payout from running while a submitted transfer is
        # neither mined nor provably dead, because a refresh would see it as
        # unpaid and send it again.
        print(
            f"{len(unresolved)} transfer(s) were submitted but are neither mined nor dropped: "
            + ", ".join(unresolved)
            + f". They are NOT in the ledger. Re-run this command once {args.rpc_url} can settle "
            "them (a later block confirms or drops them); until then a payout run would pay "
            "those recipients a second time.",
            file=sys.stderr,
        )
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
