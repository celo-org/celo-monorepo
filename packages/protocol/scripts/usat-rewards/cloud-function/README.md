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
override with `SCHEDULE="..."`).

First deploy with `DRY_RUN=1` env on deploy.sh, trigger once, read the JSON
response in the logs, then redeploy with `DRY_RUN=0`.

## Safety rails

The caps come from the deployment, not from the code fallbacks — `deploy.sh`
passes the post-bump campaign values, so these are what is actually enforced:

- `MAX_PER_WALLET` — 5 USA₮ as deployed (code fallback 1 USA₮); a larger owed
  entry aborts the run
- `MAX_TOTAL_PER_RUN` — 5,000 USA₮ as deployed (code fallback 100 USA₮); a
  larger total aborts for manual review. Lower it on the deploy command if a
  tighter rail is wanted.
- Zero-address recipients in the Dune result abort the run
- The hot wallet is pinned on first run: a later signer change aborts unless
  `ALLOW_DISTRIBUTOR_CHANGE=1`, because Dune's owed is relative to one
  distributor and a rotation would present its payouts as unpaid
- Gas is checked for the whole run (`len(owed) × 100k × gas price`, floored by
  `MIN_GAS_CELO`), not a flat minimum, so a run cannot pay a prefix and then
  run dry. Without CELO, gas is paid in USA₮ and reserved out of the balance.
- GCS generation-guarded run lock (stale after 1h, takeover also
  generation-guarded) + `--max-instances 1`
- Each transfer's intent is stored before broadcasting and cleared after the
  payment is recorded, so a lost receipt is reconciled on the next run instead
  of paid twice. A transfer that is neither mined nor dead blocks further
  sending (HTTP 503) until it resolves; `gcloud storage rm
  gs://$PROJECT-usat-rewards/pending-transfer.json` clears it by hand.
- A status-1 receipt is not enough: a matching `Transfer` event is required
  before a payment is recorded
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
Only an empty gas tank with too little USA₮ to cover gas either stops the run
before the first transfer. Use the `HALT` flag, not underfunding, to stop a
payout.
