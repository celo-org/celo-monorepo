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
LOCK_STALE_SECONDS = 3600


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
    owed_out: dict[str, int] = {}
    for row in dune_rows:
        wallet = row["wallet"].lower()
        owed = round(float(row["owed_usat"]) * 1_000_000)
        dune_paid = round(float(row.get("paid_out_usat") or 0) * 1_000_000)
        surplus = max(0, local_paid.get(wallet, 0) - dune_paid)
        remaining = owed - surplus
        if remaining > 0:
            owed_out[wallet] = remaining
    new_ledger = {
        "recipients": [],
        "amounts": [],
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
            return ({**summary, "result": "nothing owed"}, 200)

        for wallet, amount in owed.items():
            if amount > max_per_wallet:
                return ({**summary, "error": f"{wallet} owed {amount} > MAX_PER_WALLET"}, 500)
        if total > max_total_per_run:
            return ({**summary, "error": f"total {total} > MAX_TOTAL_PER_RUN, manual review"}, 500)

        token_balance = token.functions.balanceOf(hot_wallet).call()
        gas_balance = w3.eth.get_balance(hot_wallet)
        summary["token_balance_usat"] = token_balance / 1e6
        summary["gas_balance_celo"] = gas_balance / 1e18
        funded = token_balance >= total and gas_balance >= 10 ** 16  # 0.01 CELO floor

        if dry_run:
            # Dry run reports what a real run would do, funded or not.
            return ({**summary, "result": "dry run - nothing sent", "funded": funded}, 200)

        if token_balance < total:
            return ({**summary, "error": "hot wallet token balance below total"}, 500)
        if gas_balance < 10 ** 16:
            return ({**summary, "error": "hot wallet gas balance below 0.01 CELO"}, 500)

        nonce = w3.eth.get_transaction_count(hot_wallet, "pending")
        gas_price = w3.eth.gas_price
        paid_count = 0
        for wallet, amount in sorted(owed.items()):
            tx = token.functions.transfer(
                Web3.to_checksum_address(wallet), amount
            ).build_transaction(
                {
                    "from": hot_wallet,
                    "nonce": nonce,
                    "gas": 100_000,
                    "gasPrice": gas_price,
                    "chainId": w3.eth.chain_id,
                }
            )
            signed = account.sign_transaction(tx)
            tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
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

        return ({**summary, "result": "paid", "paid": paid_count}, 200)
    finally:
        store.release_lock()
