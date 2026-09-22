"""USA₮ launch rewards distributor — Google Cloud Function (gen2, HTTP).

Scheduled by Cloud Scheduler, this function performs one distribution round:

  1. Acquire a run lock in GCS (prevents overlapping runs).
  2. Trigger a FRESH execution of the public Dune per-account rewards ledger
     (query 7506058) with distributor = the hot wallet. Dune computes
     owed = earned − USA₮ already sent on-chain by the hot wallet.
  3. Reconcile against the paid ledger stored in GCS: subtract any payments
     Dune has not indexed yet (max(0, local − dune) per wallet), then clear
     the ledger's amounts — after a fetch the ledger only ever holds payments
     made after it, so every payment is subtracted exactly once.
  4. Safety rails: per-wallet cap, per-run total cap, token + gas balance
     checks. Any violation aborts before a single transfer is sent.
  5. Send ERC-20 transfers sequentially, appending each confirmed payment to
     the GCS ledger immediately, so a crash mid-run never loses payment memory.

Environment (plain env vars):
  RPC_URL             default https://forno.celo.org
  USAT_ADDRESS        default canonical USA₮ on Celo mainnet
  GCS_BUCKET          bucket for ledger + lock (required unless LOCAL_STATE_DIR)
  LOCAL_STATE_DIR     local dir instead of GCS — for testing only
  MAX_PER_WALLET      micro-USA₮, default 1000000 (campaign max 1 USA₮)
  MAX_TOTAL_PER_RUN   micro-USA₮, default 100000000 (100 USA₮) — a larger owed
                      total aborts the run for manual review
  DRY_RUN             "1" = report what would be paid, send nothing

Secrets (mount via Secret Manager):
  PRIVATE_KEY         hot wallet key
  DUNE_API_KEY        Dune API key

Response: JSON summary {paid, skipped, total_usat, tx, dry_run, ...}.
"""

import json
import os
import time
import urllib.request

import functions_framework
from web3 import Web3

DUNE_QUERY_ID = 7506058
DUNE_API = "https://api.dune.com/api/v1"
USAT_DEFAULT = "0xD2ab3C9A02DBBAB236BfEC45D1d755DF4267F771"
ERC20_ABI = json.loads(
    '[{"name":"transfer","type":"function","stateMutability":"nonpayable",'
    '"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"}],'
    '"outputs":[{"name":"","type":"bool"}]},'
    '{"name":"balanceOf","type":"function","stateMutability":"view",'
    '"inputs":[{"name":"owner","type":"address"}],'
    '"outputs":[{"name":"","type":"uint256"}]}]'
)
LEDGER_OBJECT = "paid-ledger.json"
LOCK_OBJECT = "run-lock.json"
PENDING_OBJECT = "pending-execution.json"
# Kill switch: while this object exists in the bucket no transfer is sent.
# Create it to stop a running payout within one transfer; delete it to allow
# runs again. Redeploying or deleting the function does NOT stop an in-flight
# request — Cloud Run keeps it alive — so this flag is the only reliable halt.
HALT_OBJECT = "HALT"
LOCK_STALE_SECONDS = 3600
# Celo fee abstraction: when the wallet has no CELO, transfers are sent as
# CIP-64 transactions that pay gas in USA₮ through its fee-currency adapter.
CIP64_TX_TYPE = b"\x7b"
FEE_CURRENCY_ADAPTER_DEFAULT = "0x0357EE22278c922e1D36cFe6b899269b161880C4"
FEE_CURRENCY_GAS_LIMIT = 200_000  # ERC-20 transfer + the adapter's 85k intrinsic gas


class DuneStillRunning(Exception):
    """Dune execution outlived our poll budget; a later trigger resumes it."""

    def __init__(self, execution_id: str):
        super().__init__(execution_id)
        self.execution_id = execution_id


# ---------------------------------------------------------------- state store
class GcsStore:
    """Ledger + lock in a GCS bucket. Lock uses if-generation-match=0 so two
    concurrent runs cannot both acquire it."""

    def __init__(self, bucket_name: str):
        from google.cloud import storage

        self.bucket = storage.Client().bucket(bucket_name)

    def load_ledger(self) -> dict:
        return self.get_json(LEDGER_OBJECT) or {}

    def save_ledger(self, ledger: dict) -> None:
        self.put_json(LEDGER_OBJECT, ledger)

    def get_json(self, name: str) -> dict | None:
        blob = self.bucket.blob(name)
        if not blob.exists():
            return None
        return json.loads(blob.download_as_bytes())

    def put_json(self, name: str, data: dict) -> None:
        # The ledger write is the payment memory — a transient GCS hiccup must
        # not kill a payout run, so retry with backoff before giving up.
        last_error = None
        for attempt in range(5):
            try:
                self.bucket.blob(name).upload_from_string(json.dumps(data, indent=2))
                return
            except Exception as error:  # noqa: BLE001 - retry any transport error
                last_error = error
                time.sleep(2 ** attempt)
        raise last_error

    def delete(self, name: str) -> None:
        blob = self.bucket.blob(name)
        if blob.exists():
            blob.delete()

    def exists(self, name: str) -> bool:
        return self.bucket.blob(name).exists()

    def acquire_lock(self) -> bool:
        from google.api_core import exceptions

        blob = self.bucket.blob(LOCK_OBJECT)
        payload = json.dumps({"acquired_at": time.time()})
        try:
            blob.upload_from_string(payload, if_generation_match=0)
            return True
        except exceptions.PreconditionFailed:
            existing = json.loads(blob.download_as_bytes())
            if time.time() - existing.get("acquired_at", 0) > LOCK_STALE_SECONDS:
                blob.upload_from_string(payload)  # steal stale lock
                return True
            return False

    def release_lock(self) -> None:
        blob = self.bucket.blob(LOCK_OBJECT)
        if blob.exists():
            blob.delete()


class LocalStore:
    """Filesystem store — testing only."""

    def __init__(self, dirpath: str):
        self.dir = dirpath
        os.makedirs(dirpath, exist_ok=True)

    def load_ledger(self) -> dict:
        return self.get_json(LEDGER_OBJECT) or {}

    def save_ledger(self, ledger: dict) -> None:
        self.put_json(LEDGER_OBJECT, ledger)

    def get_json(self, name: str) -> dict | None:
        path = os.path.join(self.dir, name)
        if not os.path.exists(path):
            return None
        with open(path) as f:
            return json.load(f)

    def put_json(self, name: str, data: dict) -> None:
        with open(os.path.join(self.dir, name), "w") as f:
            json.dump(data, f, indent=2)

    def delete(self, name: str) -> None:
        path = os.path.join(self.dir, name)
        if os.path.exists(path):
            os.remove(path)

    def exists(self, name: str) -> bool:
        return os.path.exists(os.path.join(self.dir, name))

    def acquire_lock(self) -> bool:
        path = os.path.join(self.dir, LOCK_OBJECT)
        try:
            fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.write(fd, json.dumps({"acquired_at": time.time()}).encode())
            os.close(fd)
            return True
        except FileExistsError:
            with open(path) as f:
                existing = json.load(f)
            if time.time() - existing.get("acquired_at", 0) > LOCK_STALE_SECONDS:
                with open(path, "w") as f:
                    json.dump({"acquired_at": time.time()}, f)
                return True
            return False

    def release_lock(self) -> None:
        path = os.path.join(self.dir, LOCK_OBJECT)
        if os.path.exists(path):
            os.remove(path)


# ---------------------------------------------------------------------- dune
def dune_api(path: str, key: str, body: dict | None = None) -> dict:
    req = urllib.request.Request(
        f"{DUNE_API}{path}",
        headers={"X-Dune-API-Key": key, "Content-Type": "application/json"},
        data=json.dumps(body).encode() if body is not None else None,
        method="POST" if body is not None else "GET",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.load(resp)


def fetch_dune_rows(key: str, distributor: str, store) -> list[dict]:
    # Reuse an execution a previous invocation left running: Dune executions
    # survive our process, so a slow query converges across scheduled retries
    # instead of restarting from zero each time.
    pending = store.get_json(PENDING_OBJECT)
    execution_id = pending.get("execution_id") if pending else None

    if not execution_id:
        # No performance tier requested: Dune picks the largest tier the API
        # plan allows, and deduplicates into an already-running identical query.
        execution = dune_api(
            f"/query/{DUNE_QUERY_ID}/execute",
            key,
            {"query_parameters": {"distributor_address": distributor}},
        )
        execution_id = execution["execution_id"]
        store.put_json(PENDING_OBJECT, {"execution_id": execution_id})

    poll_budget = int(os.environ.get("DUNE_POLL_SECONDS", "1200"))
    deadline = time.time() + poll_budget
    while True:
        state = dune_api(f"/execution/{execution_id}/status", key)["state"]
        if state == "QUERY_STATE_COMPLETED":
            break
        if state in ("QUERY_STATE_FAILED", "QUERY_STATE_CANCELLED", "QUERY_STATE_EXPIRED"):
            store.delete(PENDING_OBJECT)
            raise RuntimeError(f"Dune execution {execution_id} ended in {state}")
        if time.time() > deadline:
            # Leave the pending marker in place; the next trigger resumes it.
            raise DuneStillRunning(execution_id)
        time.sleep(5)
    store.delete(PENDING_OBJECT)
    return dune_api(f"/execution/{execution_id}/results?limit=32000", key)["result"]["rows"]


# -------------------------------------------------------------- reconcile
def reconcile(dune_rows: list[dict], ledger: dict) -> tuple[dict[str, int], dict]:
    """Same contract as fetch-recipients.py: Dune's owed minus the ledger
    surplus Dune has not indexed yet; ledger amounts are then cleared so the
    ledger only ever holds payments made after this fetch."""
    local_paid = dict(
        zip((w.lower() for w in ledger.get("recipients", [])), ledger.get("amounts", []))
    )
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
    # Keep only the surplus Dune has not indexed yet. A payment therefore stays
    # protected for as many runs as it takes Dune to index it (not just one),
    # and the ledger still shrinks to empty once Dune has caught up.
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


def ledger_add(ledger: dict, wallet: str, amount: int, tx_hash: str) -> dict:
    paid = dict(zip(ledger["recipients"], ledger["amounts"]))
    paid[wallet] = paid.get(wallet, 0) + amount
    wallets = sorted(paid)
    return {
        "recipients": wallets,
        "amounts": [paid[w] for w in wallets],
        "recorded_tx_hashes": sorted(set(ledger.get("recorded_tx_hashes", [])) | {tx_hash}),
    }


# ------------------------------------------------------------- alerting
def topup_alert(reason: str, **facts) -> None:
    """Structured WARNING log line. A Cloud Monitoring log-match alert policy
    watches for alert="usat_topup" and emails the wallet owners; the message
    carries the numbers they need. Emitted before paying (would this run be
    short?) and after paying (did it end short / is runway thin?)."""
    print(json.dumps({"severity": "WARNING", "alert": "usat_topup",
                      "message": f"USAT_TOPUP_NEEDED: {reason}", **facts}), flush=True)


# ------------------------------------------------------- fee-currency send
def fee_currency_gas_quote(w3, fee_currency: str) -> tuple[int, int]:
    """(max_fee_per_gas, max_priority_fee_per_gas) denominated in the fee currency."""
    gas_price = int(w3.provider.make_request("eth_gasPrice", [fee_currency])["result"], 16)
    priority = int(w3.provider.make_request("eth_maxPriorityFeePerGas", [fee_currency])["result"], 16)
    return gas_price * 2 + priority, priority


def send_cip64_transfer(w3, account, chain_id: int, nonce: int, token: str, data: bytes,
                        fee_currency: str, max_fee: int, max_priority: int):
    """Send an ERC-20 transfer as a Celo CIP-64 tx (type 0x7b) with gas paid in
    `fee_currency`. web3.py cannot sign this type, so the RLP payload is built
    and signed by hand: 0x7b || rlp([chainId, nonce, maxPriorityFee, maxFee,
    gasLimit, to, value, data, accessList, feeCurrency, yParity, r, s])."""
    import rlp
    from eth_keys import keys
    from eth_utils import keccak, to_canonical_address

    fields = [chain_id, nonce, max_priority, max_fee, FEE_CURRENCY_GAS_LIMIT,
              to_canonical_address(token), 0, data, [], to_canonical_address(fee_currency)]
    signature = keys.PrivateKey(bytes(account.key)).sign_msg_hash(keccak(CIP64_TX_TYPE + rlp.encode(fields)))
    raw = CIP64_TX_TYPE + rlp.encode(fields + [signature.v, signature.r, signature.s])
    return w3.eth.send_raw_transaction(raw)


# ------------------------------------------------------------------ entry
@functions_framework.http
def distribute(request):
    rpc_url = os.environ.get("RPC_URL", "https://forno.celo.org")
    usat_address = os.environ.get("USAT_ADDRESS", USAT_DEFAULT)
    max_per_wallet = int(os.environ.get("MAX_PER_WALLET", "1000000"))
    max_total_per_run = int(os.environ.get("MAX_TOTAL_PER_RUN", "100000000"))
    dry_run = os.environ.get("DRY_RUN", "0") == "1"
    private_key = os.environ["PRIVATE_KEY"]
    dune_key = os.environ["DUNE_API_KEY"]

    local_dir = os.environ.get("LOCAL_STATE_DIR")
    store = LocalStore(local_dir) if local_dir else GcsStore(os.environ["GCS_BUCKET"])

    w3 = Web3(Web3.HTTPProvider(rpc_url))
    account = w3.eth.account.from_key(private_key)
    hot_wallet = account.address
    token = w3.eth.contract(address=Web3.to_checksum_address(usat_address), abi=ERC20_ABI)

    if store.exists(HALT_OBJECT):
        return ({"result": "HALT flag present - nothing done", "hot_wallet": hot_wallet}, 423)

    if not store.acquire_lock():
        return ({"error": "another run holds the lock"}, 423)

    try:
        try:
            rows = fetch_dune_rows(dune_key, hot_wallet, store)
        except DuneStillRunning as pending:
            return (
                {
                    "result": "dune execution still running - next trigger resumes it",
                    "execution_id": pending.execution_id,
                    "dry_run": dry_run,
                },
                202,
            )
        ledger = store.load_ledger()
        owed, ledger = reconcile(rows, ledger)
        if not dry_run:
            store.save_ledger(ledger)  # persist the cleared ledger post-reconcile

        total = sum(owed.values())
        summary = {
            "hot_wallet": hot_wallet,
            "wallets_owed": len(owed),
            "total_usat": total / 1e6,
            "dry_run": dry_run,
        }
        if not owed:
            balance_now = token.functions.balanceOf(hot_wallet).call()
            if balance_now < int(float(os.environ.get("MIN_BALANCE_USAT", "1500")) * 10 ** 6):
                topup_alert("rewards wallet below the runway threshold - top up USAT",
                            wallet=hot_wallet, balance_usat=round(balance_now / 1e6, 2),
                            wallets_owed=0, owed_now_usat=0, topup_needed_usat=0,
                            topup_recommended_usat=round((int(float(os.environ.get("MIN_BALANCE_USAT", "1500")) * 10 ** 6) - balance_now) / 1e6, 2))
            return ({**summary, "result": "nothing owed", "balance_usat": balance_now / 1e6}, 200)

        for wallet, amount in owed.items():
            if amount > max_per_wallet:
                return ({**summary, "error": f"{wallet} owed {amount} > MAX_PER_WALLET"}, 500)
        if total > max_total_per_run:
            return ({**summary, "error": f"total {total} > MAX_TOTAL_PER_RUN, manual review"}, 500)

        token_balance = token.functions.balanceOf(hot_wallet).call()
        gas_balance = w3.eth.get_balance(hot_wallet)
        summary["token_balance_usat"] = token_balance / 1e6
        summary["gas_balance_celo"] = gas_balance / 1e18
        min_gas_wei = int(float(os.environ.get("MIN_GAS_CELO", "1")) * 10 ** 18)
        funded = token_balance >= total and gas_balance >= min_gas_wei

        if dry_run:
            # Dry run reports what a real run would do, funded or not.
            return ({**summary, "result": "dry run - nothing sent", "funded": funded}, 200)

        # Gas mode: CELO when there is enough of it, otherwise pay gas in USA₮
        # via the fee-currency adapter and reserve that gas out of the token balance.
        min_balance = int(float(os.environ.get("MIN_BALANCE_USAT", "1500")) * 10 ** 6)
        fee_currency = os.environ.get("FEE_CURRENCY_ADAPTER", FEE_CURRENCY_ADAPTER_DEFAULT)
        gas_in_usat = gas_balance < min_gas_wei and bool(fee_currency)
        gas_reserve = 0
        if gas_in_usat:
            fc_max_fee, fc_priority = fee_currency_gas_quote(w3, fee_currency)
            # adapter quotes are 18-decimal; USA₮ balances here are 6-decimal
            gas_reserve = len(owed) * FEE_CURRENCY_GAS_LIMIT * fc_max_fee // 10 ** 12
            summary["gas_mode"] = "USAT via fee currency"
            summary["gas_reserve_usat"] = gas_reserve / 1e6
            if token_balance <= gas_reserve:
                needed_now = total + gas_reserve - token_balance
                topup_alert("rewards wallet is empty - cannot even cover gas - top up USAT",
                            wallet=hot_wallet, balance_usat=round(token_balance / 1e6, 2),
                            owed_now_usat=round(total / 1e6, 2), wallets_owed=len(owed),
                            topup_needed_usat=round(needed_now / 1e6, 2),
                            topup_recommended_usat=round((needed_now + min_balance) / 1e6, 2))
                return ({**summary, "error": "no CELO and not enough USAT to even cover gas"}, 500)
            token_balance -= gas_reserve
        else:
            summary["gas_mode"] = "CELO"

        # Pre-run funding check: alert if this run cannot be fully paid, or if
        # the balance left afterwards would fall below the runway threshold.
        needed_now = max(0, total + gas_reserve - token_balance)
        wallet_facts = {"wallet": hot_wallet, "balance_usat": round(token_balance / 1e6, 2),
                        "owed_now_usat": round(total / 1e6, 2), "wallets_owed": len(owed),
                        "gas_reserve_usat": round(gas_reserve / 1e6, 2), "min_balance_usat": min_balance / 1e6,
                        "topup_needed_usat": round(needed_now / 1e6, 2),
                        "topup_recommended_usat": round((needed_now + min_balance) / 1e6, 2)}
        if token_balance < total:
            topup_alert("rewards wallet cannot cover this run - top up USAT", shortfall_usat=round((total - token_balance) / 1e6, 2), **wallet_facts)
        elif token_balance - total < min_balance:
            topup_alert("rewards wallet will drop below the runway threshold after this run - top up USAT", **wallet_facts)
        if token_balance < total:
            # Partial mode: pay as many wallets as the balance covers. Whatever is
            # skipped stays "owed" in the ledger and is paid by a later run once
            # the wallet is topped up — nothing is lost, only delayed.
            summary["partial"] = True
            summary["shortfall_usat"] = (total - token_balance) / 1e6

        if store.exists(HALT_OBJECT):
            return ({**summary, "result": "HALT flag present - nothing sent"}, 423)

        nonce = w3.eth.get_transaction_count(hot_wallet, "pending")
        gas_price = w3.eth.gas_price
        chain_id = w3.eth.chain_id
        paid_count = 0
        paid_total = 0
        skipped_unfunded = 0
        remaining_balance = token_balance
        for wallet, amount in sorted(owed.items()):
            if store.exists(HALT_OBJECT):
                return (
                    {**summary, "paid": paid_count, "result": "HALT flag raised mid-run - stopped"},
                    423,
                )
            if amount > remaining_balance:
                skipped_unfunded += 1
                continue
            # A transient RPC hiccup must not end a 2,000-wallet run. Retry the
            # send a few times; if the transaction was already broadcast, only
            # the receipt wait is retried (re-sending would reuse the nonce).
            tx_hash = None
            receipt = None
            last_error = None
            for attempt in range(4):
                try:
                    if tx_hash is None:
                        nonce = w3.eth.get_transaction_count(hot_wallet, "pending")
                        if gas_in_usat:
                            data = token.encode_abi(abi_element_identifier="transfer",
                                                    args=[Web3.to_checksum_address(wallet), amount])
                            tx_hash = send_cip64_transfer(w3, account, chain_id, nonce, usat_address, bytes.fromhex(data[2:]),
                                                          fee_currency, fc_max_fee, fc_priority)
                        else:
                            tx = token.functions.transfer(
                                Web3.to_checksum_address(wallet), amount
                            ).build_transaction(
                                {"from": hot_wallet, "nonce": nonce, "gas": 100_000, "gasPrice": gas_price, "chainId": chain_id}
                            )
                            tx_hash = w3.eth.send_raw_transaction(account.sign_transaction(tx).raw_transaction)
                    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
                    break
                except Exception as error:  # noqa: BLE001 - log, back off, retry
                    last_error = error
                    print(json.dumps({"severity": "WARNING", "message": f"send attempt {attempt + 1} for {wallet} failed: {str(error)[:300]}",
                                      "tx_hash": Web3.to_hex(tx_hash) if tx_hash else None}), flush=True)
                    time.sleep(5 * (attempt + 1))
            if receipt is None:
                print(json.dumps({"severity": "ERROR", "message": f"giving up on {wallet} after retries: {str(last_error)[:300]}",
                                  "paid_so_far": paid_count}), flush=True)
                return (
                    {**summary, "paid": paid_count, "error": f"send to {wallet} failed: {last_error}"[:500]},
                    500,
                )
            if receipt.status != 1:
                return (
                    {**summary, "paid": paid_count, "error": f"transfer to {wallet} reverted"},
                    500,
                )
            # Record every confirmed payment immediately so a crash mid-run
            # never loses payment memory.
            ledger = ledger_add(ledger, wallet, amount, Web3.to_hex(tx_hash))
            store.save_ledger(ledger)
            nonce += 1
            paid_count += 1
            paid_total += amount
            remaining_balance -= amount

        # Post-run funding check: did the run end short, or is runway now thin?
        balance_after = token.functions.balanceOf(hot_wallet).call()
        if skipped_unfunded:
            still_owed = total - paid_total
            topup_alert("run ended with unpaid wallets because the rewards wallet ran dry - top up USAT",
                        wallet=hot_wallet, balance_usat=round(balance_after / 1e6, 2), paid=paid_count,
                        skipped_unfunded=skipped_unfunded, wallets_owed=skipped_unfunded,
                        owed_now_usat=round(still_owed / 1e6, 2),
                        topup_needed_usat=round(max(0, still_owed - balance_after) / 1e6, 2),
                        topup_recommended_usat=round((max(0, still_owed - balance_after) + min_balance) / 1e6, 2))
        elif balance_after < min_balance:
            topup_alert("rewards wallet below the runway threshold after this run - top up USAT",
                        wallet=hot_wallet, balance_usat=round(balance_after / 1e6, 2), min_balance_usat=min_balance / 1e6,
                        wallets_owed=0, owed_now_usat=0, topup_needed_usat=0,
                        topup_recommended_usat=round((min_balance - balance_after) / 1e6, 2))
        summary["balance_after_usat"] = balance_after / 1e6

        return (
            {
                **summary,
                "result": "paid" if skipped_unfunded == 0 else "paid partially - wallet underfunded",
                "paid": paid_count,
                "skipped_unfunded": skipped_unfunded,
            },
            200,
        )
    finally:
        store.release_lock()
