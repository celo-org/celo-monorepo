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
  MIN_GAS_CELO        small CELO floor for gas, default 0.05. The whole-run
                      estimate (wallets owed × one transfer's gas) governs
                      whenever it is higher, so keep the floor low enough that
                      the estimate is what actually decides
  FEE_CURRENCY_ADAPTER  USA₮ fee-currency adapter for CIP-64 gas payment; empty
                      disables the fallback, and a gas tank below the estimate
                      then aborts the run instead of starting it
  ALLOW_DISTRIBUTOR_CHANGE  "1" = accept a hot wallet different from the pinned
                      one (only after migrating the payment history)
  DRY_RUN             "1" = report what would be paid, send nothing and write
                      nothing at all to the bucket — neither the pending Dune
                      execution marker nor the run lock, so it can neither
                      change which snapshot a later real run reconciles against
                      nor leave a lock behind. Taking no lock means a report may
                      race a concurrent real run and is informational only
  FUNCTION_TIMEOUT_SECONDS  the Cloud Run request timeout deploy.sh sets,
                      default 3600; the run-lock staleness window derives from it

Secrets (mount via Secret Manager):
  PRIVATE_KEY         hot wallet key
  DUNE_API_KEY        Dune API key

Response: JSON summary {paid, skipped, total_usat, tx, dry_run, ...}.
"""

import fcntl
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
    # "anonymous" is not decoration: web3 subscripts event_abi["anonymous"] when
    # decoding a receipt, and the KeyError from leaving it out is not one of the
    # exceptions process_receipt(errors=DISCARD) swallows — every transfer would
    # fail to confirm.
    '{"name":"Transfer","type":"event","anonymous":false,"inputs":['
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
# A lock may only be broken once the run holding it cannot possibly still be
# alive. Cloud Run keeps a request going until the function timeout, and the
# last transfer of a run can still be waiting for its receipt right at that
# edge — so the staleness window is the deployed timeout plus a margin, never
# the timeout itself. deploy.sh passes the timeout it configures.
FUNCTION_TIMEOUT_SECONDS = int(os.environ.get("FUNCTION_TIMEOUT_SECONDS", "3600"))
LOCK_STALE_SECONDS = FUNCTION_TIMEOUT_SECONDS + 1800
CELO_GAS_LIMIT = 100_000
# Declaring a broadcast transaction dead needs more than one endpoint saying it
# has never heard of the hash: forno load-balances, so a lagging node answers
# "unknown" for a transaction a current node has already mined. Ask several
# times, and only trust a consumed nonce that is already this many blocks deep —
# a node behind by that much cannot serve the historical query at all, so it
# raises instead of misleading us. record-payments.py applies the same rule.
DROP_RECHECKS = int(os.environ.get("DROP_RECHECKS", "3"))
DROP_RECHECK_SECONDS = float(os.environ.get("DROP_RECHECK_SECONDS", "2"))
DROP_CONFIRMATIONS = int(os.environ.get("DROP_CONFIRMATIONS", "32"))
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
    """A broadcast transfer cannot be settled automatically — nothing may be sent."""

    def __init__(self, tx_hash: str, reason: str):
        super().__init__(f"{tx_hash}: {reason}")
        self.tx_hash = tx_hash
        self.reason = reason


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
        self._lock_fd = None
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
        # Temp file + rename: a crash mid-write would otherwise truncate the
        # ledger, which is the only record of payments Dune has not indexed yet.
        path = os.path.join(self.dir, name)
        with open(f"{path}.tmp", "w") as f:
            json.dump(data, f, indent=2)
            f.flush()
            os.fsync(f.fileno())
        os.replace(f"{path}.tmp", path)

    def delete(self, name: str) -> None:
        path = os.path.join(self.dir, name)
        if os.path.exists(path):
            os.remove(path)

    def exists(self, name: str) -> bool:
        return os.path.exists(os.path.join(self.dir, name))

    def acquire_lock(self) -> bool:
        """A kernel advisory lock, held for the lifetime of this run.

        Every lock this store built out of files had the same residual hole:
        judging a lock abandoned and acting on that judgement are two steps, and
        POSIX has no way to replace a name conditionally on what it held when it
        was inspected — so a delayed contender could always end up displacing a
        live claim. flock has no such gap, and the kernel drops the lock when the
        process is gone, which removes the staleness heuristic, the takeover and
        the cleanup race in one go. GcsStore keeps its generation-conditional
        upload: that one really is a compare-and-swap.
        """
        fd = os.open(os.path.join(self.dir, LOCK_OBJECT), os.O_CREAT | os.O_RDWR, 0o644)
        try:
            fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError:
            os.close(fd)
            return False
        # Diagnostics only: the kernel owns the lock, not this content.
        os.ftruncate(fd, 0)
        os.write(fd, json.dumps({"owner": self.lock_token, "pid": os.getpid(),
                                 "acquired_at": time.time()}).encode())
        self._lock_fd = fd
        return True

    def release_lock(self) -> None:
        if self._lock_fd is not None:
            os.close(self._lock_fd)  # closing the descriptor releases the lock
            self._lock_fd = None


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


def fetch_dune_rows(key: str, distributor: str, store, dry_run: bool) -> list[dict]:
    """Rows for this distributor, resuming a previous invocation's execution.

    A dry run reads the bucket but writes nothing to it, this marker included.
    Persisting a dry run's execution would have a later real run resume that
    query instead of starting a fresh one, so it would reconcile against a
    snapshot taken before whatever Dune indexed in between — a report-only mode
    that changes what a real payout sees is not report-only.
    """
    # Reuse an execution a previous invocation left running: Dune executions
    # survive our process, so a slow query converges across scheduled retries
    # instead of restarting from zero each time. The distributor is stored with
    # it — an execution computed for another wallet nets the wrong payments.
    pending = store.get_json(PENDING_OBJECT)
    execution_id = None
    if pending:
        if (pending.get("distributor") or "").lower() == distributor.lower():
            execution_id = pending.get("execution_id")
        elif not dry_run:
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
        if not dry_run:
            store.put_json(PENDING_OBJECT,
                           {"execution_id": execution_id, "distributor": distributor})

    poll_budget = int(os.environ.get("DUNE_POLL_SECONDS", "1200"))
    deadline = time.time() + poll_budget
    while True:
        state = dune_api(f"/execution/{execution_id}/status", key)["state"]
        if state == "QUERY_STATE_COMPLETED":
            break
        if state in ("QUERY_STATE_FAILED", "QUERY_STATE_CANCELLED", "QUERY_STATE_EXPIRED"):
            if not dry_run:
                store.delete(PENDING_OBJECT)
            raise RuntimeError(f"Dune execution {execution_id} ended in {state}")
        if time.time() > deadline:
            # A real run leaves the marker in place and the next trigger resumes
            # it; a dry run only reports the id in its response.
            raise DuneStillRunning(execution_id)
        time.sleep(5)
    if not dry_run:
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
    # Keep the token/chain stamp: it is what stops a rehearsal against a test
    # token from being mistaken for mainnet payment memory, so it has to survive
    # every reconcile.
    for field in ("token", "chain_id"):
        if ledger.get(field) is not None:
            new_ledger[field] = ledger[field]
    return owed_out, new_ledger


def ledger_scope_error(ledger: dict, token_address: str, chain_id: int) -> str | None:
    """Reject payment memory that was written for another token or chain.

    One run with USAT_ADDRESS pointed at a test token against the production
    bucket would otherwise fold rehearsal payments into the mainnet ledger and
    suppress rewards that were never really paid.
    """
    for field, expected in (("token", token_address), ("chain_id", chain_id)):
        actual = ledger.get(field)
        if actual is not None and str(actual).lower() != str(expected).lower():
            return (
                f"ledger is scoped to {field}={actual}, refusing to reconcile {expected}; "
                "use a separate bucket for another chain or token"
            )
    return None


def stamp_ledger(ledger: dict, token_address: str, chain_id: int) -> dict:
    return {**ledger, "token": token_address.lower(), "chain_id": chain_id}


def ledger_add(ledger: dict, wallet: str, amount: int, tx_hash: str) -> dict:
    """Fold one confirmed transfer into the ledger, keyed by its hash: a receipt
    that is read twice — a retry, or an intent whose deletion failed — must not
    count the same payment twice."""
    recorded = set(ledger.get("recorded_tx_hashes", []))
    if tx_hash in recorded:
        return ledger
    paid = dict(zip(ledger.get("recipients", []), ledger.get("amounts", [])))
    paid[wallet] = paid.get(wallet, 0) + amount
    wallets = sorted(paid)
    return {
        **ledger,
        "recipients": wallets,
        "amounts": [paid[w] for w in wallets],
        "recorded_tx_hashes": sorted(recorded | {tx_hash}),
    }


def select_affordable(owed: dict[str, int], balance: int, per_transfer_cost: int) -> dict[str, int]:
    """The transfers a balance can fund — each payout plus that transfer's own
    gas — in the order the send loop walks them.

    Preflight and the send loop must agree on exactly this set: a reserve sized
    for one subset while the loop pays a larger one is how a run pays a prefix
    and then dies debiting gas nothing was reserved for.
    """
    selected: dict[str, int] = {}
    committed = 0
    for wallet, amount in sorted(owed.items()):
        if committed + amount + per_transfer_cost > balance:
            continue
        committed += amount + per_transfer_cost
        selected[wallet] = amount
    return selected


def transfer_is_dropped(w3, pending: dict) -> bool:
    """Is a broadcast transfer definitively gone?

    Neither half of the obvious test proves it on a load-balanced endpoint. A
    node lagging behind answers "unknown" for a transaction a current node has
    already mined, and the nonce query may well be served by that current node —
    so "nonce consumed plus one hash miss" is exactly the combination that
    discards a live payment and pays the reward twice.

    Dead therefore requires two independent things: the hash unknown on every
    one of several separate look-ups, and the nonce already consumed as of a
    block deep enough that a node still serving that query cannot be the lagging
    one. Anything inconclusive keeps the intent.
    """
    try:
        for attempt in range(max(1, DROP_RECHECKS)):
            if attempt:
                time.sleep(DROP_RECHECK_SECONDS)
            try:
                # A known transaction is either mined (blockNumber set) or still
                # queued; neither is dead.
                w3.eth.get_transaction(pending["tx_hash"])
                return False
            except TransactionNotFound:
                pass
            try:
                # Second opinion from the pool: another node may hold the receipt.
                w3.eth.get_transaction_receipt(pending["tx_hash"])
                return False
            except TransactionNotFound:
                pass
        confirmed = w3.eth.block_number - DROP_CONFIRMATIONS
        if confirmed <= 0:
            return False
        return w3.eth.get_transaction_count(pending["from"], confirmed) > pending["nonce"]
    except Exception:  # noqa: BLE001 - an RPC hiccup is not proof of anything
        return False


def resolve_pending_transfer(w3, store, token, ledger: dict, dry_run: bool) -> dict:
    """Fold a transfer that was broadcast but never recorded into the ledger.

    Without this, a receipt lost to a timeout or a killed process leaves a
    confirmed transfer invisible to both Dune (not indexed yet) and the ledger,
    and the next run pays it again.

    A dry run only inspects: it never re-broadcasts, never writes the ledger and
    never clears the intent, so its report describes what a real run would
    settle without touching any of the state.
    """
    pending = store.get_json(PENDING_TRANSFER_OBJECT)
    if not pending:
        return ledger
    tx_hash = pending["tx_hash"]
    if tx_hash in set(ledger.get("recorded_tx_hashes", [])):
        # Already in the ledger; the intent only survived because deleting it
        # failed after the save.
        if not dry_run:
            store.delete(PENDING_TRANSFER_OBJECT)
        return ledger
    try:
        receipt = w3.eth.get_transaction_receipt(tx_hash)
    except TransactionNotFound:
        receipt = None
    if receipt is None:
        if transfer_is_dropped(w3, pending):
            # The nonce was consumed elsewhere and no node has heard of the
            # hash, so this transaction can never be mined: dropping the intent
            # cannot lose a real payment.
            if not dry_run:
                store.delete(PENDING_TRANSFER_OBJECT)
            return ledger
        if dry_run:
            raise PendingTransferUnresolved(
                tx_hash,
                "DRY_RUN may neither re-broadcast it nor write the ledger, so only a "
                "real run can settle it",
            )
        # The nonce is still free, so re-broadcasting the very same signed
        # transaction either confirms the original or is a no-op.
        try:
            w3.eth.send_raw_transaction(Web3.to_bytes(hexstr=pending["raw"]))
        except Exception:  # noqa: BLE001 - "already known" and friends are expected
            pass
        try:
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        except Exception:  # noqa: BLE001 - still unresolved, decided below
            receipt = None
    if receipt is None:
        # Sending anything now could pay this reward twice; a later trigger
        # retries. Delete the object from the bucket to resolve it by hand.
        raise PendingTransferUnresolved(tx_hash, "neither mined nor dropped yet")
    outcome = transfer_outcome(
        token, receipt, pending["from"], pending["wallet"], pending["amount"]
    )
    if receipt.status == 1 and outcome == "mismatch":
        # Tokens moved between the same pair but not the amount the intent
        # records. Keeping the intent is what keeps the discrepancy visible;
        # clearing it would leave a real transfer unrecorded.
        raise PendingTransferUnresolved(
            tx_hash, f"moved an amount other than the recorded {pending['amount']}"
        )
    if receipt.status == 1 and outcome == "confirmed":
        ledger = ledger_add(ledger, pending["wallet"], pending["amount"], tx_hash)
        if not dry_run:
            store.save_ledger(ledger)
    if not dry_run:
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


def transfer_outcome(token, receipt, sender: str, wallet: str, amount: int) -> str:
    """Classify a receipt as "confirmed", "mismatch" or "none".

    A status-1 receipt is not proof of payment: a token may return false from
    transfer without reverting, so the Transfer event decides. "mismatch" means
    tokens did move between this pair but not the amount we meant to record —
    a fee-on-transfer token, say — which needs a human rather than a retry.
    """
    events = token.events.Transfer().process_receipt(receipt, errors=DISCARD)
    same_pair = [
        event
        for event in events
        if event["args"]["from"].lower() == sender.lower()
        and event["args"]["to"].lower() == wallet.lower()
    ]
    if any(event["args"]["value"] == amount for event in same_pair):
        return "confirmed"
    return "mismatch" if same_pair else "none"


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
    chain_id = w3.eth.chain_id

    if store.exists(HALT_OBJECT):
        return ({"result": "HALT flag present - nothing done", "hot_wallet": hot_wallet}, 423)

    # A dry run takes no lock. The lock is persistent bucket state, and a
    # container terminated mid-report would leave it behind for a real run to
    # trip over until the staleness window expired. The trade-off is that a
    # dry-run report can race a concurrent real run, so it is informational
    # only — which is all it claims to be.
    locked = False
    if not dry_run:
        if not store.acquire_lock():
            return ({"error": "another run holds the lock"}, 423)
        locked = True

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
        if pinned != hot_wallet and not dry_run:
            # DRY_RUN reports, it never writes: the pin is taken on the first
            # real run.
            store.put_json(DISTRIBUTOR_OBJECT, {"distributor": hot_wallet})

        ledger = store.load_ledger()
        scope_error = ledger_scope_error(ledger, usat_address, chain_id)
        if scope_error:
            return ({"error": scope_error, "hot_wallet": hot_wallet, "dry_run": dry_run}, 500)
        ledger = stamp_ledger(ledger, usat_address, chain_id)
        try:
            ledger = resolve_pending_transfer(w3, store, token, ledger, dry_run)
        except PendingTransferUnresolved as unresolved:
            return (
                {
                    "error": f"transfer {unresolved.tx_hash} was broadcast and is unresolved "
                             f"({unresolved.reason}); nothing sent.",
                    "hot_wallet": hot_wallet,
                    "dry_run": dry_run,
                },
                503,
            )

        try:
            rows = fetch_dune_rows(dune_key, hot_wallet, store, dry_run)
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

        # Refuse the offending row, not the whole batch: a transfer to the zero
        # address burns the reward irreversibly and a row above the per-wallet cap
        # is a data error, but aborting on either would block every other wallet
        # run after run. They stay owed and are reported instead.
        rejected = []
        payable: dict[str, int] = {}
        for wallet, amount in owed.items():
            if int(wallet, 16) == 0:
                rejected.append({"wallet": wallet, "reason": "zero address"})
            elif amount > max_per_wallet:
                rejected.append(
                    {"wallet": wallet, "reason": f"owed {amount} > MAX_PER_WALLET {max_per_wallet}"}
                )
            else:
                payable[wallet] = amount
        owed = payable

        total = sum(owed.values())
        summary = {
            "hot_wallet": hot_wallet,
            "wallets_owed": len(owed),
            "total_usat": total / 1e6,
            "dry_run": dry_run,
        }
        if rejected:
            summary["rejected"] = rejected
        if not owed:
            return ({**summary, "result": "nothing owed"}, 200)
        if total > max_total_per_run:
            return ({**summary, "error": f"total {total} > MAX_TOTAL_PER_RUN, manual review"}, 500)

        token_balance = token.functions.balanceOf(hot_wallet).call()
        gas_balance = w3.eth.get_balance(hot_wallet)
        gas_price = w3.eth.gas_price
        summary["token_balance_usat"] = token_balance / 1e6
        summary["gas_balance_celo"] = gas_balance / 1e18
        # The floor is deliberately small — it only rules out a dust balance — so
        # that the per-run estimate is what actually decides.
        min_gas_wei = int(float(os.environ.get("MIN_GAS_CELO", "0.05")) * 10 ** 18)
        per_transfer_gas_wei = CELO_GAS_LIMIT * gas_price

        # Which transfers this run can afford and what gas they need are one
        # question, so the token-funded set is chosen FIRST and the CELO estimate
        # priced for exactly those transfers. Estimating for every owed wallet
        # instead made a wallet whose USA₮ covers two of three payouts, with
        # CELO enough for two, either abort or move to fee-currency gas and pay
        # less than it could. Gas is needed per transfer sent, not per wallet
        # owed. All of it is decided before the dry-run report, so the report
        # describes the mode and the set a real run would actually pick.
        fee_currency = os.environ.get("FEE_CURRENCY_ADAPTER", FEE_CURRENCY_ADAPTER_DEFAULT)
        selected = select_affordable(owed, token_balance, 0)
        required_gas_wei = max(min_gas_wei, len(selected) * per_transfer_gas_wei)
        gas_in_usat = False
        fc_max_fee = fc_priority = 0
        per_transfer_usat = 0
        blocked = None
        if gas_balance >= required_gas_wei:
            summary["gas_mode"] = "CELO"
        elif fee_currency:
            # Not enough CELO for the set the tokens fund, so pay gas in USA₮
            # through the adapter. That gas now comes out of the same balance as
            # the payouts, so the affordable set shrinks: choose it again with
            # the per-transfer cost included.
            gas_in_usat = True
            fc_max_fee, fc_priority = fee_currency_gas_quote(w3, fee_currency)
            # Adapter quotes are 18-decimal while USA₮ balances here are
            # 6-decimal, and debitGasFees rounds every transaction's debit up
            # on its own — so reserve the sum of per-transaction ceilings
            # instead of flooring the combined estimate once.
            per_transfer_usat = -(-(FEE_CURRENCY_GAS_LIMIT * fc_max_fee) // 10 ** 12)
            selected = select_affordable(owed, token_balance, per_transfer_usat)
            summary["gas_mode"] = "USAT via fee currency"
        else:
            # Nothing to fall back on. Send what the gas tank really covers
            # rather than refusing the whole run; the rest stays owed.
            covered = gas_balance // per_transfer_gas_wei if gas_balance >= min_gas_wei else 0
            selected = dict(sorted(selected.items())[:covered])
            required_gas_wei = max(min_gas_wei, len(selected) * per_transfer_gas_wei)
            if selected:
                summary["gas_mode"] = "CELO - capped by the gas balance"
            else:
                summary["gas_mode"] = "none - short on CELO with no FEE_CURRENCY_ADAPTER"
                blocked = ("gas balance below the minimum and no FEE_CURRENCY_ADAPTER "
                           "configured - nothing sent")
        gas_reserve = len(selected) * per_transfer_usat
        selected_total = sum(selected.values())
        summary["gas_required_celo"] = required_gas_wei / 1e18
        if gas_in_usat:
            summary["gas_reserve_usat"] = gas_reserve / 1e6
        funded = len(selected) == len(owed)

        if dry_run:
            # Dry run reports what a real run would do, funded or not.
            return ({**summary, "result": "dry run - nothing sent", "funded": funded}, 200)

        if not selected:
            return (
                {**summary, "error": blocked or ("the USAT balance covers no owed transfer"
                                                 + (" plus its gas" if gas_in_usat else ""))},
                500,
            )
        if len(selected) < len(owed):
            # Partial mode: pay as many wallets as the balance covers. Whatever is
            # skipped stays "owed" in the ledger and is paid by a later run once
            # the wallet is topped up — nothing is lost, only delayed.
            summary["partial"] = True
            summary["shortfall_usat"] = (total - selected_total) / 1e6

        if store.exists(HALT_OBJECT):
            return ({**summary, "result": "HALT flag present - nothing sent"}, 423)

        nonce = w3.eth.get_transaction_count(hot_wallet, "pending")
        paid_count = 0
        skipped_unfunded = len(owed) - len(selected)
        remaining_balance = token_balance
        for wallet, amount in sorted(selected.items()):
            if store.exists(HALT_OBJECT):
                return (
                    {**summary, "paid": paid_count, "result": "HALT flag raised mid-run - stopped"},
                    423,
                )
            # The selection above already proved the balance covers this payout
            # and its gas; this only guards against the two drifting apart.
            if amount + per_transfer_usat > remaining_balance:
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
            outcome = transfer_outcome(token, receipt, hot_wallet, wallet, amount)
            if receipt.status == 1 and outcome == "mismatch":
                # Tokens moved but not the amount the intent records. Keep the
                # intent: clearing it would leave a real transfer unrecorded and
                # this wallet would be paid a second time.
                return (
                    {**summary, "paid": paid_count,
                     "error": f"transfer to {wallet} moved an amount other than {amount}; "
                              "its pending intent is kept for manual reconciliation"},
                    500,
                )
            if receipt.status != 1 or outcome != "confirmed":
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
            remaining_balance -= amount + per_transfer_usat

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
        try:
            if locked:
                store.release_lock()
        except Exception as error:  # noqa: BLE001 - any release problem, logged not raised
            # The lock times out on its own, so a failed release (the object was
            # already gone, or another run owns it) must never turn a finished
            # payout into a 500 the scheduler then retries.
            print(f"WARNING: releasing the run lock failed: {error}")
