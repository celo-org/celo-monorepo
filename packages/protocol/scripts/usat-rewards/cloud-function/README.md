# USA₮ Rewards — Cloud Function

Automated version of the distribution flow in the parent directory: a gen2
Google Cloud Function triggered by Cloud Scheduler, paying the P2P (0.20) and
hold (0.30) milestones on a schedule until the campaign budget runs out.

Each run: acquire GCS run-lock → fresh Dune ledger execution (owed = earned −
on-chain paid from the hot wallet) → reconcile against the GCS paid ledger →
safety checks → sequential ERC-20 transfers, each confirmed payment persisted
to the ledger immediately. Same double-payment math as the CLI flow; see the
parent README.

## Deploy

```bash
PROJECT=<gcp-project> \
USAT_PRIVATE_KEY=0x... \
DUNE_API_KEY=... \
./deploy.sh
```

Creates (idempotently): the state bucket, the two Secret Manager secrets, an
invoker service account, a runtime service account with object access to the
bucket and read access to both secrets, the function (`--max-instances 1`, no
unauthenticated access), and a Cloud Scheduler job (default Mondays 09:00 UTC —
override with `SCHEDULE="..."`) retrying up to 5 times with a 5m–1h backoff.
The retries are load-bearing: the function answers 503 whenever the work is
unfinished but resumable — a Dune execution still running, a broadcast transfer
not yet mined — and without them such a run would wait for the next weekly slot.

`--set-env-vars` replaces the function's whole environment, so deploy.sh
restates every setting on each deploy and forwards `MAX_PER_WALLET`,
`MAX_TOTAL_PER_RUN`, `DUNE_POLL_SECONDS`, `MIN_GAS_CELO`,
`FEE_CURRENCY_ADAPTER` and `ALLOW_DISTRIBUTOR_CHANGE` from the deployer's own
environment whenever they are set. A tuned value that is not exported at deploy
time reverts to the code default.

First deploy with `DRY_RUN=1` env on deploy.sh, trigger once, read the JSON
response in the logs, then redeploy with `DRY_RUN=0`. A dry run neither sends
anything nor writes any object in the bucket: it reports what a real run would
do, including a broadcast transfer it would have to settle first.

## Safety rails

The caps come from the deployment, not from the code fallbacks — `deploy.sh`
passes the post-bump campaign values, so these are what is actually enforced:

- `MAX_PER_WALLET` — 5 USA₮ as deployed (code fallback 1 USA₮); a larger owed
  entry aborts the run
- `MAX_TOTAL_PER_RUN` — 5,000 USA₮ as deployed (code fallback 100 USA₮); a
  larger total aborts for manual review. Lower it on the deploy command if a
  tighter rail is wanted.
- Zero-address recipients and rows above `MAX_PER_WALLET` are skipped and listed
  under `rejected` in the response — never paid, but never blocking the wallets
  that are fine either
- The hot wallet is pinned on first run: a later signer change aborts unless
  `ALLOW_DISTRIBUTOR_CHANGE=1`, because Dune's owed is relative to one
  distributor and a rotation would present its payouts as unpaid
- The ledger is stamped with the token and chain it belongs to, and a ledger
  carrying a different stamp is refused: a single run pointed at a test token
  cannot poison the mainnet payment memory
- Gas is checked for the whole run (`len(owed) × 100k × gas price`, floored by
  the small `MIN_GAS_CELO`, default 0.05 CELO), not a flat minimum, so a run
  cannot pay a prefix and then run dry. Without CELO, gas is paid in USA₮ and
  reserved out of the balance — for the transfers the balance can actually fund,
  so an under-funded wallet pays the prefix it can afford rather than aborting.
  With `FEE_CURRENCY_ADAPTER` empty there is no such fallback and too little
  CELO aborts before the first transfer. The gas mode is decided before the
  dry-run report, so `funded`/`gas_mode` describe what a real run would do.
- GCS generation-guarded run lock (takeover also generation-guarded) +
  `--max-instances 1`. It goes stale 30 minutes after the function's own request
  timeout, which deploy.sh passes in as `FUNCTION_TIMEOUT_SECONDS`: a run still
  confirming its last transfer at the timeout edge must not have its lock stolen.
- Each transfer's intent is stored before broadcasting and cleared after the
  payment is recorded, so a lost receipt is reconciled on the next run instead
  of paid twice. A transfer that is neither mined nor dead blocks further
  sending (HTTP 503) until it resolves; `gcloud storage rm
  gs://$PROJECT-usat-rewards/pending-transfer.json` clears it by hand. An intent
  is only discarded once the nonce has moved on *and* no node knows the hash —
  a lagging load-balanced RPC must not make a mined transfer look dropped.
- A status-1 receipt is not enough: a matching `Transfer` event is required
  before a payment is recorded. A transfer that moved a different amount than
  intended keeps its pending intent and stops the run for a human — discarding
  it would leave a real payment unrecorded.
- Failed/reverted transfer stops the run; everything confirmed is already in
  the ledger, so the next scheduled run pays only the remainder

## Emergency stop (kill switch)

Redeploying or deleting the function does **not** stop a payout already in
progress — Cloud Run keeps the in-flight request alive until it finishes or
hits its timeout. The only reliable halt is the `HALT` flag, which the
function checks before every single transfer:

```bash
# stop within one transfer
echo halt | gcloud storage cp - gs://$PROJECT-usat-rewards/HALT
# allow runs again
gcloud storage rm gs://$PROJECT-usat-rewards/HALT
```

While the flag exists every run (scheduled or manual) exits immediately with
HTTP 423 and sends nothing.

## Operations

```bash
# manual trigger
gcloud scheduler jobs run usat-rewards-distributor --project $PROJECT --location $REGION
# logs
gcloud functions logs read usat-rewards-distributor --project $PROJECT --region $REGION --gen2
# state
gcloud storage cat gs://$PROJECT-usat-rewards/paid-ledger.json
```

Keep the hot wallet funded with USA₮ + a little CELO. An underfunded wallet does
**not** make the run a no-op: it pays as many wallets as the balance covers and
reports `partial` with the shortfall, leaving the rest owed for a later run.
Only gas stops a run before the first transfer: too little CELO with no USA₮
left to cover even one transfer plus its fee-currency gas, or too little CELO
with no adapter configured at all. Use the `HALT` flag, not underfunding, to
stop a payout.
