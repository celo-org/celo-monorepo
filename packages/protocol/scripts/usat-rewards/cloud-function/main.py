"""USA₮ launch rewards distributor — Google Cloud Function (gen2, HTTP).

Scheduled by Cloud Scheduler, this function performs one distribution round:

  1. Acquire a run lock in GCS (prevents overlapping runs) and pin the hot
     wallet: the Dune ledger nets payments per distributor, so a key rotation
     would hide every payout the previous wallet made.
  2. Recover any transfer that was broadcast but whose receipt never reached
     the ledger, so it is never sent a second time.
  3. Trigger a FRESH execution of the public Dune per-account rewards ledger
     (query 7506058) with distributor = the hot wallet. Dune computes
     owed = earned − USA₮ already sent on-chain by the hot wallet.
  4. Reconcile against the paid ledger stored in GCS. Dune's paid column is
     cumulative while the ledger only holds payments made since the last
     fetch, so the ledger stores a Dune baseline and the carried-over
     unindexed surplus — see reconcile() — and each payment is therefore
     subtracted exactly once however long Dune takes to index it.
  5. Safety rails: zero-address rejection, per-wallet cap, per-run total cap,
     token balance and whole-run gas checks.
  6. Send ERC-20 transfers sequentially, persisting the intent before each
     broadcast and the confirmed payment right after, so no crash can lose
     payment memory.

Environment (plain env vars):
  RPC_URL             default https://forno.celo.org
  USAT_ADDRESS        default canonical USA₮ on Celo mainnet
  GCS_BUCKET          bucket for ledger + lock (required unless LOCAL_STATE_DIR)
  LOCAL_STATE_DIR     local dir instead of GCS — for testing only
  MAX_PER_WALLET      micro-USA₮, default 1000000; deploy.sh raises it to the
                      post-bump campaign maximum of 5000000 (5 USA₮)
  MAX_TOTAL_PER_RUN   micro-USA₮, default 100000000 (100 USA₮) — a larger owed
                      total aborts the run for manual review
  MIN_GAS_CELO        CELO floor for gas, default 1; the whole-run estimate is
                      used when it is higher
  FEE_CURRENCY_ADAPTER  USA₮ fee-currency adapter for CIP-64 gas payment
  ALLOW_DISTRIBUTOR_CHANGE  "1" = accept a hot wallet different from the pinned
                      one (only after migrating the payment history)
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
import uuid

import functions_framework
from web3 import Web3
from web3.exceptions import TransactionNotFound
from web3.logs import DISCARD

DUNE_QUERY_ID = 7506058
DUNE_API = "https://api.dune.com/api/v1"
DUNE_PAGE_LIMIT = 32000
USAT_DEFAULT = "0xD2ab3C9A02DBBAB236BfEC45D1d755DF4267F771"
ERC20_ABI = json.loads(
    '[{"name":"transfer","type":"function","stateMutability":"nonpayable",'
    '"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"}],'
    '"outputs":[{"name":"","type":"bool"}]},'
    '{"name":"balanceOf","type":"function","stateMutability":"view",'
    '"inputs":[{"name":"owner","type":"address"}],'
    '"outputs":[{"name":"","type":"uint256"}]},'
    '{"name":"Transfer","type":"event","inputs":['
    '{"name":"from","type":"address","indexed":true},'
    '{"name":"to","type":"address","indexed":true},'
    '{"name":"value","type":"uint256","indexed":false}]}]'
)
LEDGER_OBJECT = "paid-ledger.json"
LOCK_OBJECT = "run-lock.json"
PENDING_OBJECT = "pending-execution.json"
# Intent of the transfer currently in flight: written before the raw tx is sent
# so a lost receipt can be reconciled instead of paid again.
PENDING_TRANSFER_OBJECT = "pending-transfer.json"
# The wallet this state belongs to. Dune's owed is relative to one distributor,
# so mixing wallets in one bucket would resurrect already-paid rewards.
DISTRIBUTOR_OBJECT = "distributor.json"
# Kill switch: while this object exists in the bucket no transfer is sent.
# Create it to stop a running payout within one transfer; delete it to allow
# runs again. Redeploying or deleting the function does NOT stop an in-flight
# request — Cloud Run keeps it alive — so this flag is the only reliable halt.
HALT_OBJECT = "HALT"
LOCK_STALE_SECONDS = 3600
CELO_GAS_LIMIT = 100_000
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


class PendingTransferUnresolved(Exception):
    """A broadcast transfer is neither mined nor dead — nothing may be sent."""

    def __init__(self, tx_hash: str):
        super().__init__(tx_hash)
        self.tx_hash = tx_hash


# ---------------------------------------------------------------- state store
class GcsStore:
    """Ledger + lock in a GCS bucket. The lock is taken with
    if-generation-match so neither a first acquisition nor a stale-lock
    takeover can succeed for two concurrent runs at once."""

    def __init__(self, bucket_name: str):
        from google.cloud import storage

        self.bucket = storage.Client().bucket(bucket_name)
        self.lock_token = uuid.uuid4().hex

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
        payload = json.dumps({"acquired_at": time.time(), "owner": self.lock_token})
        try:
            blob.upload_from_string(payload, if_generation_match=0)
            return True
        except exceptions.PreconditionFailed:
            pass
        blob.reload()
        existing = json.loads(blob.download_as_bytes())
        if time.time() - existing.get("acquired_at", 0) <= LOCK_STALE_SECONDS:
            return False
        try:
            # Conditional on the generation we just read: if another run stole
            # the same stale lock first, our takeover fails instead of letting
            # both runs pay the same wallets.
            blob.upload_from_string(payload, if_generation_match=blob.generation)
            return True
        except exceptions.PreconditionFailed:
            return False

    def release_lock(self) -> None:
        blob = self.bucket.blob(LOCK_OBJECT)
        if not blob.exists():
            return
        blob.reload()
        owner = json.loads(blob.download_as_bytes()).get("owner")
        if owner is not None and owner != self.lock_token:
            return  # another run owns it now; releasing would unlock its payout
        blob.delete(if_generation_match=blob.generation)


class LocalStore:
    """Filesystem store — testing only."""

    def __init__(self, dirpath: str):
        self.dir = dirpath
        self.lock_token = uuid.uuid4().hex
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
        payload = {"acquired_at": time.time(), "owner": self.lock_token}
        try:
            fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.write(fd, json.dumps(payload).encode())
            os.close(fd)
            return True
        except FileExistsError:
            with open(path) as f:
                existing = json.load(f)
            if time.time() - existing.get("acquired_at", 0) > LOCK_STALE_SECONDS:
                with open(path, "w") as f:
                    json.dump(payload, f)
                return True
            return False

    def release_lock(self) -> None:
        path = os.path.join(self.dir, LOCK_OBJECT)
        if not os.path.exists(path):
            return
        with open(path) as f:
            owner = json.load(f).get("owner")
        if owner is not None and owner != self.lock_token:
            return
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


def dune_all_rows(execution_id: str, key: str) -> list[dict]:
    """Read every result page: a truncated ledger would silently drop wallets."""
    rows: list[dict] = []
    offset = 0
    while True:
        page = dune_api(
            f"/execution/{execution_id}/results?limit={DUNE_PAGE_LIMIT}&offset={offset}", key
        )
        batch = page["result"]["rows"]
        rows.extend(batch)
        next_offset = page.get("next_offset")
        if not batch or next_offset is None:
            return rows
        offset = next_offset


def fetch_dune_rows(key: str, distributor: str, store) -> list[dict]:
    # Reuse an execution a previous invocation left running: Dune executions
    # survive our process, so a slow query converges across scheduled retries
    # instead of restarting from zero each time. The distributor is stored with
    # it — an execution computed for another wallet nets the wrong payments.
    pending = store.get_json(PENDING_OBJECT)
    execution_id = None
    if pending:
        if (pending.get("distributor") or "").lower() == distributor.lower():
            execution_id = pending.get("execution_id")
        else:
            store.delete(PENDING_OBJECT)

    if not execution_id:
        # No performance tier requested: Dune picks the largest tier the API
        # plan allows, and deduplicates into an already-running identical query.
        execution = dune_api(
            f"/query/{DUNE_QUERY_ID}/execute",
            key,
            {"query_parameters": {"distributor_address": distributor}},
        )
        execution_id = execution["execution_id"]
        store.put_json(PENDING_OBJECT, {"execution_id": execution_id, "distributor": distributor})

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
    return dune_all_rows(execution_id, key)


# -------------------------------------------------------------- reconcile
def micro(value) -> int:
    return round(float(value or 0) * 1_000_000)


def reconcile(dune_rows: list[dict], ledger: dict) -> tuple[dict[str, int], dict]:
    """Same contract as fetch-recipients.py: Dune's owed minus the payments Dune
    has not indexed yet.

    Dune's `paid_out_usat` is cumulative while the ledger only accumulates
    payments made since the previous fetch, so the two are compared through
    stored state: "dune_paid_baseline" is Dune's cumulative paid at the previous
    fetch (making `now − baseline` the amount indexed since) and "unindexed" is
    the surplus carried over from it. Per wallet
        unindexed' = max(0, unindexed + paid_since_fetch − newly_indexed)
    so a payment is subtracted exactly once however many fetches Dune needs.
    """
    since_fetch = {
        w.lower(): a for w, a in zip(ledger.get("recipients", []), ledger.get("amounts", []))
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
        "dune_paid_baseline": {
            w: new_baseline[w] for w in sorted(new_baseline) if new_baseline[w] > 0
        },
        "recorded_tx_hashes": sorted(ledger.get("recorded_tx_hashes", [])),
    }
    return owed_out, new_ledger


def ledger_add(ledger: dict, wallet: str, amount: int, tx_hash: str) -> dict:
    paid = dict(zip(ledger.get("recipients", []), ledger.get("amounts", [])))
    paid[wallet] = paid.get(wallet, 0) + amount
    wallets = sorted(paid)
    return {
        **ledger,
        "recipients": wallets,
        "amounts": [paid[w] for w in wallets],
        "recorded_tx_hashes": sorted(set(ledger.get("recorded_tx_hashes", [])) | {tx_hash}),
    }


def resolve_pending_transfer(w3, store, token, ledger: dict) -> dict:
    """Fold a transfer that was broadcast but never recorded into the ledger.

    Without this, a receipt lost to a timeout or a killed process leaves a
    confirmed transfer invisible to both Dune (not indexed yet) and the ledger,
    and the next run pays it again.
    """
    pending = store.get_json(PENDING_TRANSFER_OBJECT)
    if not pending:
        return ledger
    try:
        receipt = w3.eth.get_transaction_receipt(pending["tx_hash"])
    except TransactionNotFound:
        receipt = None
    if receipt is None:
        if w3.eth.get_transaction_count(pending["from"], "latest") > pending["nonce"]:
            # The nonce was consumed by a different transaction, so this one can
            # never be mined: dropping the intent cannot lose a real payment.
            store.delete(PENDING_TRANSFER_OBJECT)
            return ledger
        # The nonce is still free, so re-broadcasting the very same signed
        # transaction either confirms the original or is a no-op.
        try:
            w3.eth.send_raw_transaction(Web3.to_bytes(hexstr=pending["raw"]))
        except Exception:  # noqa: BLE001 - "already known" and friends are expected
            pass
        try:
            receipt = w3.eth.wait_for_transaction_receipt(pending["tx_hash"], timeout=120)
        except Exception:  # noqa: BLE001 - still unresolved, decided below
            receipt = None
    if receipt is None:
        # Sending anything now could pay this reward twice; a later trigger
        # retries. Delete the object from the bucket to resolve it by hand.
        raise PendingTransferUnresolved(pending["tx_hash"])
    if receipt.status == 1 and transfer_confirmed(
        token, receipt, pending["from"], pending["wallet"], pending["amount"]
    ):
        ledger = ledger_add(ledger, pending["wallet"], pending["amount"], pending["tx_hash"])
        store.save_ledger(ledger)
    store.delete(PENDING_TRANSFER_OBJECT)
    return ledger


# ------------------------------------------------------- fee-currency send
def fee_currency_gas_quote(w3, fee_currency: str) -> tuple[int, int]:
    """(max_fee_per_gas, max_priority_fee_per_gas) denominated in the fee currency."""
    gas_price = int(w3.provider.make_request("eth_gasPrice", [fee_currency])["result"], 16)
    priority = int(w3.provider.make_request("eth_maxPriorityFeePerGas", [fee_currency])["result"], 16)
    return gas_price * 2 + priority, priority


def build_cip64_transfer(account, chain_id: int, nonce: int, token: str, data: bytes,
                         fee_currency: str, max_fee: int, max_priority: int) -> bytes:
    """Build a signed Celo CIP-64 tx (type 0x7b) whose gas is paid in
    `fee_currency`. web3.py cannot sign this type, so the RLP payload is built
    and signed by hand: 0x7b || rlp([chainId, nonce, maxPriorityFee, maxFee,
    gasLimit, to, value, data, accessList, feeCurrency, yParity, r, s])."""
    import rlp
    from eth_keys import keys
    from eth_utils import keccak, to_canonical_address

    fields = [chain_id, nonce, max_priority, max_fee, FEE_CURRENCY_GAS_LIMIT,
              to_canonical_address(token), 0, data, [], to_canonical_address(fee_currency)]
    signature = keys.PrivateKey(bytes(account.key)).sign_msg_hash(keccak(CIP64_TX_TYPE + rlp.encode(fields)))
    return CIP64_TX_TYPE + rlp.encode(fields + [signature.v, signature.r, signature.s])


def transfer_confirmed(token, receipt, sender: str, wallet: str, amount: int) -> bool:
    """A status-1 receipt is not proof of payment: a token may return false from
    transfer without reverting, so require the matching Transfer event."""
    events = token.events.Transfer().process_receipt(receipt, errors=DISCARD)
    return any(
        event["args"]["from"].lower() == sender.lower()
        and event["args"]["to"].lower() == wallet.lower()
        and event["args"]["value"] == amount
        for event in events
    )


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
        # Dune's owed is relative to one distributor and the ledger only tracks
        # what that wallet still owes, so a silent key rotation would present
        # every reward the old wallet paid as unpaid again.
        pinned = (store.get_json(DISTRIBUTOR_OBJECT) or {}).get("distributor")
        if pinned and pinned.lower() != hot_wallet.lower():
            if os.environ.get("ALLOW_DISTRIBUTOR_CHANGE") != "1":
                return (
                    {
                        "error": f"signer {hot_wallet} differs from the pinned distributor {pinned}; "
                                 "payments made by the pinned wallet would look unpaid. Migrate the "
                                 "state and set ALLOW_DISTRIBUTOR_CHANGE=1 to accept the new wallet.",
                        "hot_wallet": hot_wallet,
                    },
                    500,
                )
        if pinned != hot_wallet:
            store.put_json(DISTRIBUTOR_OBJECT, {"distributor": hot_wallet})

        ledger = store.load_ledger()
        try:
            ledger = resolve_pending_transfer(w3, store, token, ledger)
        except PendingTransferUnresolved as unresolved:
            return (
                {
                    "error": f"transfer {unresolved.tx_hash} was broadcast and is still unresolved; "
                             "nothing sent. A later trigger retries once it is mined or dropped.",
                    "hot_wallet": hot_wallet,
                },
                503,
            )

        try:
            rows = fetch_dune_rows(dune_key, hot_wallet, store)
        except DuneStillRunning as pending:
            # Retryable on purpose: the schedule may be a week away, and a 2xx
            # would make Cloud Scheduler consider this run done.
            return (
                {
                    "result": "dune execution still running - retry resumes it",
                    "execution_id": pending.execution_id,
                    "dry_run": dry_run,
                },
                503,
            )
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
            # A transfer to the zero address burns the reward irreversibly and
            # would then be recorded as paid, so refuse the whole run.
            if int(wallet, 16) == 0:
                return ({**summary, "error": "zero-address recipient in the Dune result"}, 500)
            if amount > max_per_wallet:
                return ({**summary, "error": f"{wallet} owed {amount} > MAX_PER_WALLET"}, 500)
        if total > max_total_per_run:
            return ({**summary, "error": f"total {total} > MAX_TOTAL_PER_RUN, manual review"}, 500)

        token_balance = token.functions.balanceOf(hot_wallet).call()
        gas_balance = w3.eth.get_balance(hot_wallet)
        gas_price = w3.eth.gas_price
        summary["token_balance_usat"] = token_balance / 1e6
        summary["gas_balance_celo"] = gas_balance / 1e18
        # Gas for the WHOLE run, not a flat floor: a prefix of the payouts must
        # never succeed only for the rest to die of an empty gas tank.
        min_gas_wei = int(float(os.environ.get("MIN_GAS_CELO", "1")) * 10 ** 18)
        required_gas_wei = max(min_gas_wei, len(owed) * CELO_GAS_LIMIT * gas_price)
        summary["gas_required_celo"] = required_gas_wei / 1e18
        funded = token_balance >= total and gas_balance >= required_gas_wei

        if dry_run:
            # Dry run reports what a real run would do, funded or not.
            return ({**summary, "result": "dry run - nothing sent", "funded": funded}, 200)

        # Gas mode: CELO when there is enough of it for every transfer in this
        # run, otherwise pay gas in USA₮ via the fee-currency adapter and
        # reserve that gas out of the token balance.
        fee_currency = os.environ.get("FEE_CURRENCY_ADAPTER", FEE_CURRENCY_ADAPTER_DEFAULT)
        gas_in_usat = gas_balance < required_gas_wei and bool(fee_currency)
        gas_reserve = 0
        if gas_in_usat:
            fc_max_fee, fc_priority = fee_currency_gas_quote(w3, fee_currency)
            # Adapter quotes are 18-decimal while USA₮ balances here are
            # 6-decimal, and debitGasFees rounds every transaction's debit up
            # on its own — so reserve the sum of per-transaction ceilings
            # instead of flooring the combined estimate once.
            per_transfer = -(-(FEE_CURRENCY_GAS_LIMIT * fc_max_fee) // 10 ** 12)
            gas_reserve = len(owed) * per_transfer
            summary["gas_mode"] = "USAT via fee currency"
            summary["gas_reserve_usat"] = gas_reserve / 1e6
            if token_balance <= gas_reserve:
                return ({**summary, "error": "no CELO and not enough USAT to even cover gas"}, 500)
            token_balance -= gas_reserve
        else:
            summary["gas_mode"] = "CELO"
        if token_balance < total:
            # Partial mode: pay as many wallets as the balance covers. Whatever is
            # skipped stays "owed" in the ledger and is paid by a later run once
            # the wallet is topped up — nothing is lost, only delayed.
            summary["partial"] = True
            summary["shortfall_usat"] = (total - token_balance) / 1e6

        if store.exists(HALT_OBJECT):
            return ({**summary, "result": "HALT flag present - nothing sent"}, 423)

        nonce = w3.eth.get_transaction_count(hot_wallet, "pending")
        chain_id = w3.eth.chain_id
        paid_count = 0
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
            try:
                if gas_in_usat:
                    data = token.encode_abi(abi_element_identifier="transfer",
                                            args=[Web3.to_checksum_address(wallet), amount])
                    raw = build_cip64_transfer(account, chain_id, nonce, usat_address,
                                               bytes.fromhex(data[2:]), fee_currency,
                                               fc_max_fee, fc_priority)
                else:
                    tx = token.functions.transfer(
                        Web3.to_checksum_address(wallet), amount
                    ).build_transaction(
                        {"from": hot_wallet, "nonce": nonce, "gas": CELO_GAS_LIMIT,
                         "gasPrice": gas_price, "chainId": chain_id}
                    )
                    raw = account.sign_transaction(tx).raw_transaction
                # Persist the intent BEFORE broadcasting: the hash of a signed
                # transaction is already final, so a receipt lost afterwards can
                # be reconciled by the next run instead of paid twice.
                tx_hash = Web3.to_hex(Web3.keccak(raw))
                store.put_json(PENDING_TRANSFER_OBJECT, {
                    "wallet": wallet, "amount": amount, "tx_hash": tx_hash,
                    "nonce": nonce, "from": hot_wallet, "raw": Web3.to_hex(raw),
                })
                w3.eth.send_raw_transaction(raw)
                receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            except Exception as error:  # noqa: BLE001 - surface the RPC reason, keep the ledger intact
                return (
                    {**summary, "paid": paid_count, "error": f"send to {wallet} failed: {error}"[:500]},
                    500,
                )
            if receipt.status != 1 or not transfer_confirmed(token, receipt, hot_wallet, wallet, amount):
                store.delete(PENDING_TRANSFER_OBJECT)
                return (
                    {**summary, "paid": paid_count,
                     "error": f"transfer to {wallet} did not move tokens"},
                    500,
                )
            # Record every confirmed payment immediately so a crash mid-run
            # never loses payment memory.
            ledger = ledger_add(ledger, wallet, amount, tx_hash)
            store.save_ledger(ledger)
            store.delete(PENDING_TRANSFER_OBJECT)
            nonce += 1
            paid_count += 1
            remaining_balance -= amount

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
